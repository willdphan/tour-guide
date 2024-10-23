"""
Classes for representing web page elements, agent states, and automation steps.
"""

from typing import List, Optional, TypedDict
from langchain_core.messages import BaseMessage
from playwright.async_api import Page
from pydantic import BaseModel

class BBox(TypedDict):
    x: float
    y: float
    text: str
    type: str
    ariaLabel: str

class Prediction(TypedDict):
    action: str
    args: Optional[List[str]]

class AgentState(TypedDict):
    page: Page
    input: str
    img: str
    bboxes: List[BBox]
    prediction: Prediction
    scratchpad: List[BaseMessage]
    observation: str
    current_url: str
    action_history: List[dict]
    viewport_height: int
    html_content: str
    text_content: str
    content_analysis: dict
    screenshot: Optional[str]  # Base64 encoded screenshot

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
    screen_location: Optional[dict] = None
    hover_before_action: bool = False
    text_input: Optional[str] = None
    duration: float = 2.0  # Default duration in seconds

class AgentResponse(BaseModel):
    steps: List[Step]
    final_answer: Optional[str] = None
    current_url: str