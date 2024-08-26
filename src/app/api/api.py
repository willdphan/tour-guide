import sys
import os
from pathlib import Path
import traceback

# Add the project root to the Python path
project_root = Path(__file__).resolve().parents[3]
sys.path.append(str(project_root))

from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from dotenv import load_dotenv
import json

# Import necessary functions and classes from your existing code
from src.app.api.web_tour_guide import (
    graph, AgentState, query_pinecone, index_documents, index_single_file,
    Pinecone, OpenAI
)

# Load environment variables
load_dotenv()

# Initialize Pinecone and OpenAI clients
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = os.getenv("PINECONE_INDEX_NAME")
index = pc.Index(index_name)
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

class ScreenLocation(BaseModel):
    x: float
    y: float
    width: float
    height: float

class Step(BaseModel):
    thought: str
    action: str
    instruction: str
    element_description: Optional[str] = None
    screen_location: Optional[ScreenLocation] = None
    hover_before_action: bool = False
    text_input: Optional[str] = None

# Global variable to store the browser instance
browser = None

from playwright.async_api import async_playwright

@app.on_event("startup")
async def startup_event():
    global browser
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch()

@app.on_event("shutdown")
async def shutdown_event():
    global browser
    if browser:
        await browser.close()

async def run_agent(question: str):
    global browser
    
    page = await browser.new_page()
    
    try:
        await page.goto("http://localhost:3000/", timeout=60000)
        
        pinecone_results = query_pinecone(question)
        relevant_info = "\n".join([result['metadata']['content'] for result in pinecone_results['matches']])
        augmented_input = f"{question}\n\nRelevant information from Firecrawl docs:\n{relevant_info}"

        event_stream = graph.astream(
            {
                "page": page,
                "input": augmented_input,
                "scratchpad": [],
                "current_url": "http://localhost:3000/",
            },
            {
                "recursion_limit": 150,
            },
        )

        async for event in event_stream:
            if "agent" not in event:
                continue
            state = event["agent"]
            pred = state.get("prediction") or {}
            action = pred.get("action")
            action_input = pred.get("args")
            thought = state.get("output", "").split("Thought:", 1)[-1].split("Action:", 1)[0].strip()

            instruction = ""
            element_description = None
            screen_location = None
            hover_before_action = False
            text_input = None

            if action in ["Click", "Type", "Scroll"]:
                if action_input and len(action_input) > 0:
                    bbox_id = int(action_input[0])
                    bbox = state["bboxes"][bbox_id]
                    element_description = bbox.get("ariaLabel") or bbox.get("text") or f"element of type {bbox.get('type')}"
                    screen_location = ScreenLocation(
                        x=bbox["x"],
                        y=bbox["y"],
                        width=bbox.get("width", 0),
                        height=bbox.get("height", 0)
                    )
                    hover_before_action = True

                    if action == "Click":
                        instruction = f"Click on the {element_description}."
                    elif action == "Type":
                        text_input = action_input[1]
                        instruction = f"Type '{text_input}' into the {element_description}."
                    elif action == "Scroll":
                        direction = "up" if action_input[1].lower() == "up" else "down"
                        instruction = f"Scroll {direction} in the {element_description}."
            elif action == "Wait":
                instruction = "Wait for a moment while the page loads."
            elif action == "GoBack":
                instruction = "Go back to the previous page."
            elif action == "Home":
                instruction = "Go back to the Stools & Co home page."
            elif action.startswith("ANSWER"):
                instruction = f"Task completed. Answer: {action_input[0]}"
            else:
                instruction = f"{action} {action_input}"

            step = Step(
                thought=thought,
                action=action,
                instruction=instruction,
                element_description=element_description,
                screen_location=screen_location.dict() if screen_location else None,
                hover_before_action=hover_before_action,
                text_input=text_input
            )
            yield f"data: {json.dumps(step.dict())}\n\n"

            if action.startswith("ANSWER"):
                break

    except Exception as e:
        print(f"An error occurred: {str(e)}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
    finally:
        await page.close()

import logging

logger = logging.getLogger(__name__)

@app.get("/api/run-agent/")
async def api_run_agent(question: str):
    async def event_generator():
        try:
            async for step in run_agent(question):
                yield f"data: {json.dumps(step)}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            print(f"Error in event_generator: {str(e)}")
            print(traceback.format_exc())
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

async def run_agent(question: str):
    # Your agent logic here
    # This is a placeholder, replace with your actual agent logic
    steps = [
        {"thought": "", "action": "Click", "instruction": f"Click on the result for '{question}'.", "element_description": "Search result", "screen_location": {"x": 500, "y": 300, "width": 100, "height": 30}, "hover_before_action": True, "text_input": None},
        {"thought": "", "action": "ANSWER;", "instruction": f"Task completed. Answer: Found information about {question}.", "element_description": None, "screen_location": None, "hover_before_action": False, "text_input": None}
    ]

    for step in steps:
        await asyncio.sleep(1)  # Simulate some processing time
        yield step

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)