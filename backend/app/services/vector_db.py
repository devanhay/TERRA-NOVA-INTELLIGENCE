import os
import math
from typing import List, Dict, Any
from google import genai
from dotenv import load_dotenv

load_dotenv()

import json

# In-memory cache for document embeddings to speed up lookups during runtime
embeddings_cache: Dict[int, List[float]] = {}

def get_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        print(f"Failed to initialize GenAI client: {e}")
        return None

def get_embedding(text: str) -> List[float]:
    client = get_client()
    if not client:
        return []
    try:
        response = client.models.embed_content(
            model="text-embedding-004",
            contents=text
        )
        return response.embeddings[0].values
    except Exception as e:
        print(f"Error fetching embedding: {e}")
        return []

import logging

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2:
        return 0.0
    if len(v1) != len(v2):
        logging.warning(f"Embedding dimension mismatch: len(v1)={len(v1)}, len(v2)={len(v2)}. This may indicate a change in the embedding model.")
        return 0.0
    dot_prod = sum(a * b for a, b in zip(v1, v2))

    mag1 = math.sqrt(sum(a * a for a in v1))
    mag2 = math.sqrt(sum(b * b for b in v2))
    if mag1 == 0.0 or mag2 == 0.0:
        return 0.0
    return dot_prod / (mag1 * mag2)

def search_similar_chunks(query: str, chunks: List[Any], db_session: Any = None, top_k: int = 3) -> List[Any]:
    query_vector = get_embedding(query)
    
    # Fallback to simple keyword density scoring if Gemini API key is missing or calls fail
    if not query_vector:
        query_words = set(query.lower().split())
        scored = []
        for chunk in chunks:
            content_lower = chunk.content.lower()
            score = sum(1 for w in query_words if w in content_lower)
            scored.append((score, chunk))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored[:top_k]]
    
    # Calculate similarity scores using Gemini embeddings (with DB persistency check)
    scored_chunks = []
    db_changed = False
    
    for chunk in chunks:
        chunk_vector = None
        
        # 1. Check in-memory cache
        if chunk.id in embeddings_cache:
            chunk_vector = embeddings_cache[chunk.id]
        
        # 2. Check DB cached string
        if not chunk_vector and hasattr(chunk, 'embedding') and chunk.embedding:
            try:
                chunk_vector = json.loads(chunk.embedding)
                embeddings_cache[chunk.id] = chunk_vector
            except Exception:
                pass
                
        # 3. Generate new embedding & write back to database & in-memory cache
        if not chunk_vector:
            chunk_vector = get_embedding(chunk.content)
            if chunk_vector:
                embeddings_cache[chunk.id] = chunk_vector
                if hasattr(chunk, 'embedding') and db_session:
                    chunk.embedding = json.dumps(chunk_vector)
                    db_changed = True
            else:
                embeddings_cache[chunk.id] = []
                chunk_vector = []
        
        sim = cosine_similarity(query_vector, chunk_vector)
        scored_chunks.append((sim, chunk))
    
    # Commit embedding changes to DB if any new chunks were vectorized
    if db_changed and db_session:
        try:
            db_session.commit()
        except Exception as e:
            print(f"Error saving embeddings to DB: {e}")
            db_session.rollback()
        
    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored_chunks[:top_k]]

