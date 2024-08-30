# # python src/app/api/firecrawl_crawl.py

# from firecrawl import FirecrawlApp
# import os
# import json
# from dotenv import load_dotenv

# load_dotenv()

# # Get the API key from environment variables
# api_key = os.getenv('FIRECRAWL_API_KEY')

# app = FirecrawlApp(api_key=api_key)

# # Replace scrape_url with crawl_url
# crawl_status = app.crawl_url(
#   'https://tour-guide-liard.vercel.app/', 
#   params={
#     'limit': 100, 
#     'scrapeOptions': {'formats': ['markdown', 'html']}
#   }, 
#   wait_until_done=True, 
#   poll_interval=30
# )
# print(crawl_status)

# # Define the output file path
# output_file = "src/app/api/metadata/firecrawl.md"

# # Ensure the directory exists
# os.makedirs(os.path.dirname(output_file), exist_ok=True)

# # Write the content to the file
# with open(output_file, "w", encoding="utf-8") as f:
#     # Write the crawl_status as formatted JSON
#     json.dump(crawl_status, f, indent=2)

# print(f"Crawl status has been written to {output_file}")
from firecrawl import FirecrawlApp
import os
import json
from dotenv import load_dotenv

load_dotenv()

from firecrawl.firecrawl import FirecrawlApp

api_key = os.getenv('FIRECRAWL_API_KEY')

app = FirecrawlApp(api_key=api_key)

# Scrape a website:
scrape_status = app.scrape_url(
  'https://tour-guide-liard.vercel.app/', 
  params={'formats': ['markdown', 'html']}
)
print("Scrape status:", scrape_status)

# Save scrape results
scrape_output_file = "src/app/api/metadata/firecrawl_scrape.json"
os.makedirs(os.path.dirname(scrape_output_file), exist_ok=True)
with open(scrape_output_file, "w", encoding="utf-8") as f:
    json.dump(scrape_status, f, indent=2)
print(f"Scrape results saved to {scrape_output_file}")

# Crawl a website:
crawl_status = app.crawl_url(
  'https://tour-guide-liard.vercel.app/', 
  params={
    'limit': 100, 
    'scrapeOptions': {'formats': ['markdown', 'html']}
  }, 
  wait_until_done=True, 
  poll_interval=30
)
print("Crawl status:", crawl_status)

# Save crawl results
crawl_output_file = "src/app/api/metadata/firecrawl_crawl.json"
os.makedirs(os.path.dirname(crawl_output_file), exist_ok=True)
with open(crawl_output_file, "w", encoding="utf-8") as f:
    json.dump(crawl_status, f, indent=2)
print(f"Crawl results saved to {crawl_output_file}")

# Combine and save all results
combined_results = {
    "scrape": scrape_status,
    "crawl": crawl_status
}
combined_output_file = "src/app/api/metadata/firecrawl_combined.json"
with open(combined_output_file, "w", encoding="utf-8") as f:
    json.dump(combined_results, f, indent=2)
print(f"Combined results saved to {combined_output_file}")