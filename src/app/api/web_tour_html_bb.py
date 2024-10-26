# -*- coding: utf-8 -*-
"""web_voyager.ipynb
http://localhost:3000
Automatically generated by Colab.

uvicorn src.app.api.api:app --reload   
Able to recognize elemnts not visible on page.

User inputs a question or task.
An AI agent analyzes the current web page and decides on an action.
The chosen action (click, type, scroll, etc.) is executed using Playwright.
The page's response is observed and fed back to the agent.
This process repeats until the task is completed or an error occurs.
The agent provides a final answer to the user.
"""

import os
import asyncio
import base64
import re
from dotenv import load_dotenv
from langgraph.graph import END

from langchain_core.messages import  SystemMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from playwright.async_api import async_playwright, Error as PlaywrightError
from browserbase import Browserbase

from .prompts import custom_prompt, initial_response_prompt, personable_prompt
from .utils.extract import parse, format_descriptions, enhanced_content_analysis
from .utils.mark import annotate, mark_page
from langchain.schema.runnable import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda
import asyncio
from .types import AgentState

# Or, if you prefer explicit imports:
from .utils.tools import (
    click,
    type_text,
    scroll,
    wait,
    go_back,
    to_google,
    to_home,
)

# Load environment variables
load_dotenv()
# Initialize Browserbase
browserbase = Browserbase()

# Set up environment variables
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"] = "Web-Voyager"
os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

# At the top of the file, after the imports
DEFAULT_URL = "tour-guide-jw46.vercel.app"

"""
The update_scratchpad function manages an agent's recent actions and observations during web navigation. It appends the latest observation to a text log and adds the current action to a history list. 

The function handles step numbering, limits the history to the last 10 entries, and updates the agent's state. This process maintains a concise record of the agent's recent activities, providing essential context for future decision-making.
"""
def update_scratchpad(state: AgentState):
    # Get current scratchpad and action history
    old = state.get("scratchpad")
    action_history = state.get("action_history", [])
    
    if old and old[0].content:
        # Extract existing content and determine next step number
        txt = old[0].content
        last_line = txt.rsplit("\n", 1)[-1]
        match = re.match(r"\d+", last_line)
        if match:
            step = int(match.group()) + 1
        else:
            step = len(action_history) + 1
    else:
        # Initialize scratchpad if it's empty
        txt = "Previous action observations:\n"
        step = 1
    
    # Add new observation to scratchpad
    txt += f"\n{step}. {state['observation']}"
    
    # Record the current action in history
    action_history.append({
        "step": step,
        "action": state['prediction']['action'],
        "args": state['prediction']['args'],
        "url": state['current_url']
    })
    
    # Keep only the last 10 actions in history
    action_history = action_history[-10:]
    
    # Return updated state with new scratchpad and action history
    return {**state, "scratchpad": [SystemMessage(content=txt)], "action_history": action_history}

##########
# PROMPT #
##########
# TODO: put into separate file
# Use a vision-capable model
llm = ChatOpenAI(model="gpt-4o-mini", max_tokens=4096)

prompt = custom_prompt

# Create an async wrapper for mark_page
async def async_mark_page(state):
    marked_page = await mark_page(state["page"])
    return {**state, **marked_page}

# Modify the agent definition
agent = (
    annotate 
    | RunnablePassthrough.assign(
        prediction=format_descriptions | prompt | llm | StrOutputParser() | parse
    )
    | RunnableLambda(lambda x: asyncio.get_event_loop().run_until_complete(async_mark_page(x)))
)

####################
# INITIALIZE GRAPH #
####################

# Set up/initialize the graph
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
        # combine tool execution with formatting its output
        # bridge between regular Python functions and LangGraph's runnable ecosystem
        RunnableLambda(tool) | (lambda observation: {"observation": observation}),
    )
    # After each tool execution, update the scratchpad
    graph_builder.add_edge(node_name, "update_scratchpad")

# Function to select the next action based on the agent's prediction
def select_tool(state: AgentState):
    action = state["prediction"]["action"]
    print(f"Selecting tool for action: {action}")  # Add this line for debugging

    if action.startswith("ANSWER"):
        print("Ending execution with ANSWER")  # Add this line
        return END

    if action == "retry":
        print("Retrying with agent")  # Add this line
        return "agent"

    if action in tools:
        print(f"Selected tool: {action}")  # Add this line
        return action

    print(f"Unknown action: {action}. Defaulting to agent.")  # Add this line
    return "agent"  # Default to agent if action is unknown

# Add conditional edges from the agent to other nodes based on select_tool function
graph_builder.add_conditional_edges("agent", select_tool)

# Compile the graph, making it ready for execution
graph = graph_builder.compile()

#############
# RUN AGENT #
#############
async def run_agent(question: str, page=None, current_url=None, browserbase_instance=None):
    # Add this function to generate an initial response
    def generate_initial_response(question: str):
        llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.7)
        response = llm.predict(initial_response_prompt.format(question=question))
        return response.strip()

    # Generate and yield the initial response
    initial_response = generate_initial_response(question)

    yield {
        "action": "INITIAL_RESPONSE",
        "instruction": initial_response,
        "element_description": None,
        "screen_location": None,
        "hover_before_action": False,
        "text_input": None
    }

    if page is None:
        # If page is not provided, create a new browser and page using Browserbase
        async with async_playwright() as p:
            browser = await p.chromium.connect_over_cdp(browserbase_instance.get_connect_url())
            context = await browser.new_context(ignore_https_errors=True)
            page = await context.new_page()
            
            # Use the provided current_url or default to DEFAULT_URL
            start_url = current_url or DEFAULT_URL
            
            # Ignore specific console messages
            page.on("console", lambda msg: None if "message channel closed before a response was received" in msg.text.lower() else print(f"Console: {msg.text}"))
            
            # max timeout for each full page loads
            page.set_default_navigation_timeout(30000)
            # max timeout for agent action
            page.set_default_timeout(15000)
            
            try:
                async for step in _run_agent_with_page(question, page, start_url, browserbase_instance):
                    yield step
            finally:
                await browser.close()
    else:
        # If page is provided, use it directly
        start_url = current_url or page.url
        async for step in _run_agent_with_page(question, page, start_url, browserbase_instance):
            yield step


# Modify the prepare_image_for_llm function to return a dict format suitable for the vision model
def prepare_image_for_llm(base64_image):
    return {
        "type": "image_url",
        "image_url": f"data:image/jpeg;base64,{base64_image}"
    }

def generate_personable_instruction(action, element_description, text_input):
    llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.7)
    response = llm.predict(personable_prompt.formtat(action=action, element_description=element_description, text_input=text_input))
    return response.strip()

async def _run_agent_with_page(question: str, page, start_url, browserbase_instance):
    print(f"Navigating to start_url: {start_url}")
    await page.goto(start_url, timeout=60000)
    print(f"Navigated to {start_url}")
    
    # Capture initial screenshot and metadata
    screenshot = browserbase_instance.screenshot(start_url, full_page=True)
    current_page_info = await enhanced_content_analysis(page)
    
    event_stream = graph.astream(
        {
            "page": page,
            "input": question,
            "scratchpad": [],
            "current_url": start_url,
            "action_history": [],
            "html_content": await page.content(),
            "text_content": await page.evaluate("() => document.body.innerText"),
            "screenshot": prepare_image_for_llm(base64.b64encode(screenshot).decode()),
            "content_analysis": current_page_info,
            "browserbase_instance": browserbase_instance,
        },
        {
            "recursion_limit": 150,
        },
    )

    final_answer_sent = False

    async for event in event_stream:
        if "agent" not in event:
            continue
        
        state = event["agent"]
        full_response = state.get("output", "")
        print(f"Full model response: {full_response}")
        
        pred = state.get("prediction") or {}
        action = pred.get("action")
        action_input = pred.get("args")
        thought = full_response.split("Thought:", 1)[-1].split("Action:", 1)[0].strip()

        # Check if we've already sent a FINAL_ANSWER
        if final_answer_sent:
            continue

        print(f"Current action: {action}")
        print(f"Action input: {action_input}")
        print(f"Current URL: {state['current_url']}")

        # Add this check
        if action is None:
            print(f"Warning: Received null action. Full prediction: {pred}")
            continue
        
        # get action history, check if current action is identical to last action
        # if repetitive, print statement
        action_history = state.get("action_history", [])
        if action_history and action_history[-1]["action"] == action and action_history[-1]["args"] == action_input:
            print("Repeated action detected. Skipping.")
            continue
        
        # variables initialized prior to current action
        instruction = ""
        element_description = None
        screen_location = None
        hover_before_action = False
        text_input = None

        # It essentially translates the agent's decisions into executable web 
        # interactions and user-readable instructions.
        try:
            if action in ["Click", "Type", "Scroll"]:
                if action_input:
                    element_id = int(action_input[0])
                    elements = state["content_analysis"]["elements"]
                    if element_id < 0 or element_id >= len(elements):
                        instruction = f"Invalid element ID: {element_id}"
                    else:
                        element = elements[element_id]
                        element_description = element['text']
                        
                        # Get the bounding box of the element
                        """
                        It returns an object with the element's position (x, y) and size (width, height) relative to the entire document - not just the visible viewport!

                        By knowing the exact position of an element, the code can determine if scrolling is necessary to bring the element into view.
                        """
                        bbox = await page.evaluate(f"""() => {{
                            const element = document.querySelector('[id="{element['html_id']}"]') || 
                                            document.querySelector('[name="{element['name']}"]') ||
                                            document.querySelector('a[href="{element['href']}"]') ||
                                            document.querySelector('{element['type']}:has-text("{element['text']}")');
                            if (element) {{
                                const rect = element.getBoundingClientRect();
                                return {{
                                    x: rect.left + window.pageXOffset,
                                    y: rect.top + window.pageYOffset,
                                    width: rect.width,
                                    height: rect.height
                                }};
                            }}
                            return null;
                        }}""")
                        
                        if bbox:
                            screen_location = bbox
                            hover_before_action = True

                        if action == "Click":
                            instruction = generate_personable_instruction("Click", element_description, None)
                        elif action == "Type":
                            text_input = action_input[1]
                            instruction = generate_personable_instruction("Type", element_description, text_input)
                        elif action == "Scroll":
                            direction = action_input[1].lower()
                            instruction = generate_personable_instruction("Scroll", element_description, direction)

            elif action == "Wait":
                instruction = generate_personable_instruction("Wait", None, None)
            elif action == "GoBack":
                instruction = generate_personable_instruction("GoBack", None, None)
            elif action == "Home":
                instruction = generate_personable_instruction("Home", None, None)
            elif action.startswith("ANSWER"):
                final_answer_sent = True  # Set the flag when sending FINAL_ANSWER
                instruction =  generate_personable_instruction(action_input[0], None, None) if action_input else generate_personable_instruction("Answer", None, None)
                
            else:
                instruction = generate_personable_instruction(action, None, str(action_input))
        except Exception as e:
            print(f"Error processing action: {str(e)}")

        # encapsulate all relevant info about action being taken
        step_info = {
            "thought": thought,
            "action": action,
            "instruction": instruction,
            "element_description": element_description,
            "screen_location": screen_location,
            "hover_before_action": hover_before_action,
            "text_input": text_input
        }

        # Yield the step information one step at a time
        # like return, but instead of ending the function, it gives you a value and pauses
        yield step_info

        try:
            if action == "Click":
                await click(state)
            elif action == "Type":
                await type_text(state)
            elif action == "Scroll":
                await scroll(state)
            elif action == "Wait":
                await asyncio.sleep(0) # 0 wait time
            elif action == "GoBack":
                await page.go_back()
            elif action == "Home":
                await page.goto(DEFAULT_URL)
            elif action.startswith("ANSWER"):
                break
            
            # After each action, update the state with new screenshot and metadata
            screenshot = browserbase_instance.screenshot(page.url, full_page=True)
            current_page_info = await enhanced_content_analysis(page)
            state.update({
                "screenshot": prepare_image_for_llm(base64.b64encode(screenshot).decode()),
                "content_analysis": current_page_info,
                "html_content": await page.content(),
                "text_content": await page.evaluate("() => document.body.innerText"),
                "current_url": page.url,
            })

        
        # error handling
        except PlaywrightError as e:
            if "message channel closed before a response was received" in str(e).lower():
                print(f"Ignoring known Playwright error during action: {e}")
                continue
            else:
                print(f"Playwright error during action: {e}")
                yield {
                    "thought": "Error occurred",
                    "action": "ERROR",
                    "instruction": f"An error occurred during the action: {str(e)}",
                    "element_description": None,
                    "screen_location": None,
                    "hover_before_action": False,
                    "text_input": None
                }
        except Exception as e:
            print(f"Unexpected error during action: {e}")
            yield {
                "thought": "Error occurred",
                "action": "ERROR",
                "instruction": f"An unexpected error occurred during the action: {str(e)}",
                "element_description": None,
                "screen_location": None,
                "hover_before_action": False,
                "text_input": None
            }

        if final_answer_sent:
            break  # Exit the loop after sending FINAL_ANSWER
            # LINK CHANGE HERE
async def main(current_url=DEFAULT_URL):
    browserbase = Browserbase()
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(browserbase.get_connect_url())
        page = await browser.new_page()
        await page.goto(current_url)
        try:
            while True:
                question = input("Enter your question (or 'quit' to exit): ")
                if question.lower() == 'quit':
                    break

                try:
                    # Pass the current_url and browserbase instance to run_agent
                    agent_generator = run_agent(question, page, current_url, browserbase)
                    
                    async for step in agent_generator:
                        if step['action'] == "INITIAL_RESPONSE":
                            print(f"Initial Response: {step['instruction']}")
                        else:
                            print(f"Thought: {step['thought']}")
                            print(f"Action: {step['action']}")
                            print(f"Instruction: {step['instruction']}")
                            if step['element_description']:
                                print(f"Element Description: {step['element_description']}")
                            if step['screen_location']:
                                print(f"Screen Location: {step['screen_location']}")
                            if step['hover_before_action']:
                                print("Hovering before action")
                            if step['text_input']:
                                print(f"Text Input: {step['text_input']}")
                        print("---")  # Separator between steps

                        if step['action'].startswith("ANSWER"):
                            print("Task completed!")
                            # Update current_url after task completion
                            current_url = page.url
                            break

                except Exception as e:
                    print(f"Error in agent execution: {str(e)}")
                    import traceback
                    traceback.print_exc()

                print("Agent has completed this task. You can ask another question or type 'quit' to exit.")
                print("The browser will remain open for the next question or manual interaction.")
                print(f"Current URL: {current_url}")

        except KeyboardInterrupt:
            print("\nExiting program...")
        except Exception as e:
            print(f"An unexpected error occurred: {str(e)}")
            import traceback
            traceback.print_exc()
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())

