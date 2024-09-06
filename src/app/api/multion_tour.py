"""
python /Users/williamphan/Desktop/tourguide/src/app/api/multion_tour.py --explore --url https://tour-guide-liard.vercel.app

python /Users/williamphan/Desktop/tourguide/src/app/api/multion_tour.py --query --url https://tour-guide-liard.vercel.app --target "Chicken Page"

metadata: step_count=3 processing_time=21 temperature=0.2
screenshot: 
session_id: 3aa8614d-784e-4da6-abf8-8a69b5da93ca
status: DONE
url: https://tour-guide-liard.vercel.app/product/chicken
Current URL: https://tour-guide-liard.vercel.app/product/chicken
Command completed: Provide all paths and map out elements and components you were able to access. Find the shortest path to the chicken page if it exists.
Response: Memorizing the following information about the "Chicken" page elements and components:

1. <l id=0 href="link_0">Home
2. <t id=1>> 
3. <l id=2 href="link_1">Products
4. <t id=3>> 
5. <t id=4>Chicken
6. <img id=5>
7. <t id=6>Product description not available.
8. <t id=7>Chicken
9. <t id=8>4.6
10. <l id=9 href="link_3">(499 reviews)
11. <i id=10 type="radio" name="option">checked
12. <t id=11>- 
13. <t id=12>pot
14. <t id=13>€27
15. <t id=14>-30% €18,90
16. <t id=15>18 porties (€1,05/portie)
17. <i id=16 type="radio" name="option">unchecked
18. <t id=17>- 
19. <t id=18>probeerverpakking
20. <t id=19>€3
21. <t id=20>-67%
22. <t id=21>€1
23. <t id=22>1 portie (€1,-/portie)
24. <t id=23>Strawberry
25. <b id=24>Add
26. <t id=25>Lemon (sold out)
27. <b id=26>Notify me
28. <t id=27>Orange (sold out)
29. <b id=28>Notify me
30. <t id=29>Order today = Delivered tomorrow.
The shortest path to the chicken page is:
1. Click on the link labeled "Chicken $ 40 22 servings" on the main page.
"""

import os
from multion.client import MultiOn
from dotenv import load_dotenv
import time
import traceback
from typing import List

load_dotenv()

# Initialize Multion client
client = MultiOn(api_key=os.getenv("MULTION_API_KEY"))

def interact_with_website(url: str, commands: List[str], max_retries: int = 3, max_loading_retries: int = 2):
    """Interact with a website using Multion."""
    current_url = url
    loading_retries = 0
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
                    loading_retries = 0  # Reset loading retries on success
                    break
                elif response.status == 'ASK_USER':
                    if "loading" in response.message.lower():
                        loading_retries += 1
                        if loading_retries > max_loading_retries:
                            print("Page stuck on loading. Moving on to explore elsewhere.")
                            break  # Exit the retry loop and move to the next command
                        else:
                            print(f"Page still loading. Retry attempt {loading_retries}")
                            time.sleep(5)  # Wait 5 seconds before retrying
                            continue
                    else:
                        print(f"The agent needs more information: {response.message}")
                        print("Attempting to continue with the current command...")
                        continue
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
        "WAIT_FOR_NAVIGATION",
        "Explore the entire website, including all pages, components, and elements. If a page is stuck loading, stuck on a loop, or has a 404 error, move on to explore other parts. List everything you see.",
        "Provide all paths and map out elements and components you were able to access. Find the shortest path to the chicken page if it exists."
    ]

    print(f"Interacting with {start_url}")
    print(f"Commands: {commands}")

    try:
        for command in commands:
            response = interact_with_website(start_url, [command])
            print(f"Command completed: {command}")
            print(f"Response: {response}")
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        print("Please check your API key and ensure it's correctly set in the .env file.")

if __name__ == "__main__":
    main()