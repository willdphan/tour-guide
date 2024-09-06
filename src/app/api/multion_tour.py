"""
python /Users/williamphan/Desktop/tourguide/src/app/api/multion_tour.py --explore --url https://tour-guide-liard.vercel.app

python /Users/williamphan/Desktop/tourguide/src/app/api/multion_tour.py --query --url https://tour-guide-liard.vercel.app --target "Chicken Page"

Building graph for https://tour-guide-liard.vercel.app
Processing URL: https://tour-guide-liard.vercel.app, Action: Start, Depth: 0
Added node: 94f33c24-a10c-41ae-8784-e4e4070d7ccf (URL: https://tour-guide-liard.vercel.app, Action: Start)
Attempting to browse URL: https://tour-guide-liard.vercel.app
Command: Explore this page and list all possible actions
Response Status: DONE
Response Message: I have explored the page and identified the following interactive elements:

1. <l id=0>Stools & Co
2. <l id=1>Where to buy
3. <l id=2>Become a stockist
4. <l id=3>AI Chat
5. <l id=8>Arnold Circus Stool $ 20 22 servings
6. <l id=10>Arnoldino Stool $ 30 22 servings
7. <l id=12>Hookalotti $ 40 22 servings
8. <l id=14>Chicken $ 40 22 servings

Possible actions based on these elements include:
- Clicking on "Stools & Co" to learn more about the company.
- Clicking on "Where to buy" to find purchasing locations.
- Clicking on "Become a stockist" to get information on becoming a distributor.
- Clicking on "AI Chat" to engage with a chatbot.
- Clicking on product links (Arnold Circus Stool, Arnoldino Stool, Hookalotti, Chicken) to view more details or make a purchase.

Response URL: https://tour-guide-liard.vercel.app/
Current URL: https://tour-guide-liard.vercel.app/
Response from interact_with_website: I have explored the page and identified the following interactive elements:

1. <l id=0>Stools & Co
2. <l id=1>Where to buy
3. <l id=2>Become a stockist
4. <l id=3>AI Chat
5. <l id=8>Arnold Circus Stool $ 20 22 servings
6. <l id=10>Arnoldino Stool $ 30 22 servings
7. <l id=12>Hookalotti $ 40 22 servings
8. <l id=14>Chicken $ 40 22 servings

Possible actions based on these elements include:
- Clicking on "Stools & Co" to learn more about the company.
- Clicking on "Where to buy" to find purchasing locations.
- Clicking on "Become a stockist" to get information on becoming a distributor.
- Clicking on "AI Chat" to engage with a chatbot.
- Clicking on product links (Arnold Circus Stool, Arnoldino Stool, Hookalotti, Chicken) to view more details or make a purchase.

Parsing response:
I have explored the page and identified the following interactive elements:

1. <l id=0>Stools & Co
2. <l id=1>Where to buy
3. <l id=2>Become a stockist
4. <l id=3>AI Chat
5. <l id=8>Arnold Circus Stool $ 20 22 servings
6. <l id=10>Arnoldino Stool $ 30 22 servings
7. <l id=12>Hookalotti $ 40 22 servings
8. <l id=14>Chicken $ 40 22 servings

Possible actions based on these elements include:
- Clicking on "Stools & Co" to learn more about the company.
- Clicking on "Where to buy" to find purchasing locations.
- Clicking on "Become a stockist" to get information on becoming a distributor.
- Clicking on "AI Chat" to engage with a chatbot.
- Clicking on product links (Arnold Circus Stool, Arnoldino Stool, Hookalotti, Chicken) to view more details or make a purchase.

Parsed actions: []
Parsed actions: []
"""

"""
python /Users/williamphan/Desktop/tourguide/src/app/api/multion_tour.py --explore --url https://tour-guide-liard.vercel.app

python /Users/williamphan/Desktop/tourguide/src/app/api/multion_tour.py --query --url https://tour-guide-liard.vercel.app --target "Chicken Page"

"""
# import os
# from multion.client import MultiOn
# from dotenv import load_dotenv
# import os
# from dotenv import load_dotenv
# import networkx as nx
# from typing import List, Dict
# import traceback


# load_dotenv()

# # Initialize Multion client
# client = MultiOn(api_key=os.getenv("MULTION_API_KEY"))

# def interact_with_website(url: str, commands: List[str], max_retries: int = 3):
#     """Interact with a website using Multion."""
#     current_url = url
#     for command in commands:
#         for attempt in range(max_retries):
#             try:
#                 response = client.browse(
#                     url=current_url,
#                     cmd=command
#                 )
                
#                 print(f"Command: {command}")
#                 print(f"Response Status: {response.status}")
#                 print(f"Response Message: {response.message}")
                
#                 # Print all non-callable attributes
#                 for attr in dir(response):
#                     if not attr.startswith('_') and not callable(getattr(response, attr)):
#                         value = getattr(response, attr)
#                         print(f"{attr}: {value}")
                
#                 if response.status == 'DONE':
#                     current_url = response.url
#                     print(f"Current URL: {current_url}")
#                     break
#                 elif response.status == 'ASK_USER':
#                     user_input = input(f"The agent needs more information: {response.message}\nYour input: ")
#                     return interact_with_website(current_url, [user_input])
#                 else:
#                     print(f"Unexpected status: {response.status}. Retrying...")
#                     if attempt == max_retries - 1:
#                         raise Exception(f"Failed to execute command: {command}")
            
#             except Exception as e:
#                 print(f"Error on attempt {attempt + 1}: {str(e)}")
#                 print(f"Full error: {traceback.format_exc()}")
#                 if attempt == max_retries - 1:
#                     raise
#                 time.sleep(2 ** attempt)  # Exponential backoff

#     return response.message

# def main():
#     start_url = "https://tour-guide-liard.vercel.app"
#     commands = [
#         "WAIT_FOR_NAVIGATION",  # Wait for the page to fully load
#         "Go to the start_url and explore every page, component, element of the website. Provide a list of what you see after you are done."

#         "after exploring, provide all the paths and map out of elements and components. find the shortest path to get to chicken page"
#     ]

#     print(f"Interacting with {start_url}")
#     print(f"Commands: {commands}")

#     try:
#         response = interact_with_website(start_url, commands)
#         print(f"Final Response: {response}")
#     except Exception as e:
#         print(f"An error occurred: {str(e)}")
#         print("Please check your API key and ensure it's correctly set in the .env file.")

# if __name__ == "__main__":
#     main()

"""
python /Users/williamphan/Desktop/tourguide/src/app/api/multion_tour.py --explore --url https://tour-guide-liard.vercel.app

python /Users/williamphan/Desktop/tourguide/src/app/api/multion_tour.py --query --url https://tour-guide-liard.vercel.app --target "Chicken Page"

Building graph for https://tour-guide-liard.vercel.app
Processing URL: https://tour-guide-liard.vercel.app, Action: Start, Depth: 0
Added node: 94f33c24-a10c-41ae-8784-e4e4070d7ccf (URL: https://tour-guide-liard.vercel.app, Action: Start)
Attempting to browse URL: https://tour-guide-liard.vercel.app
Command: Explore this page and list all possible actions
Response Status: DONE
Response Message: I have explored the page and identified the following interactive elements:

1. <l id=0>Stools & Co
2. <l id=1>Where to buy
3. <l id=2>Become a stockist
4. <l id=3>AI Chat
5. <l id=8>Arnold Circus Stool $ 20 22 servings
6. <l id=10>Arnoldino Stool $ 30 22 servings
7. <l id=12>Hookalotti $ 40 22 servings
8. <l id=14>Chicken $ 40 22 servings

Possible actions based on these elements include:
- Clicking on "Stools & Co" to learn more about the company.
- Clicking on "Where to buy" to find purchasing locations.
- Clicking on "Become a stockist" to get information on becoming a distributor.
- Clicking on "AI Chat" to engage with a chatbot.
- Clicking on product links (Arnold Circus Stool, Arnoldino Stool, Hookalotti, Chicken) to view more details or make a purchase.

Response URL: https://tour-guide-liard.vercel.app/
Current URL: https://tour-guide-liard.vercel.app/
Response from interact_with_website: I have explored the page and identified the following interactive elements:

1. <l id=0>Stools & Co
2. <l id=1>Where to buy
3. <l id=2>Become a stockist
4. <l id=3>AI Chat
5. <l id=8>Arnold Circus Stool $ 20 22 servings
6. <l id=10>Arnoldino Stool $ 30 22 servings
7. <l id=12>Hookalotti $ 40 22 servings
8. <l id=14>Chicken $ 40 22 servings

Possible actions based on these elements include:
- Clicking on "Stools & Co" to learn more about the company.
- Clicking on "Where to buy" to find purchasing locations.
- Clicking on "Become a stockist" to get information on becoming a distributor.
- Clicking on "AI Chat" to engage with a chatbot.
- Clicking on product links (Arnold Circus Stool, Arnoldino Stool, Hookalotti, Chicken) to view more details or make a purchase.

Parsing response:
I have explored the page and identified the following interactive elements:

1. <l id=0>Stools & Co
2. <l id=1>Where to buy
3. <l id=2>Become a stockist
4. <l id=3>AI Chat
5. <l id=8>Arnold Circus Stool $ 20 22 servings
6. <l id=10>Arnoldino Stool $ 30 22 servings
7. <l id=12>Hookalotti $ 40 22 servings
8. <l id=14>Chicken $ 40 22 servings

Possible actions based on these elements include:
- Clicking on "Stools & Co" to learn more about the company.
- Clicking on "Where to buy" to find purchasing locations.
- Clicking on "Become a stockist" to get information on becoming a distributor.
- Clicking on "AI Chat" to engage with a chatbot.
- Clicking on product links (Arnold Circus Stool, Arnoldino Stool, Hookalotti, Chicken) to view more details or make a purchase.

Parsed actions: []
Parsed actions: []
"""

"""
python /Users/williamphan/Desktop/tourguide/src/app/api/multion_tour.py --explore --url https://tour-guide-liard.vercel.app

python /Users/williamphan/Desktop/tourguide/src/app/api/multion_tour.py --query --url https://tour-guide-liard.vercel.app --target "Chicken Page"

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