from collections import Counter
import json

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

