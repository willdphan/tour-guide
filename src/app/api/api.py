import sys
import os
from pathlib import Path
import traceback

from fastapi.middleware.cors import CORSMiddleware


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
from fastapi import FastAPI, Query

# Import the run_agent function from web_tour_guide.py
from src.app.api.web_tour_guide import run_agent as web_tour_guide_run_agent

# Load environment variables
load_dotenv()

app = FastAPI()

# Add CORS middleware
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

@app.post("/api/run-agent/")
async def api_run_agent(request: AgentRequest):
    print(f"Received question: {request.question}")
    print(f"Received currentUrl: {request.currentUrl}")
    
    async def event_generator():
        try:
            print(f"Starting web_tour_guide_run_agent with start_url: {request.currentUrl}")
            async for step in web_tour_guide_run_agent(request.question, request.currentUrl):
                yield f"data: {json.dumps(step)}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            print(f"Error in event_generator: {str(e)}")
            print(traceback.format_exc())
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)