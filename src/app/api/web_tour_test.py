import json
import os
from typing import List, Dict, Any
from dotenv import load_dotenv
from openai import OpenAI
from pinecone import Pinecone, ServerlessSpec
from sklearn.feature_extraction.text import CountVectorizer
import numpy as np
import openai

# Load environment variables
load_dotenv()

# Initialize OpenAI and Pinecone clients
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

# Pinecone index configuration
INDEX_NAME = "rag-index"
DIMENSION = 1536  # Dimension for ada-002 embeddings

def create_pinecone_index():
    if INDEX_NAME not in pc.list_indexes().names():
        pc.create_index(
            name=INDEX_NAME,
            dimension=DIMENSION,
            metric='cosine',
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"  # Change this to a supported region
            )
        )
    return pc.Index(INDEX_NAME)

index = create_pinecone_index()

def get_embedding(text: str) -> List[float]:
    response = client.embeddings.create(
        input=text,
        model="text-embedding-ada-002"
    )
    return response.data[0].embedding

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 100) -> List[str]:
    vectorizer = CountVectorizer(token_pattern=r'\b\w+\b', stop_words='english')
    chunks = []
    words = vectorizer.build_analyzer()(text)
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = ' '.join(words[i:i + chunk_size])
        chunks.append(chunk)
    
    return chunks

def index_document(doc_id: str, content: str):
    chunks = chunk_text(content)
    for i, chunk in enumerate(chunks):
        embedding = get_embedding(chunk)
        index.upsert(
            vectors=[
                {
                    'id': f"{doc_id}_chunk_{i}",
                    'values': embedding,
                    'metadata': {'text': chunk, 'doc_id': doc_id}
                }
            ]
        )

def query_pinecone(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    query_embedding = get_embedding(query)
    results = index.query(vector=query_embedding, top_k=top_k, include_metadata=True)
    return results['matches']

def generate_response(query: str, context: str) -> str:
    messages = [
        {"role": "system", "content": "You are a helpful assistant. Use the provided context to answer the user's question."},
        {"role": "user", "content": f"Context: {context}\n\nQuestion: {query}"}
    ]
    
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages,
        max_tokens=150,
        n=1,
        stop=None,
        temperature=0.7,
    )
    
    return response.choices[0].message.content.strip()

def rag_pipeline(query: str) -> str:
    # Retrieve relevant documents
    matches = query_pinecone(query)
    context = "\n".join([match['metadata']['text'] for match in matches])
    
    # Generate response
    response = generate_response(query, context)
    
    return response

# Example usage
if __name__ == "__main__":
    # Read and index the firecrawl.md file
    with open('src/app/api/metadata/firecrawl.md', 'r') as file:
        firecrawl_data = json.load(file)
    
    for item in firecrawl_data:
        content = item.get('content', '')
        markdown = item.get('markdown', '')
        raw_html = item.get('rawHtml', '')
        
        # Combine content, markdown, and raw HTML for indexing
        combined_content = f"{content}\n\n{markdown}\n\n{raw_html}"
        
        index_document("firecrawl", combined_content)
    
    # Example query
    query = "Show me how to go to the chicken page."
    response = rag_pipeline(query)
    print(f"Query: {query}")
    print(f"Response: {response}")