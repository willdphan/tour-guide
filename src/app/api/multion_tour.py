import os
from multion.client import MultiOn
from dotenv import load_dotenv

from multion.client import MultiOn
import os
from dotenv import load_dotenv
import networkx as nx
from typing import List, Dict
import traceback


load_dotenv()

# Initialize Multion client
client = MultiOn(api_key=os.getenv("MULTION_API_KEY"))

def interact_with_website(url: str, commands: List[str], max_retries: int = 3):
    """Interact with a website using Multion."""
    current_url = url
    for command in commands:
        for attempt in range(max_retries):
            try:
                response = client.browse(
                    url=current_url,
                    cmd=command
                )
                
                print(f"Command: {command}")
                print(f"Response Status: {response.status}")
                print(f"Response Message: {response.message}")
                
                # Print all non-callable attributes
                for attr in dir(response):
                    if not attr.startswith('_') and not callable(getattr(response, attr)):
                        value = getattr(response, attr)
                        print(f"{attr}: {value}")
                
                if response.status == 'DONE':
                    current_url = response.url
                    print(f"Current URL: {current_url}")
                    break
                elif response.status == 'ASK_USER':
                    user_input = input(f"The agent needs more information: {response.message}\nYour input: ")
                    return interact_with_website(current_url, [user_input])
                else:
                    print(f"Unexpected status: {response.status}. Retrying...")
                    if attempt == max_retries - 1:
                        raise Exception(f"Failed to execute command: {command}")
            
            except Exception as e:
                print(f"Error on attempt {attempt + 1}: {str(e)}")
                print(f"Full error: {traceback.format_exc()}")
                if attempt == max_retries - 1:
                    raise
                time.sleep(2 ** attempt)  # Exponential backoff

    return response.message

def main():
    start_url = "https://tour-guide-liard.vercel.app"
    commands = [
        "WAIT_FOR_NAVIGATION",  # Wait for the page to fully load
        "Go to the start_url and explore every page, component, element of the website. Provide a list of what you see after you are done."
    ]

    print(f"Interacting with {start_url}")
    print(f"Commands: {commands}")

    try:
        response = interact_with_website(start_url, commands)
        print(f"Final Response: {response}")
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        print("Please check your API key and ensure it's correctly set in the .env file.")

if __name__ == "__main__":
    main()