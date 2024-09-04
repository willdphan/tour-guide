from multion.client import MultiOn
import os
from dotenv import load_dotenv
import asyncio
import networkx as nx
from typing import List, Dict
from multion.client import MultiOn
import os
from dotenv import load_dotenv
import time
import requests
import os
from dotenv import load_dotenv
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API endpoint
API_URL = "https://api.multion.ai/v1/web/browse"

# API key
API_KEY = os.getenv("MULTION_API_KEY")

def query_multion(url, command):
    """
    Send a query to the Multion API and return the response.
    """
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "url": url,
        "cmd": command,
        "include_screenshot": False  # Set to True if you want screenshots
    }

    try:
        response = requests.post(API_URL, json=data, headers=headers)
        response.raise_for_status()  # Raise an exception for bad status codes
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")
        if response is not None:
            print(f"Response status code: {response.status_code}")
            print(f"Response content: {response.text}")
        return None

def main():
    # The URL we want to interact with
    url = "https://tour-guide-liard.vercel.app"
    
    # The command we want to execute
    command = "Go to the chicken page and tell me the price of the chicken."

    print(f"Querying URL: {url}")
    print(f"Command: {command}")

    # Send the query to Multion
    result = query_multion(url, command)

    # Print the result
    print("\nResult:")
    if result is not None:
        for key, value in result.items():
            print(f"{key}: {value}")
    else:
        print("Failed to get a valid response from the API.")

    # Check if the API key is set
    if API_KEY is None:
        print("\nWarning: MULTION_API_KEY is not set in the environment variables.")

if __name__ == "__main__":
    main()