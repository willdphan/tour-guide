# -*- coding: utf-8 -*-
"""web_voyager.ipynb

Automatically generated by Colab.

Original file is located at
    https://colab.research.google.com/github/albeorla/google-collab-notebooks/blob/main/web_voyager.ipynb
"""

import json
import os
import asyncio
import base64
import platform
import re
from typing import List, Optional, TypedDict
from dotenv import load_dotenv
from urllib.parse import urlparse

from langchain_core.messages import BaseMessage, SystemMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough, RunnableLambda, chain as chain_decorator
from langchain_openai import ChatOpenAI
from langchain import hub
from langgraph.graph import END, StateGraph
from playwright.async_api import Page

# Load environment variables
load_dotenv()

# Set up environment variables
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"] = "Web-Voyager"
os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

# Define types
class BBox(TypedDict):
    x: float
    y: float
    text: str
    type: str
    ariaLabel: str

class Prediction(TypedDict):
    action: str # 
    args: Optional[List[str]]

class AgentState(TypedDict):
    page: Page  # This will now represent the Playwright page object
    input: str
    img: str
    bboxes: List[BBox]  # list of bounding boxes
    prediction: Prediction # another class defined above
    scratchpad: List[BaseMessage] # acts as the memory for the agent
    observation: str
    current_url: str

from pydantic import BaseModel
from typing import List, Optional

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

class AgentResponse(BaseModel):
    steps: List[Step]
    final_answer: Optional[str] = None
    current_url: str

###############
# AGENT TOOLS #
###############

# Define tools
async def click(state: AgentState):
    page: Page = state["page"]
    click_args = state["prediction"]["args"]
    if click_args is None or len(click_args) != 1:
        return f"Failed to click bounding box labeled as number {click_args}"
    bbox_id = int(click_args[0])
    try:
        bbox = state["bboxes"][bbox_id]
    except:
        return f"Error: no bbox for : {bbox_id}"
    x, y = bbox["x"], bbox["y"]
    
    await page.mouse.click(x, y)
    
    return f"Clicked {bbox_id}"

async def type_text(state: AgentState):
    page: Page = state["page"]
    type_args = state["prediction"]["args"]
    if type_args is None or len(type_args) != 2:
        return f"Failed to type in element from bounding box labeled as number {type_args}"
    bbox_id = int(type_args[0])
    bbox = state["bboxes"][bbox_id]
    x, y = bbox["x"], bbox["y"]
    text_content = type_args[1]
    
    await page.mouse.click(x, y)
    await page.keyboard.type(text_content)
    await page.keyboard.press("Enter")
    
    return f"Typed {text_content} and submitted"

async def scroll(state: AgentState):
    page: Page = state["page"]
    scroll_args = state["prediction"]["args"]
    if scroll_args is None or len(scroll_args) != 2:
        return "Failed to scroll due to incorrect arguments."

    target, direction = scroll_args

    if target.upper() == "WINDOW":
        scroll_amount = 500
        scroll_direction = -scroll_amount if direction.lower() == "up" else scroll_amount
        await page.evaluate(f"window.scrollBy(0, {scroll_direction})")
    else:
        scroll_amount = 200
        target_id = int(target)
        bbox = state["bboxes"][target_id]
        x, y = bbox["x"], bbox["y"]
        scroll_direction = -scroll_amount if direction.lower() == "up" else scroll_amount
        await page.mouse.move(x, y)
        await page.mouse.wheel(0, scroll_direction)

    return f"Scrolled {direction} in {'window' if target.upper() == 'WINDOW' else 'element'}"

async def wait(state: AgentState):
    sleep_time = 5
    await asyncio.sleep(sleep_time)
    return f"Waited for {sleep_time}s."

async def go_back(state: AgentState):
    page: Page = state["page"]
    await page.go_back()
    return f"Navigated back a page to {page.url}."

async def to_google(state: AgentState):
    page: Page = state["page"]
    await page.goto("https://google.com")
    return "Navigated to Google."

async def to_home(state: AgentState):
    page: Page = state["page"]
    await page.goto("https://tour-guide-liard.vercel.app/")
    return "Navigated to home page."

# Define mark_page function, THIS MARKS BOUNDING BOXES.
# done with the mark_page.js file
# Read mark_page.js
with open("/Users/williamphan/Desktop/tour/app/api/parse/mark_page.js") as f:
    mark_page_script = f.read()

# decorator for chaining operations
# a way to wrap a function with another function, adding functionality before 
# or after the wrapped function executes
@chain_decorator
async def mark_page(page: Page):
    # Execute the marking script on the page
    await page.evaluate(mark_page_script)
    
    # Try to mark the page up to 10 times
    for _ in range(10):
        try:
            bboxes = await page.evaluate("markPage()")
            break
        except:
            await asyncio.sleep(2)
    
    # Take a screenshot of the marked page
    screenshot = await page.screenshot()
    
    return {
        # encode the screenshot as base64
        "img": base64.b64encode(screenshot).decode(),
        # return the bounding boxes
        "bboxes": bboxes,
    }

# Define agent functions
async def annotate(state):
    marked_page = await mark_page.with_retry().ainvoke(state["page"])
    current_url = state["page"].url
    return {**state, **marked_page, "current_url": current_url}

# define function that takes a state parameter
def format_descriptions(state):
    # initialize an empty list to store formatted labels
    labels = []
    # iterate over bounding boxes in state, with index
    for i, bbox in enumerate(state["bboxes"]):
        # get ariaLabel if it exists, otherwise empty string
        text = bbox.get("ariaLabel") or ""
        # if text is empty or only whitespace, use bbox text instead
        if not text.strip():
            text = bbox["text"]
        # get the type of the element
        el_type = bbox.get("type")
        # append formatted string to labels list
        labels.append(f'{i} (<{el_type}/>): "{text}"')
    # create a string of all labels, joined by newlines
    bbox_descriptions = "\nValid Bounding Boxes:\n" + "\n".join(labels)
    # return updated state with new bbox_descriptions
    return {**state, "bbox_descriptions": bbox_descriptions}

def parse(text: str) -> dict:
    action_prefix = "Action: "
    if not text.strip().split("\n")[-1].startswith(action_prefix):
        return {"action": "retry", "args": f"Could not parse LLM Output: {text}"}
    action_block = text.strip().split("\n")[-1]

    action_str = action_block[len(action_prefix):]
    split_output = action_str.split(" ", 1)
    if len(split_output) == 1:
        action, action_input = split_output[0], None
    else:
        action, action_input = split_output
    action = action.strip()
    if action_input is not None:
        action_input = [inp.strip().strip("[]") for inp in action_input.strip().split(";")]
    return {"action": action, "args": action_input}

"""
crucial for maintaining the agent's "memory" and providing it with a structured history of its interactions. This history is vital for the agent to perform complex, multi-step tasks on web pages, as it allows the agent to reference past actions, understand the current context, and make more informed decisions about what to do next.
"""

def update_scratchpad(state: AgentState):
    # Get the existing scratchpad from the state, if any
    old = state.get("scratchpad")
    
    if old:
        # If there's an existing scratchpad, get its content
        txt = old[0].content
        # Extract the last line of the existing content
        last_line = txt.rsplit("\n", 1)[-1]
        # Extract the step number from the last line and increment it
        step = int(re.match(r"\d+", last_line).group()) + 1
    else:
        # If there's no existing scratchpad, initialize with a header
        txt = "Previous action observations:\n"
        # Start with step 1
        step = 1
    
    # Add the new observation to the text, with the current step number
    txt += f"\n{step}. {state['observation']}"

    # Return updated state with new scratchpad content
    # The scratchpad is a list containing a single SystemMessage
    return {**state, "scratchpad": [SystemMessage(content=txt)]}

# Set up the agent
# https://smith.langchain.com/hub/wfh/web-voyager?organizationId=2fe448c8-5ad1-583b-96a3-e1a7e2c8b466
# prompt = hub.pull("wfh/web-voyager")

custom_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a web navigation assistant. Your task is to guide the user to the Hookalotti page on the Stools & Co website. 
    In each iteration, you will receive an Observation that includes a screenshot of a webpage, some texts, and the current URL. 
    This screenshot will feature Numerical Labels placed in the TOP LEFT corner of each Web Element. 
    Carefully analyze the visual information and the current URL to determine your next action.

    Current goal: Navigate to the Hookalotti page.

    If the current URL contains 'hookalotti', you have reached the target page. Respond with ANSWER in this case.

    Choose one of the following actions:
    1. Click a Web Element.
    2. Delete existing content in a textbox and then type content.
    3. Scroll up or down.
    4. Wait 
    5. Go back
    6. Return to the Stools & Co home page to start over.
    7. Respond with the final answer

    Action should STRICTLY follow the format:
    - Click [Numerical_Label] 
    - Type [Numerical_Label]; [Content] 
    - Scroll [Numerical_Label or WINDOW]; [up or down] 
    - Wait 
    - GoBack
    - Home
    - ANSWER; [content]

    Key Guidelines:
    1) Execute only one action per iteration.
    2) When clicking or typing, ensure to select the correct bounding box.
    3) Numeric labels lie in the top-left corner of their corresponding bounding boxes and are colored the same.
    4) When you have reached the Hookalotti page or completed the task, immediately respond with ANSWER and do not perform any further actions.
    5) Pay close attention to the current URL to determine if you've reached the Hookalotti page.

    Your reply should strictly follow the format:
    Thought: {{Your brief thoughts}}
    Action: {{One Action format you choose}}"""),
    MessagesPlaceholder(variable_name="scratchpad"),
    ("human", "{input}\n\n{bbox_descriptions}\n\nCurrent URL: {current_url}"),
])

# Replace the existing prompt with the custom one
prompt = custom_prompt
llm = ChatOpenAI(model="gpt-4-turbo-2024-04-09", max_tokens=4096)
agent = annotate | RunnablePassthrough.assign(
    # | is used to chain operations together in order
    # StrOutputParser() parses into string, parse processes stirng output into structured format.
    prediction=format_descriptions | prompt | llm | StrOutputParser() | parse
)

####################
# INITIALIZE GRAPH #
####################

# Set up/initialize the graph, pass in the agent state
graph_builder = StateGraph(AgentState)

# define node
graph_builder.add_node("agent", agent)
# sents the agent node to be first node to be excecuted when running
graph_builder.set_entry_point("agent")
# define other node
graph_builder.add_node("update_scratchpad", update_scratchpad)
# define edge between both the nodes
# Agent makes a decision
# An action is taken based on that decision
# The scratchpad is updated with the result of that action
# Control returns to the agent for the next decision
graph_builder.add_edge("update_scratchpad", "agent")

# agent tools
tools = {
    "Click": click,
    "Type": type_text,
    "Scroll": scroll,
    "Wait": wait,
    "GoBack": go_back,
    "Home": to_home, 
}

# Add nodes for each tool and connect them to the scratchpad update
for node_name, tool in tools.items():
    graph_builder.add_node(
        node_name,
        # Combine tool execution with formatting its output
        RunnableLambda(tool) | (lambda observation: {"observation": observation}),
    )
    # After each tool execution, update the scratchpad
    graph_builder.add_edge(node_name, "update_scratchpad")

# Function to select the next action based on the agent's prediction
def select_tool(state: AgentState):
    action = state["prediction"]["action"]
    if action.startswith("ANSWER"):
        return END  # End the process if the action is to answer
    if action == "retry":
        return "agent"  # Go back to the agent if a retry is needed
    return action  # Otherwise, return the action name (corresponding to a tool)

# Add conditional edges from the agent to other nodes based on select_tool function
graph_builder.add_conditional_edges("agent", select_tool)

# Compile the graph, making it ready for execution
graph = graph_builder.compile()

#############
# RUN AGENT #
#############
import os
from pinecone import Pinecone
from pinecone import Pinecone, ServerlessSpec
from openai import OpenAI
from typing import List
import openai
from tenacity import retry, stop_after_attempt, wait_random_exponential, retry_if_exception_type

# Initialize Pinecone
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = os.getenv("PINECONE_INDEX_NAME")

if not index_name:
    raise ValueError("PINECONE_INDEX_NAME environment variable is not set")

# Check if the index exists, if not, create it
try:
    if index_name not in pc.list_indexes().names():
        pc.create_index(
            name=index_name,
            dimension=1536,  # OpenAI's ada-002 embedding dimension
            metric='cosine', # uses cosine similarity
          spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            ) 
        )
    index = pc.Index(index_name)
except Exception as e:
    print(f"Error initializing Pinecone: {str(e)}")
    raise

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@retry(
    wait=wait_random_exponential(min=1, max=60),
    stop=stop_after_attempt(6),
    retry=retry_if_exception_type(openai.RateLimitError)
)
def create_embedding_with_retry(text: str) -> List[float]:
    try:
        response = openai_client.embeddings.create(
            input=text,
            model="text-embedding-ada-002"
        )
        return response.data[0].embedding
    except openai.RateLimitError as e:
        print(f"Rate limit error: {e}")
        raise
    except openai.APIError as e:
        print(f"API error: {e}")
        if "billing_not_active" in str(e):
            print("Please check your OpenAI account billing status at https://platform.openai.com/account/billing")
            raise ValueError("OpenAI account is not active") from e
        raise

def create_embedding(text: str) -> List[float]:
    return create_embedding_with_retry(text)

def upsert_to_pinecone(file_path: str, file_content: str):
    embedding = create_embedding(file_content)
    index.upsert(vectors=[(file_path, embedding, {"content": file_content})])

def query_pinecone(query: str, top_k: int = 5):
    query_embedding = create_embedding(query)
    # Print the query and its embedding
    print(f"Query: {query}")
    print(f"Query Embedding (first 5 dimensions): {query_embedding[:5]}...")
    
    results = index.query(vector=query_embedding, top_k=top_k, include_metadata=True)
    # Print the results
    print("\nTop matching documents:")
    for i, match in enumerate(results['matches'], 1):
        print(f"\n{i}. Score: {match['score']}")
        print(f"   ID: {match['id']}")
        print(f"   Content snippet: {match['metadata']['content'][:100]}...")
    
    return results

def index_documents(directory: str):
    print(f"Indexing documents from {directory}...")
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(('.md', '.json')):
                file_path = os.path.join(root, file)
                with open(file_path, 'r') as f:
                    content = f.read()
                upsert_to_pinecone(file_path, content)
    print(f"Indexing complete for {directory}")

def index_single_file(file_path: str):
    print(f"Indexing single file: {file_path}")
    with open(file_path, 'r') as f:
        content = f.read()
    upsert_to_pinecone(file_path, content)
    print(f"Indexing complete for {file_path}")

"""
The system takes context from all the markdown and JSON files (via Pinecone), and it also uses GPT-4. It's not solely using GPT-4, but rather combining the power of vector search (Pinecone) with the language understanding and generation capabilities of GPT-4.

The reason why the augmented input attached to the question is because:
• The question is augmented with RELEVANT Pinecone data.
• This augmented input is passed to the agent.
• The agent uses the prompt (which includes placeholders for the input and other data) to structure its response.
"""

# Main function to run the agent
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

import logging
import json
from pydantic import BaseModel

from pydantic import BaseModel
from typing import Optional
from pydantic import BaseModel
from typing import Optional

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
import json
import logging
from pydantic import BaseModel
from typing import Optional, Dict

logger = logging.getLogger(__name__)

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

async def run_agent(question: str):
    browserbase = Browserbase()
    page = await asyncio.to_thread(browserbase.load, "http://localhost:3000/")
    logger.debug(f"Navigated to http://localhost:3000/")

    # Query Pinecone for relevant information
    pinecone_results = query_pinecone(question)
    relevant_info = "\n".join([result['metadata']['content'] for result in pinecone_results['matches']])

    # Augment the input with relevant information from Pinecone
    augmented_input = f"{question}\n\nRelevant information from Firecrawl docs:\n{relevant_info}"

    event_stream = graph.astream(
        {
            "page": browserbase,
            "input": augmented_input,
            "scratchpad": [],
            "current_url": browserbase.current_url,
        },
        {
            "recursion_limit": 150,
        },
    )

    async for event in event_stream:
        logger.debug(f"Raw event: {event}")
        if "agent" not in event:
            logger.debug("Skipping non-agent event")
            continue
        
        state = event["agent"]
        pred = state.get("prediction") or {}
        action = pred.get("action")
        action_input = pred.get("args")
        thought = state.get("output", "").split("Thought:", 1)[-1].split("Action:", 1)[0].strip()

        logger.debug(f"Action: {action}, Action Input: {action_input}")
        logger.debug(f"Thought: {thought}")
        logger.debug(f"State bboxes: {state.get('bboxes')}")

        instruction = ""
        element_description = None
        screen_location = None
        hover_before_action = False
        text_input = None

        try:
            if action in ["Click", "Type", "Scroll"]:
                if not action_input:
                    logger.error(f"No action input for {action}")
                else:
                    bbox_id = int(action_input[0])
                    bboxes = state.get("bboxes")
                    if not bboxes:
                        logger.error("No bboxes in state")
                    elif bbox_id >= len(bboxes):
                        logger.error(f"Invalid bbox_id {bbox_id}, max is {len(bboxes) - 1}")
                    else:
                        bbox: Dict = bboxes[bbox_id]
                        element_description = bbox.get("ariaLabel") or bbox.get("text") or f"element of type {bbox.get('type')}"
                        screen_location = ScreenLocation(
                            x=bbox["x"],
                            y=bbox["y"],
                            width=bbox["width"],
                            height=bbox["height"]
                        )
                        hover_before_action = True

                        if action == "Click":
                            instruction = f"Click on the {element_description}."
                        elif action == "Type":
                            instruction = f"Type '{action_input[1]}' into the {element_description}."
                            text_input = action_input[1]
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
        except Exception as e:
            logger.error(f"Error processing action: {str(e)}")

        step = Step(
            thought=thought,
            action=action,
            instruction=instruction,
            element_description=element_description,
            screen_location=screen_location,
            hover_before_action=hover_before_action,
            text_input=text_input
        )
        step_json = step.json()
        logger.debug(f"Yielding step: {step_json}")
        yield f"data: {step_json}\n\n"

        if action.startswith("ANSWER"):
            break

    logger.debug("Page closed")

import asyncio

async def main():
    try:
        # Index Firecrawl docs
        index_documents('src/app/api/metadata/firecrawl.md')
        
        # Index the app-metadata.json file
        index_single_file('src/app/sdk/metadata/app-metadata.json')
        
        # Then run the agent
        await run_agent()
    except openai.AuthenticationError:
        print("Authentication error: Please check your OpenAI API key.")
    except openai.APIError as e:
        print(f"OpenAI API error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {str(e)}")
        import traceback
        traceback.print_exc()

# Main execution block
if __name__ == "__main__":
    asyncio.run(main())