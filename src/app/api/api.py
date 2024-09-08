"""
uvicorn src.app.api.api:app --reload --port 8000
"""

import sys
import os
from pathlib import Path
import traceback

from fastapi.middleware.cors import CORSMiddleware

# Add the project root to the Python path
project_root = Path(__file__).resolve().parents[3]
sys.path.append(str(project_root))

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from dotenv import load_dotenv
import json
from fastapi import FastAPI, Query

# Import the run_agent function from web_tour_html.py
from src.app.api.web_tour_html import run_agent
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow your frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

class AgentRequest(BaseModel):
    question: str
    currentUrl: str

from playwright.async_api import async_playwright
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.post("/api/run-agent/")
async def api_run_agent(request: AgentRequest):
    logger.info(f"Received question: {request.question}")
    
    async def event_generator():
        try:
            logger.info(f"Starting agent with question: {request.question}")
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                try:
                    await page.goto(request.currentUrl, timeout=60000)
                    agent_generator = run_agent(request.question, page)
                    
                    async for step in agent_generator:
                        action = step.get('action', 'Unknown')
                        logger.info(f"Agent action: {action}")
                        yield f"data: {json.dumps(step)}\n\n"
                        
                        if action == "FINAL_ANSWER":
                            logger.info("Agent finished with final answer")
                            break

                        # if action == "WAIT_FOR_PERMISSION":
                        #     logger.info("Waiting for user permission")
                        
                        await asyncio.sleep(0.1)
                    
                    yield "data: [DONE]\n\n"
                finally:
                    await browser.close()
            
        except Exception as e:
            logger.error(f"Error in agent execution: {str(e)}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# class PermissionRequest(BaseModel):
#     proceed: bool

# @app.post("/api/run-agent/permission")
# async def handle_permission(request: PermissionRequest):
#     if request.proceed:
#         # Implement logic to continue the agent's execution
#         return {"message": "Permission granted, proceeding with action"}
#     else:
#         # Implement logic to stop the agent's execution
#         return {"message": "Permission denied, stopping agent"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)