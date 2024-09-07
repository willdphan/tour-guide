# -*- coding: utf-8 -*-
"""web_voyager.ipynb
http://localhost:3000
Automatically generated by Colab.

uvicorn src.app.api.api:app --reload   

WORKS WHEN ASKING FOR CHICKEN PAGE!!    
"""

import json
import os
import asyncio
import base64
import platform
import re
from typing import List, Optional, TypedDict, Dict
from dotenv import load_dotenv
from urllib.parse import urlparse

from langchain_core.messages import BaseMessage, SystemMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough, RunnableLambda, chain as chain_decorator
from langchain_openai import ChatOpenAI
from langchain import hub
from langgraph.graph import END, StateGraph
from playwright.async_api import Page, async_playwright

import bs4
from bs4 import BeautifulSoup
from collections import Counter

from pydantic import BaseModel

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
    page_height: int
    viewport_height: int
    html_content: str
    text_content: str
    content_analysis: dict

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
    page = state["page"]
    click_args = state["prediction"]["args"]
    if click_args is None or len(click_args) != 1:
        return f"Failed to click element with ID {click_args}"
    element_id = int(click_args[0])
    elements = state["content_analysis"]["elements"]
    if element_id < 0 or element_id >= len(elements):
        return f"Invalid element ID: {element_id}"
    element = elements[element_id]
    
    selector = None
    if element['html_id']:
        selector = f"#{element['html_id']}"
    elif element['name']:
        selector = f"[name='{element['name']}']"
    elif element['href']:
        selector = f"a[href='{element['href']}']"
    else:
        selector = f"{element['type']}:has-text('{element['text']}')"
    
    try:
        print(f"Attempting to click element with selector: {selector}")
        
        # First, try to scroll the element into view
        await page.evaluate(f"""
            (selector) => {{
                const element = document.querySelector(selector);
                if (element) {{
                    element.scrollIntoView({{behavior: 'smooth', block: 'center', inline: 'center'}});
                }}
            }}
        """, selector)
        
        # Wait a bit for any animations to complete
        await page.wait_for_timeout(1000)
        
        # Now try to click the element
        await page.click(selector, timeout=5000)
        
        return f"Clicked element with ID {element_id}"
    except Exception as e:
        print(f"Failed to click element with ID {element_id}: {str(e)}")
        print(f"Element details: {json.dumps(element, indent=2)}")
        
        # If click fails, try to execute click via JavaScript
        try:
            await page.evaluate(f"""
                (selector) => {{
                    const element = document.querySelector(selector);
                    if (element) {{
                        element.click();
                    }}
                }}
            """, selector)
            return f"Clicked element with ID {element_id} using JavaScript"
        except Exception as js_e:
            return f"Failed to click element with ID {element_id} even with JavaScript: {str(js_e)}"

async def type_text(state: AgentState):
    page = state["page"]
    type_args = state["prediction"]["args"]
    if type_args is None or len(type_args) != 2:
        return f"Failed to type in element from bounding box labeled as number {type_args}"
    bbox_id = int(type_args[0])
    bbox = state["bboxes"][bbox_id]
    x, y = bbox["x"], bbox["y"]
    text_content = type_args[1]
    await page.mouse.click(x, y)
    select_all = "Meta+A" if platform.system() == "Darwin" else "Control+A"
    await page.keyboard.press(select_all)
    await page.keyboard.press("Backspace")
    await page.keyboard.type(text_content)
    await page.keyboard.press("Enter")
    return f"Typed {text_content} and submitted"

async def scroll(state: AgentState):
    page = state["page"]
    scroll_args = state["prediction"]["args"]
    if scroll_args is None or len(scroll_args) != 2:
        return "Failed to scroll due to incorrect arguments. Please specify target and direction."

    target, direction = scroll_args

    if target.upper() == "WINDOW":
        vertical_scroll_amount = 500
        horizontal_scroll_amount = 300
        if direction.lower() == "up":
            scroll_x, scroll_y = 0, -vertical_scroll_amount
        elif direction.lower() == "down":
            scroll_x, scroll_y = 0, vertical_scroll_amount
        elif direction.lower() == "left":
            scroll_x, scroll_y = -horizontal_scroll_amount, 0
        elif direction.lower() == "right":
            scroll_x, scroll_y = horizontal_scroll_amount, 0
        else:
            return f"Invalid scroll direction: {direction}"
        await page.evaluate(f"window.scrollBy({scroll_x}, {scroll_y})")
    else:
        try:
            target_id = int(target)
            bbox = state["bboxes"][target_id]
            x, y = bbox["x"], bbox["y"]
            vertical_scroll_amount = 200
            horizontal_scroll_amount = 100
            if direction.lower() == "up":
                delta_x, delta_y = 0, -vertical_scroll_amount
            elif direction.lower() == "down":
                delta_x, delta_y = 0, vertical_scroll_amount
            elif direction.lower() == "left":
                delta_x, delta_y = -horizontal_scroll_amount, 0
            elif direction.lower() == "right":
                delta_x, delta_y = horizontal_scroll_amount, 0
            else:
                return f"Invalid scroll direction: {direction}"
            await page.mouse.move(x, y)
            await page.mouse.wheel(delta_x, delta_y)
        except ValueError:
            return f"Invalid target for scrolling: {target}"
        except IndexError:
            return f"Invalid bounding box ID: {target}"

    return f"Scrolled {direction} in {'window' if target.upper() == 'WINDOW' else f'element {target}'}"

async def wait(state: AgentState):
    sleep_time = 5
    await asyncio.sleep(sleep_time)
    return f"Waited for {sleep_time}s."

async def go_back(state: AgentState):
    page = state["page"]
    await page.go_back()
    return f"Navigated back a page to {page.url}."

async def to_google(state: AgentState):
    page = state["page"]
    await page.goto("https://google.com")
    return "Navigated to Google."

async def to_home(state: AgentState):
    page = state["page"]
    await page.goto("https://tour-guide-liard.vercel.app/")
    return "Navigated to home page."

async def enhanced_content_analysis(page):
    html_content = await page.content()
    soup = BeautifulSoup(html_content, 'html.parser')
    
    elements = []
    for idx, element in enumerate(soup.find_all(['a', 'button', 'input', 'div', 'span'])):
        element_info = {
            'id': idx,
            'type': element.name,
            'text': element.text.strip(),
            'href': element.get('href'),
            'class': element.get('class'),
            'html_id': element.get('id'),
            'name': element.get('name')
        }
        elements.append(element_info)
    
    # Extract other information as before
    headings = [{'level': h.name, 'text': h.text.strip()} for h in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])]
    links = [{'text': a.text.strip(), 'href': a.get('href'), 'title': a.get('title')} for a in soup.find_all('a', href=True)]
    images = [{'src': img.get('src'), 'alt': img.get('alt')} for img in soup.find_all('img')]
    
    # Extract form information
    forms = []
    for form in soup.find_all('form'):
        form_data = {
            'action': form.get('action'),
            'method': form.get('method'),
            'inputs': []
        }
        for input_tag in form.find_all('input'):
            form_data['inputs'].append({
                'type': input_tag.get('type'),
                'name': input_tag.get('name'),
                'placeholder': input_tag.get('placeholder')
            })
        forms.append(form_data)
    
    # Extract buttons
    buttons = [{'text': btn.text.strip(), 'type': btn.get('type')} for btn in soup.find_all('button')]
    
    # Extract div and span content
    div_content = [{'class': div.get('class'), 'id': div.get('id'), 'text': div.text.strip()} for div in soup.find_all('div') if div.text.strip()]
    span_content = [{'class': span.get('class'), 'id': span.get('id'), 'text': span.text.strip()} for span in soup.find_all('span') if span.text.strip()]
    
    # Extract structured data
    structured_data = {}
    for script in soup.find_all('script', {'type': 'application/ld+json'}):
        try:
            data = json.loads(script.string)
            if isinstance(data, list):
                for item in data:
                    if '@type' in item:
                        structured_data[item['@type']] = item
            elif '@type' in data:
                structured_data[data['@type']] = data
        except json.JSONDecodeError:
            pass
    
    # Extract meta tags
    meta_tags = {meta.get('name', meta.get('property', meta.get('http-equiv', ''))) : meta.get('content', '') for meta in soup.find_all('meta')}
    
    # Extract main content
    main_content = soup.find('main').text.strip() if soup.find('main') else ''
    
    # Extract navigation items
    nav_items = [a.text.strip() for a in soup.find_all('nav') if a.text.strip()]
    
    # Extract keywords
    words = soup.get_text(separator=' ', strip=True).lower().split()
    word_freq = Counter(words)
    keywords = [word for word, freq in word_freq.most_common(10) if len(word) > 3]
    
    return {
        'elements': elements,
        'headings': headings,
        'links': links,
        'images': images,
        'forms': forms,
        'buttons': buttons,
        'div_content': div_content,
        'span_content': span_content,
        'structured_data': structured_data,
        'meta_tags': meta_tags,
        'main_content': main_content,
        'nav_items': nav_items,
        'keywords': keywords,
        'text_content': soup.get_text(separator=' ', strip=True)
    }

# Define agent functions
async def annotate(state):
    current_url = state["page"].url
    html_content = await state["page"].content()
    text_content = await state["page"].evaluate("() => document.body.innerText")
    content_analysis = await enhanced_content_analysis(state["page"])
    return {**state, "current_url": current_url, "html_content": html_content, "text_content": text_content, "content_analysis": content_analysis}

def format_descriptions(state):
    content_analysis = state.get('content_analysis', {})
    formatted_analysis = f"""
    Page Elements:
    {', '.join([f"<{e['type']} id={e['id']}>{e['text'][:30]} href={e['href']}" for e in content_analysis.get('elements', []) if e['type'] in ['a', 'button', 'input']][:20])}
    
    Buttons:
    {', '.join([f"<button id={e['id']}>{e['text'][:30]}" for e in content_analysis.get('elements', []) if e['type'] == 'button'][:10])}
    
    Inputs:
    {', '.join([f"<input id={e['id']} type={e.get('id_attr', '')}" for e in content_analysis.get('elements', []) if e['type'] == 'input'][:10])}
    
    Headings: {', '.join([f"{h['level']}: {h['text']}" for h in content_analysis.get('headings', [])][:5])}
    
    Links: {', '.join([f"{link['text']} ({link['href']})" for link in content_analysis.get('links', [])][:5])}
    
    Images: {', '.join([f"{img['alt']} ({img['src']})" for img in content_analysis.get('images', [])][:5])}
    
    Forms: {', '.join([f"Action: {form['action']}, Method: {form['method']}" for form in content_analysis.get('forms', [])][:3])}
    
    Div Content: {', '.join([f"{div['text'][:30]}..." for div in content_analysis.get('div_content', [])][:5])}
    
    Span Content: {', '.join([f"{span['text'][:30]}..." for span in content_analysis.get('span_content', [])][:5])}
    
    Meta Tags: {', '.join([f"{k}: {v}" for k, v in list(content_analysis.get('meta_tags', {}).items())[:5]])}
    
    Navigation Items: {', '.join(content_analysis.get('nav_items', [])[:5])}
    
    Keywords: {', '.join(content_analysis.get('keywords', [])[:10])}
    
    Main Content Summary: {content_analysis.get('main_content', '')[:200]}...
    """
    
    action_history = state.get("action_history", [])
    formatted_history = "\n".join([f"{a['step']}. {a['action']} {a['args']} (URL: {a['url']})" for a in action_history])
    
    page_info = f"Page height: {state['page_height']}px, Viewport height: {state['viewport_height']}px"
    
    text_summary = state['text_content'][:500] + "..." if len(state['text_content']) > 500 else state['text_content']
    
    return {
        **state, 
        "action_history": formatted_history, 
        "page_info": page_info, 
        "text_summary": text_summary,
        "content_analysis": formatted_analysis
    }

def parse(text: str) -> dict:
    action_prefix = "Action: "
    lines = text.strip().split("\n")
    action_line = next((line for line in reversed(lines) if line.startswith(action_prefix)), None)
    
    if not action_line:
        return {"action": "retry", "args": f"Could not parse LLM Output: {text}"}
    
    action_str = action_line[len(action_prefix):]
    split_output = action_str.split(" ", 1)
    if len(split_output) == 1:
        action, action_input = split_output[0], None
    else:
        action, action_input = split_output
    action = action.strip()
    if action_input is not None:
        action_input = [inp.strip().strip("[]") for inp in action_input.strip().split(";")]
    return {"action": action, "args": action_input}

def update_scratchpad(state: AgentState):
    old = state.get("scratchpad")
    action_history = state.get("action_history", [])
    
    if old and old[0].content:
        txt = old[0].content
        last_line = txt.rsplit("\n", 1)[-1]
        match = re.match(r"\d+", last_line)
        if match:
            step = int(match.group()) + 1
        else:
            step = len(action_history) + 1
    else:
        txt = "Previous action observations:\n"
        step = 1
    
    txt += f"\n{step}. {state['observation']}"
    
    action_history.append({
        "step": step,
        "action": state['prediction']['action'],
        "args": state['prediction']['args'],
        "url": state['current_url']
    })
    
    action_history = action_history[-10:]
    
    return {**state, "scratchpad": [SystemMessage(content=txt)], "action_history": action_history}

# Set up the agent
custom_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a web navigation assistant. Your task is to guide the user based on their specific query or request. 
    In each iteration, you will receive an Observation that includes HTML content analysis and the current URL. 
    Analyze the HTML content to determine your next action, regardless of whether elements are visible on the screen or not.

    You have access to enhanced content analysis, including:
    - Detailed page elements (links, buttons, inputs, divs, spans) with their text content and attributes
    - Each element has a unique ID that you can use for interactions

    Use this information to make informed decisions about navigation and interaction.
    You can interact with any element present in the HTML, even if it's not currently visible on the screen.

    Current goal: {input}

    Choose one of the following actions:
    1. Click a Web Element (use the element ID from the content analysis).
    2. Type content into an input field.
    3. Wait for page load.
    4. Go back to the previous page.
    5. Return to the home page to start over.
    6. Respond with the final answer

    Action should STRICTLY follow the format:
    - Click [Element_ID] 
    - Type [Element_ID]; [Content] 
    - Wait 
    - GoBack
    - Home
    - ANSWER; [content]

    Key Guidelines:
    1) Execute only one action per iteration.
    2) When clicking or typing, use the element ID from the content analysis.
    3) You can interact with any element present in the HTML, regardless of its visibility on the screen.
    4) Pay close attention to the current URL and HTML structure to determine if you've reached the desired page or information.
    5) If you find yourself in a loop, try a different approach or consider ending the task.

    Your reply should strictly follow the format:
    Thought: {{Your brief thoughts}}
    Action: {{One Action format you choose}}"""),
    MessagesPlaceholder(variable_name="scratchpad"),
    ("human", "{input}\n\nCurrent URL: {current_url}\n\nEnhanced Content Analysis:\n{content_analysis}\n\nAction History:\n{action_history}"),
])

prompt = custom_prompt
llm = ChatOpenAI(model="gpt-4o-mini", max_tokens=4096)
agent = annotate | RunnablePassthrough.assign(
    prediction=format_descriptions | prompt | llm | StrOutputParser() | parse
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

async def run_agent(question: str, page=None):
    try:
        if page is None:
            # If page is not provided, create a new browser and page
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=False)
                page = await browser.new_page()
                try:
                    async for step in _run_agent_with_page(question, page):
                        yield step
                finally:
                    await browser.close()
        else:
            # If page is provided, use it directly
            async for step in _run_agent_with_page(question, page):
                yield step
    except Exception as e:
        # print(f"Error during agent execution: {str(e)}")
        # import traceback
        # traceback.print_exc()
        yield {
            "thought": "Error occurred",
            "action": "ERROR",
            "instruction": f"An error occurred: {str(e)}",
            "element_description": None,
            "screen_location": None,
            "hover_before_action": False,
            "text_input": None
        }

async def _run_agent_with_page(question: str, page):
    # Hardcode the start_url
    start_url = "http://localhost:3000"
    
    print(f"Navigating to start_url: {start_url}")
    await page.goto(start_url, timeout=60000)
    print(f"Navigated to {start_url}")
    
    # Instead of querying Pinecone, we'll analyze the current page
    current_page_info = await enhanced_content_analysis(page)
    relevant_info = f"Current page information:\n{json.dumps(current_page_info, indent=2)}"

    augmented_input = f"Goal: {question}\n\nRelevant information from current page:\n{relevant_info}"

    event_stream = graph.astream(
        {
            "page": page,
            "input": augmented_input,
            "scratchpad": [],
            "current_url": page.url,
            "action_history": [],
            "html_content": "",
            "text_content": "",
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

        print(f"Current action: {action}")
        print(f"Action input: {action_input}")
        print(f"Current URL: {state['current_url']}")
        # print(f"HTML content length: {len(state.get('html_content', ''))}")
        # print(f"Content analysis: {json.dumps(state.get('content_analysis', {}), indent=2)}")

        # Add this check
        if action is None:
            print(f"Warning: Received null action. Full prediction: {pred}")
            continue

        action_history = state.get("action_history", [])
        if action_history and action_history[-1]["action"] == action and action_history[-1]["args"] == action_input:
            print("Repeated action detected. Skipping.")
            continue

        instruction = ""
        element_description = None
        screen_location = None
        hover_before_action = False
        text_input = None

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
                instruction = "Go back to home page."
            elif action.startswith("ANSWER"):
                final_answer = action_input[0] if action_input else "Task completed, but no specific answer provided."
                yield {
                    "thought": thought,
                    "action": "FINAL_ANSWER",
                    "instruction": f"Task completed. Final answer: {final_answer}",
                    "element_description": None,
                    "screen_location": None,
                    "hover_before_action": False,
                    "text_input": None
                }
                break
            else:
                instruction = f"{action} {action_input}"
        except Exception as e:
            print(f"Error processing action: {str(e)}")

        step_info = {
            "thought": thought,
            "action": action,
            "instruction": instruction,
            "element_description": element_description,
            "screen_location": screen_location,
            "hover_before_action": hover_before_action,
            "text_input": text_input
        }

        # Yield the step information and wait for permission
        proceed = yield step_info

        # Only execute the action if permission is granted
        if proceed:
            if action == "Click":
                await click(state)
            elif action == "Type":
                await type_text(state)
            elif action == "Scroll":
                await scroll(state)
            elif action == "Wait":
                await asyncio.sleep(5)
            elif action == "GoBack":
                await page.go_back()
            elif action == "Home":
                await page.goto("http://localhost:3000/")
            elif action.startswith("ANSWER"):
                break
        else:
            print("Action skipped due to lack of permission.")

        if action.startswith("ANSWER"):
            break

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        try:
            while True:
                question = input("Enter your question (or 'quit' to exit): ")
                if question.lower() == 'quit':
                    break

                try:
                    agent_generator = run_agent(question, page)
                    
                    async for step in agent_generator:
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

                        if step['action'] == "FINAL_ANSWER":
                            print("Task completed!")
                            break

                        # Ask for permission to proceed
                        permission = input("Do you want to proceed with this action? (y/n): ").lower().strip()
                        proceed = permission == 'y'

                        # Send the permission back to the generator
                        try:
                            await agent_generator.asend(proceed)
                        except StopAsyncIteration:
                            break

                except Exception as e:
                    print(f"Error in agent execution: {str(e)}")
                    import traceback
                    traceback.print_exc()

                print("Agent has completed this task. You can ask another question or type 'quit' to exit.")
                print("The browser will remain open for the next question or manual interaction.")

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