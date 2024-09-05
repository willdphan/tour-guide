"""
python /Users/williamphan/Desktop/tourguide/src/app/api/multion_tour.py --explore --url https://tour-guide-liard.vercel.app

python /Users/williamphan/Desktop/tourguide/src/app/api/multion_tour.py --query --url https://tour-guide-liard.vercel.app --target "Chicken Page"
"""
import os
import time
import json
import logging
import traceback
from typing import List
from dotenv import load_dotenv
from multion.client import MultiOn

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load environment variables
load_dotenv()

# Initialize Multion client
client = MultiOn(api_key=os.getenv("MULTION_API_KEY"))

def interact_with_website(url: str, commands: List[str], max_retries: int = 3):
    """Interact with a website using Multion."""
    current_url = url
    workflow_log = []
    
    for command in commands:
        for attempt in range(max_retries):
            try:
                logging.info(f"Executing command: {command}")
                response = client.browse(
                    url=current_url,
                    cmd=command
                )
                
                log_entry = {
                    "command": command,
                    "status": response.status,
                    "message": response.message,
                    "url": response.url,
                    "attempt": attempt + 1
                }
                
                # Log all non-callable attributes
                for attr in dir(response):
                    if not attr.startswith('_') and not callable(getattr(response, attr)):
                        value = getattr(response, attr)
                        log_entry[attr] = str(value)
                
                workflow_log.append(log_entry)
                logging.info(f"Command response: {json.dumps(log_entry, indent=2)}")
                
                if response.status == 'DONE':
                    current_url = response.url
                    logging.info(f"Command completed successfully. New URL: {current_url}")
                    break
                elif response.status == 'ASK_USER':
                    user_input = input(f"The agent needs more information: {response.message}\nYour input: ")
                    logging.info(f"User input requested. Input: {user_input}")
                    return interact_with_website(current_url, [user_input])
                else:
                    logging.warning(f"Unexpected status: {response.status}. Retrying...")
                    if attempt == max_retries - 1:
                        raise Exception(f"Failed to execute command: {command}")
            
            except Exception as e:
                logging.error(f"Error on attempt {attempt + 1}: {str(e)}")
                logging.error(f"Full error: {traceback.format_exc()}")
                if attempt == max_retries - 1:
                    raise
                time.sleep(2 ** attempt)  # Exponential backoff
    
    # Save workflow log to a file
    with open('workflow_log.json', 'w') as f:
        json.dump(workflow_log, f, indent=2)
    
    logging.info("Workflow log saved to workflow_log.json")
    return response.message

def main():
    start_url = "https://tour-guide-liard.vercel.app"
    commands = [
        "WAIT_FOR_NAVIGATION",  # Wait for the page to fully load
        "Go to the start_url and explore every page, component, element of the website. Provide a list of what you see after you are done."
    ]
    logging.info(f"Interacting with {start_url}")
    logging.info(f"Commands: {commands}")
    try:
        response = interact_with_website(start_url, commands)
        logging.info(f"Final Response: {response}")
    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")
        logging.error("Please check your API key and ensure it's correctly set in the .env file.")

if __name__ == "__main__":
    main()