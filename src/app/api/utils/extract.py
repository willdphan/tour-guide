"""
Utility file that contains functions for extracting and analyzing different elements from a webpage's HTML content. It uses BeautifulSoup to parse HTML and extract various components 
"""

from collections import Counter
import json
from langchain_core.runnables import RunnablePassthrough, RunnableLambda, chain as chain_decorator
from bs4 import BeautifulSoup

def extract_elements(soup):
    elements = []
    for idx, element in enumerate(soup.find_all(['a', 'button', 'input', 'div', 'span', 'nav'])):
        elements.append({
            'id': idx,
            'type': element.name,
            'text': element.text.strip(),
            'href': element.get('href'),
            'class': element.get('class'),
            'html_id': element.get('id'),
            'name': element.get('name')
        })
    return elements

def extract_buttons(soup):
    return [{'text': btn.text.strip(), 'type': btn.get('type')} for btn in soup.find_all('button')]

def extract_headings(soup):
    return [{'level': h.name, 'text': h.text.strip()} for h in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])]

def extract_links(soup):
    return [{'text': a.text.strip(), 'href': a.get('href'), 'title': a.get('title')} for a in soup.find_all('a', href=True)]

def extract_images(soup):
    return [{'src': img.get('src'), 'alt': img.get('alt')} for img in soup.find_all('img')]

def extract_forms(soup):
    forms = []
    for form in soup.find_all('form'):
        forms.append({
            'action': form.get('action'),
            'method': form.get('method'),
            'inputs': [{'type': input_tag.get('type'), 'name': input_tag.get('name'), 'placeholder': input_tag.get('placeholder')} 
                       for input_tag in form.find_all('input')]
        })
    return forms

def extract_structured_data(soup):
    structured_data = {}
    for script in soup.find_all('script', {'type': 'application/ld+json'}):
        try:
            data = json.loads(script.string)
            if isinstance(data, list):
                structured_data.update({item['@type']: item for item in data if '@type' in item})
            elif '@type' in data:
                structured_data[data['@type']] = data
        except json.JSONDecodeError:
            pass
    return structured_data

def extract_meta_tags(soup):
    return {meta.get('name', meta.get('property', meta.get('http-equiv', ''))) : meta.get('content', '') 
            for meta in soup.find_all('meta')}

def extract_main_content(soup):
    main = soup.find('main')
    return main.text.strip() if main else ''

def extract_text_content(soup):
    return soup.get_text(separator=' ', strip=True)

def extract_keywords(soup):
    text_content = extract_text_content(soup)
    words = text_content.lower().split()
    word_freq = Counter(words)
    return [word for word, freq in word_freq.most_common(10) if len(word) > 3]

"""
This function is designed to extract and structure the action and its arguments from the output of a language model (LLM). Here's what it does:

1. It looks for the last line in the input text that starts with "Action: ".
2. If found, it extracts the action and any associated arguments from this line.
3. The action is the first word after "Action: ".
4. Any additional words are considered arguments. Multiple arguments are separated by semicolons.
5. It cleans up the extracted data by removing extra whitespace and brackets.
6. If no action is found, it returns a "retry" action with an error message.
7. The function returns a dictionary with two keys:
    "action": The extracted action (a string)
    "args": The extracted arguments (a list of strings, or None if no arguments)
"""

def parse(text: str) -> dict:
    # Define the prefix that indicates the start of an action
    action_prefix = "Action: "
    
    # Split the input text into lines
    lines = text.strip().split("\n")
    
    # Find the last line that starts with "Action: "
    action_line = next((line for line in reversed(lines) if line.startswith(action_prefix)), None)
    
    # If no action line is found, return a retry action
    if not action_line:
        return {"action": "retry", "args": f"Could not parse LLM Output: {text}"}
    
    # Remove the "Action: " prefix from the action line
    action_str = action_line[len(action_prefix):]
    
    # Split the action string into action and input (if any)
    split_output = action_str.split(" ", 1)
    if len(split_output) == 1:
        action, action_input = split_output[0], None
    else:
        action, action_input = split_output
    
    # Strip any whitespace from the action
    action = action.strip()
    
    # If there's action input, process it
    if action_input is not None:
        action_input = [inp.strip().strip("[]") for inp in action_input.strip().split(";")]
    
    # Return the parsed action and arguments
    return {"action": action, "args": action_input}


"""
Takes the raw data from the extraction functions and formats it to make more readable.
Page Elements: Lists the first 20 anchor, button, or input elements.
Buttons: Lists the first 10 button elements.
Inputs: Lists the first 10 input elements.
Headings: Lists the first 5 headings.
Links: Lists the first 5 links with their text and href.
Images: Lists the first 5 images with their alt text and src.
Forms: Lists the first 3 forms with their action and method.
Div Content: Lists the first 5 div elements' content (truncated to 30 characters).
Span Content: Lists the first 5 span elements' content (truncated to 30 characters).
Meta Tags: Lists the first 5 meta tags.
Navigation Items: Lists the first 5 navigation items.
Keywords: Lists the first 10 keywords.
Main Content Summary: Shows the first 200 characters of the main content.
"""
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
    
    # page_info = f"Page height: {state['page_height']}px, Viewport height: {state['viewport_height']}px"
    
    text_summary = state['text_content'][:500] + "..." if len(state['text_content']) > 500 else state['text_content']
    
    # Add screenshot information
    screenshot_info = "Screenshot: A labeled screenshot of the current webpage is available for analysis."
    
    return {
        **state, # unpacks the state
        "action_history": formatted_history, 
        # "page_info": page_info, 
        "text_summary": text_summary,
        "content_analysis": formatted_analysis,
        "screenshot_info": screenshot_info
    }


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