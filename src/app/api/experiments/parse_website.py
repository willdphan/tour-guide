import asyncio
import pickle
from playwright.async_api import async_playwright
import logging
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def parse_page(page, url):
    await page.goto(url, wait_until="networkidle")
    content = await page.content()
    soup = BeautifulSoup(content, 'html.parser')
    title = soup.title.string if soup.title else ""
    
    # Extract main content, removing scripts, styles, etc.
    for script in soup(["script", "style", "meta", "link"]):
        script.extract()
    text_content = soup.get_text(separator=' ', strip=True)
    
    # Extract navigation structure if it's the home page
    nav_structure = []
    if url == "http://localhost:3000":
        nav_items = soup.find_all('a', class_='nav-item')
        nav_structure = [item.text.strip() for item in nav_items if item.text.strip()]
    
    return {
        "url": url,
        "title": title,
        "content": content,  # Keep the full HTML content
        "text_content": text_content,
        "nav_structure": nav_structure
    }

async def parse_entire_website(start_url):
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        parsed_data = {}
        to_visit = [start_url]
        visited = set()

        while to_visit:
            url = to_visit.pop(0)
            if url in visited:
                continue

            logger.info(f"Parsing: {url}")
            parsed_data[url] = await parse_page(page, url)
            visited.add(url)

            # Find all links on the page
            links = await page.evaluate("""
                () => Array.from(document.querySelectorAll('a[href]'))
                    .map(a => a.href)
                    .filter(href => href.startsWith(window.location.origin))
            """)

            to_visit.extend([link for link in links if link not in visited])

        await browser.close()
        return parsed_data

async def main():
    start_url = "http://localhost:3000"  # Replace with your actual start URL
    logger.info("Starting website parsing...")
    parsed_data = await parse_entire_website(start_url)
    logger.info(f"Website parsing completed. Total pages parsed: {len(parsed_data)}")

    # Save parsed data to a file
    with open("parsed_website_data.pkl", "wb") as f:
        pickle.dump(parsed_data, f)
    logger.info("Parsed data saved to parsed_website_data.pkl")

if __name__ == "__main__":
    asyncio.run(main())