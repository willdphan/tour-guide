import sys
import os
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).resolve().parents[3]
sys.path.append(str(project_root))

from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from playwright.async_api import async_playwright
from dotenv import load_dotenv
import nest_asyncio
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

# Enable nested event loops
nest_asyncio.apply()

app = FastAPI()

class Question(BaseModel):
    text: str

class Step(BaseModel):
    thought: str
    action: str
    instruction: str

# Global variable to store the browser instance
browser = None

@app.on_event("startup")
async def startup_event():
    global browser
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=True)

@app.on_event("shutdown")
async def shutdown_event():
    global browser
    if browser:
        await browser.close()

async def run_agent(question: str):
    global browser
    page = await browser.new_page()
    await page.goto("https://tour-guide-liard.vercel.app/")

    # Query Pinecone for relevant information
    pinecone_results = query_pinecone(question)
    relevant_info = "\n".join([result['metadata']['content'] for result in pinecone_results['matches']])

    # Augment the input with relevant information from Pinecone
    augmented_input = f"{question}\n\nRelevant information from Firecrawl docs:\n{relevant_info}"

    event_stream = graph.astream(
        {
            "page": page,
            "input": augmented_input,
            "scratchpad": [],
            "current_url": page.url,
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
        if action == "Click":
            bbox = state["bboxes"][int(action_input[0])]
            element_description = bbox.get("ariaLabel") or bbox.get("text") or f"element of type {bbox.get('type')}"
            instruction = f"Click on the {element_description}."
        elif action == "Type":
            bbox = state["bboxes"][int(action_input[0])]
            element_description = bbox.get("ariaLabel") or bbox.get("text") or f"input field of type {bbox.get('type')}"
            instruction = f"Type '{action_input[1]}' into the {element_description}."
        elif action == "Scroll":
            direction = "up" if action_input[1].lower() == "up" else "down"
            if action_input[0].upper() == "WINDOW":
                instruction = f"Scroll {direction} on the page."
            else:
                bbox = state["bboxes"][int(action_input[0])]
                element_description = bbox.get("ariaLabel") or bbox.get("text") or f"element of type {bbox.get('type')}"
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

        step = Step(thought=thought, action=action, instruction=instruction)
        yield f"data: {json.dumps(step.dict())}\n\n"

        if action.startswith("ANSWER"):
            break

    await page.close()

@app.get("/run-agent/")
async def api_run_agent(question: str):
    async def event_generator():
        async for step in run_agent(question):
            yield step
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)