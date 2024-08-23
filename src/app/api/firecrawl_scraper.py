from firecrawl import FirecrawlApp
import os
import json
from dotenv import load_dotenv

load_dotenv()

# Get the API key from environment variables
api_key = os.getenv('FIRECRAWL_API_KEY')

app = FirecrawlApp(api_key=api_key)

content = app.scrape_url("https://docs.firecrawl.dev")

# Define the output file path
output_file = "/Users/williamphan/Desktop/tour/app/api/parse/metadata/firecrawl.md"

# Ensure the directory exists
os.makedirs(os.path.dirname(output_file), exist_ok=True)

# Write the content to the file
with open(output_file, "w", encoding="utf-8") as f:
    # Write the dictionary as formatted JSON
    json.dump(content, f, indent=2)

print(f"Content has been written to {output_file}")