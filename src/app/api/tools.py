import asyncio
import json
import platform
from bs4 import BeautifulSoup
from .types import AgentState
from .extract import (
    extract_elements,
    extract_buttons,
    extract_headings,
    extract_links,
    extract_images,
    extract_forms,
    extract_structured_data,
    extract_meta_tags,
    extract_main_content,
    extract_text_content,
    extract_keywords
)

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
    sleep_time = 2
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

    return {
        'elements': extract_elements(soup),
        'headings': extract_headings(soup),
        'links': extract_links(soup),
        'images': extract_images(soup),
        'forms': extract_forms(soup),
        'buttons': extract_buttons(soup),
        'structured_data': extract_structured_data(soup),
        'meta_tags': extract_meta_tags(soup),
        'main_content': extract_main_content(soup),
        'keywords': extract_keywords(soup),
        'text_content': extract_text_content(soup)
    }