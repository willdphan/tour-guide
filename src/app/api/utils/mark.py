import asyncio
import base64
# Define mark_page function, THIS MARKS BOUNDING BOXES.
# done with the mark_page.js file
import os
from .extract import enhanced_content_analysis
from langchain_core.runnables import chain as chain_decorator

# Construct the path to mark_page.js relative to the current file
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
mark_page_js_path = os.path.join(project_root, 'src', 'app', 'mark_page.js')

# Read mark_page.js
try:
    with open(mark_page_js_path, "r") as f:
        mark_page_script = f.read()
except FileNotFoundError:
    print(f"Error: Could not find mark_page.js at {mark_page_js_path}")
    mark_page_script = ""  # Set to empty string or handle this error as appropriate for your application


# decorator for chaining operations
# a way to wrap a function with another function, adding functionality before 
# or after the wrapped function executes
@chain_decorator
# asynchronous function to mark elements on the page
async def mark_page(page):
    # execute the marking script on the page
    await page.evaluate(mark_page_script)
    # try to mark the page up to 10 times
    for _ in range(30):
        try:
            # execute the markPage function and get bounding boxes
            bboxes = await page.evaluate("markPage()")
            # exit loop if successful
            break
        except:
            # wait for 3 seconds before retrying
            await asyncio.sleep(2)
    # take a screenshot of the marked page
    screenshot = await page.screenshot()
    # # remove the markings from the page
    # await page.evaluate("unmarkPage()")
    # return the screenshot and bounding boxes
    return {
        # encode the screenshot as base64
        "img": base64.b64encode(screenshot).decode(),
        # return the bounding boxes
        "bboxes": bboxes,
    }

# Define agent functions
async def annotate(state):
    current_url = state["page"].url
    html_content = await state["page"].content()
    text_content = await state["page"].evaluate("() => document.body.innerText")
    content_analysis = await enhanced_content_analysis(state["page"])
    marked_page = await mark_page.with_retry().ainvoke(state["page"])
    screenshot = marked_page["img"]

    return {**state, **marked_page, "current_url": current_url, "html_content": html_content, "text_content": text_content, "content_analysis": content_analysis, "screenshot": screenshot}
