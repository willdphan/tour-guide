# import os
# import re
# from typing import List
# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from groq import Groq

# app = FastAPI()

# # Add CORS middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000", "http://localhost:3001"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Set Groq API key
# os.environ['GROQ_API_KEY'] = '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'

# class Query(BaseModel):
#     query: str

# class Outcome(BaseModel):
#     option_number: int
#     title: str
#     description: str
#     probability: float

# class OutcomesResponse(BaseModel):
#     outcomes: List[Outcome]

# def parse_outcomes(response_text: str) -> List[Outcome]:
#     outcomes = []
#     lines = response_text.split('\n')
#     current_outcome = None
#     current_description = ""

#     for line in lines:
#         match = re.match(r'(\d+)\.\s*(.*?)\s*\((\d+(?:\.\d+)?)%\)', line)
#         if match:
#             if current_outcome:
#                 outcomes.append(Outcome(
#                     option_number=current_outcome[0],
#                     title=current_outcome[1],
#                     description=current_description.strip(),
#                     probability=current_outcome[2]
#                 ))
#             option_number = int(match.group(1))
#             title = match.group(2)
#             probability = float(match.group(3))
#             current_outcome = (option_number, title, probability)
#             current_description = ""
#         else:
#             current_description += line + "\n"

#     if current_outcome:
#         outcomes.append(Outcome(
#             option_number=current_outcome[0],
#             title=current_outcome[1],
#             description=current_description.strip(),
#             probability=current_outcome[2]
#         ))

#     return outcomes

# @app.post("/generate-outcomes", response_model=OutcomesResponse)
# async def generate_outcomes(query: Query):
#     print(f"Received query: {query.query}")
    
#     # Set up Groq client
#     client = Groq()

#     prompt = f"""You are an assistant that generates possible outcomes for given actions.
# Given the action: '{query.query}', list 4-5 possible outcomes. For each outcome, provide:
# 1. A short title (3-5 words)
# 2. A detailed description (at least 200 words) explaining the outcome, its implications, and any relevant context. Use multiple paragraphs if necessary.
# 3. The probability of occurring (as a percentage).

# Format each outcome as follows:
# 1. Title (XX%)
# Detailed description...

# The probabilities should sum up to 100%.
# """

#     chat_completion = client.chat.completions.create(
#         messages=[
#             {
#                 "role": "user",
#                 "content": prompt,
#             }
#         ],
#         model="mixtral-8x7b-32768",
#         temperature=0.7,
#         max_tokens=2000,
#     )

#     response = chat_completion.choices[0].message.content
#     print(f"Groq response: {response}")

#     outcomes = parse_outcomes(response)

#     if not outcomes:
#         raise HTTPException(status_code=500, detail="Failed to generate outcomes.")

#     print("Generated outcomes:")
#     for outcome in outcomes:
#         print(f"Option {outcome.option_number}: {outcome.title} - {outcome.description} ({outcome.probability}%)")

#     return OutcomesResponse(outcomes=outcomes)

# if __name__ == "__main__":
#     import uvicorn
    
#     uvicorn.run("src.app.api.groq:app", host="0.0.0.0", port=8000, reload=True)


import os
import re
import traceback
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from modal import Image, Secret, web_endpoint, App
import requests

app = App("fastapi-groq-api")

image = (
    Image.debian_slim()
    .pip_install("fastapi", "uvicorn", "groq", "pydantic", "requests")
)

# Hardcode the Groq API key (for development only)
GROQ_API_KEY = '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'

class Query(BaseModel):
    query: str

class Outcome(BaseModel):
    option_number: int
    title: str
    description: str
    probability: float

class OutcomesResponse(BaseModel):
    outcomes: List[Outcome]

class Groq:
    def __init__(self, api_key):
        self.api_key = api_key
        self.api_base = "https://api.groq.com/openai/v1"

    def chat_completions_create(self, messages, model, temperature, max_tokens):
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        response = requests.post(f"{self.api_base}/chat/completions", headers=headers, json=data)
        response.raise_for_status()
        return response.json()
    

def parse_outcomes(response_text: str) -> List[Outcome]:
    outcomes = []
    lines = response_text.split('\n')
    current_outcome = None
    current_description = ""

    for line in lines:
        match = re.match(r'(\d+)\.\s*(.*?)\s*\((\d+(?:\.\d+)?)%\)', line)
        if match:
            if current_outcome:
                outcomes.append(Outcome(
                    option_number=current_outcome[0],
                    title=current_outcome[1],
                    description=current_description.strip(),
                    probability=current_outcome[2]
                ))
            option_number = int(match.group(1))
            title = match.group(2)
            probability = float(match.group(3))
            current_outcome = (option_number, title, probability)
            current_description = ""
        else:
            current_description += line + "\n"

    if current_outcome:
        outcomes.append(Outcome(
            option_number=current_outcome[0],
            title=current_outcome[1],
            description=current_description.strip(),
            probability=current_outcome[2]
        ))

    return outcomes

@app.function(image=image)
@web_endpoint(method="POST")
def generate_outcomes(query: Query):
    try:
        print(f"Received query: {query.query}")
        
        # Set up Groq client with hardcoded API key
        client = Groq(api_key=GROQ_API_KEY)
        

        prompt = f"""You are an assistant that generates possible outcomes for given actions.
    Given the setting and action: '{query.query}', list all possible outcomes. For each outcome, provide:
    1. A short title (3-5 words)
    2. A detailed description (at least 200 words) explaining the outcome, its implications, and any relevant context. Use multiple paragraphs if necessary.
    3. The probability of occurring (as a percentage).

    Format each outcome as follows:
    1. Title (XX%)
    Detailed description...

    The probabilities should sum up to 100%.
    """

        chat_completion = client.chat_completions_create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="mixtral-8x7b-32768",
            temperature=0.7,
            max_tokens=2000,
        )

        response = chat_completion['choices'][0]['message']['content']
        print(f"Groq response: {response}")

        outcomes = parse_outcomes(response)

        if not outcomes:
            raise HTTPException(status_code=500, detail="Failed to generate outcomes.")

        print("Generated outcomes:")
        for outcome in outcomes:
            print(f"Option {outcome.option_number}: {outcome.title} - {outcome.description} ({outcome.probability}%)")

        return OutcomesResponse(outcomes=outcomes)
    except Exception as e:
        print(f"Error in generate_outcomes: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.function(image=image)
@web_endpoint()
def fastapi_app():
    app = FastAPI()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:3001"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.post("/generate-outcomes", response_model=OutcomesResponse)(generate_outcomes.apply)

    return app

# To run locally for testing
if __name__ == "__main__":
    app.serve()

# To deploy
# Run: modal deploy src/app/api/groq.py

# curl -X POST https://willdphan--fastapi-groq-api-generate-outcomes.modal.run -H "Content-Type: application/json" -d '{"query": "test query"}'