# python src/app/api/firecrawl_scraper.py

from firecrawl import FirecrawlApp
import os
import json
from dotenv import load_dotenv

load_dotenv()

# Get the API key from environment variables
api_key = os.getenv('FIRECRAWL_API_KEY')

app = FirecrawlApp(api_key=api_key)

# Replace scrape_url with crawl_url
crawl_status = app.crawl_url(
  'https://tour-guide-liard.vercel.app/', 
  params={
    'limit': 100, 
    'scrapeOptions': {'formats': ['markdown', 'html']}
  }, 
  wait_until_done=True, 
  poll_interval=30
)
print(crawl_status)

# Define the output file path
output_file = "src/app/api/metadata/firecrawl.md"

# Ensure the directory exists
os.makedirs(os.path.dirname(output_file), exist_ok=True)

# Write the content to the file
with open(output_file, "w", encoding="utf-8") as f:
    # Write the crawl_status as formatted JSON
    json.dump(crawl_status, f, indent=2)

print(f"Crawl status has been written to {output_file}")