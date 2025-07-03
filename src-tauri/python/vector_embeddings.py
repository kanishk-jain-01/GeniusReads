"""
GeniusReads Vector Embeddings

Vector embedding generation using OpenAI's embedding API.
Provides embeddings compatible with pgvector for concept similarity search.
"""

import logging
import numpy as np
from typing import List, Union, Tuple, Optional
import os
import requests
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# OpenAI API configuration
OPENAI_EMBEDDING_MODEL = "text-embedding-3-small"  # 1536 dimensions, fast and cost-effective
OPENAI_API_URL = "https://api.openai.com/v1/embeddings"

# ============================================================================
# OpenAI Embedding Functions
# ============================================================================

def generate_embeddings_with_openai(texts: List[str], api_key: str) -> List[List[float]]:
    """
    Generate vector embeddings using OpenAI's embedding API
    
    Args:
        texts: List of text strings to embed
        api_key: OpenAI API key
        
    Returns:
        List of embedding vectors as lists of floats
    """
    if not texts:
        logger.warning("Empty text list provided for embedding generation")
        return []
    
    if not api_key:
        logger.error("OpenAI API key not provided")
        return []
    
    try:
        logger.info(f"Generating embeddings for {len(texts)} texts using OpenAI")
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "input": texts,
            "model": OPENAI_EMBEDDING_MODEL
        }
        
        response = requests.post(OPENAI_API_URL, headers=headers, json=data)
        response.raise_for_status()
        
        result = response.json()
        embeddings = [item["embedding"] for item in result["data"]]
        
        logger.info(f"Successfully generated {len(embeddings)} embeddings")
        return embeddings
        
    except Exception as e:
        logger.error(f"Error generating embeddings with OpenAI: {str(e)}")
        return []

def generate_single_embedding(text: str, api_key: str) -> Optional[List[float]]:
    """
    Generate a vector embedding for a single text using OpenAI
    
    Args:
        text: Text string to embed
        api_key: OpenAI API key
        
    Returns:
        Embedding vector as list of floats, or None if failed
    """
    if not text or not text.strip():
        logger.warning("Empty or whitespace-only text provided for embedding")
        return None
    
    embeddings = generate_embeddings_with_openai([text.strip()], api_key)
    return embeddings[0] if embeddings else None

# ============================================================================
# Concept-Specific Functions
# ============================================================================

def generate_concept_embedding(concept_name: str, concept_description: str, api_key: str = None) -> Optional[List[float]]:
    """
    Generate embedding for a concept using both name and description
    
    Args:
        concept_name: Name of the concept
        concept_description: Description of the concept
        api_key: OpenAI API key (will get from environment if not provided)
        
    Returns:
        Embedding vector, or None if failed
    """
    if not concept_name or not concept_description:
        logger.warning("Missing concept name or description for embedding generation")
        return None
    
    # Get API key from environment if not provided
    if not api_key:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.error("OpenAI API key not found in environment")
            return None
    
    # Combine name and description for richer embedding
    combined_text = f"{concept_name}: {concept_description}"
    return generate_single_embedding(combined_text, api_key)

# ============================================================================
# Similarity Calculation Functions
# ============================================================================

def calculate_similarity(embedding1: List[float], embedding2: List[float]) -> float:
    """
    Calculate cosine similarity between two embeddings
    
    Args:
        embedding1: First embedding vector
        embedding2: Second embedding vector
        
    Returns:
        Cosine similarity score between 0.0 and 1.0
    """
    try:
        if not embedding1 or not embedding2:
            logger.warning("Empty embeddings provided for similarity calculation")
            return 0.0
        
        if len(embedding1) != len(embedding2):
            logger.warning(f"Embedding dimension mismatch: {len(embedding1)} vs {len(embedding2)}")
            return 0.0
        
        # Convert to numpy arrays
        emb1 = np.array(embedding1)
        emb2 = np.array(embedding2)
        
        # Calculate cosine similarity
        dot_product = np.dot(emb1, emb2)
        norm1 = np.linalg.norm(emb1)
        norm2 = np.linalg.norm(emb2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        similarity = dot_product / (norm1 * norm2)
        
        # Ensure result is between 0 and 1
        similarity = max(0.0, min(1.0, float(similarity)))
        
        return similarity
        
    except Exception as e:
        logger.error(f"Error calculating similarity: {str(e)}")
        return 0.0

def calculate_similarity_matrix(embeddings: List[List[float]]) -> List[List[float]]:
    """
    Calculate pairwise similarity matrix for a list of embeddings
    
    Args:
        embeddings: List of embedding vectors
        
    Returns:
        Symmetric similarity matrix as list of lists
    """
    try:
        if not embeddings:
            return []
        
        n = len(embeddings)
        similarity_matrix = []
        
        for i in range(n):
            row = []
            for j in range(n):
                if i == j:
                    row.append(1.0)  # Perfect similarity with self
                else:
                    similarity = calculate_similarity(embeddings[i], embeddings[j])
                    row.append(similarity)
            similarity_matrix.append(row)
        
        logger.info(f"Generated {n}x{n} similarity matrix")
        return similarity_matrix
        
    except Exception as e:
        logger.error(f"Error calculating similarity matrix: {str(e)}")
        return []

def find_most_similar(
    target_embedding: List[float], 
    candidate_embeddings: List[List[float]], 
    threshold: float = 0.7
) -> List[Tuple[int, float]]:
    """
    Find the most similar embeddings to a target embedding
    
    Args:
        target_embedding: The embedding to compare against
        candidate_embeddings: List of candidate embeddings
        threshold: Minimum similarity threshold (default 0.7)
        
    Returns:
        List of (index, similarity_score) tuples, sorted by similarity (highest first)
    """
    try:
        if not target_embedding or not candidate_embeddings:
            return []
        
        similarities = []
        for i, candidate in enumerate(candidate_embeddings):
            similarity = calculate_similarity(target_embedding, candidate)
            if similarity >= threshold:
                similarities.append((i, similarity))
        
        # Sort by similarity score (descending)
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        logger.info(f"Found {len(similarities)} similar embeddings above threshold {threshold}")
        return similarities
        
    except Exception as e:
        logger.error(f"Error finding similar embeddings: {str(e)}")
        return []

# ============================================================================
# Utility Functions
# ============================================================================

def validate_embedding(embedding: List[float], expected_dim: int = 1536) -> bool:
    """
    Validate that an embedding has the correct format and dimensions
    
    Args:
        embedding: Embedding vector to validate
        expected_dim: Expected dimension (1536 for OpenAI text-embedding-3-small)
        
    Returns:
        True if valid, False otherwise
    """
    try:
        if not isinstance(embedding, list):
            return False
        
        if len(embedding) != expected_dim:
            return False
        
        # Check that all elements are numbers
        for val in embedding:
            if not isinstance(val, (int, float)):
                return False
            if np.isnan(val) or np.isinf(val):
                return False
        
        return True
        
    except Exception:
        return False

def normalize_embedding(embedding: List[float]) -> List[float]:
    """
    Normalize an embedding vector to unit length
    
    Args:
        embedding: Embedding vector to normalize
        
    Returns:
        Normalized embedding vector
    """
    try:
        emb_array = np.array(embedding)
        norm = np.linalg.norm(emb_array)
        
        if norm == 0:
            logger.warning("Zero-norm embedding detected, returning original")
            return embedding
        
        normalized = emb_array / norm
        return normalized.tolist()
        
    except Exception as e:
        logger.error(f"Error normalizing embedding: {str(e)}")
        return embedding

def embedding_to_pgvector_format(embedding: List[float]) -> str:
    """
    Convert embedding to pgvector format string
    
    Args:
        embedding: Embedding vector
        
    Returns:
        String in pgvector format: '[1.0,2.0,3.0]'
    """
    try:
        if not validate_embedding(embedding):
            logger.warning("Invalid embedding provided for pgvector conversion")
            return "[]"
        
        # Format as pgvector string
        values = ",".join([f"{val:.6f}" for val in embedding])
        return f"[{values}]"
        
    except Exception as e:
        logger.error(f"Error converting embedding to pgvector format: {str(e)}")
        return "[]"

# ============================================================================
# Legacy/Compatibility Functions
# ============================================================================

def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Legacy function for backwards compatibility
    Uses OpenAI API with key from environment
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logger.error("OpenAI API key not found in environment")
        return []
    
    return generate_embeddings_with_openai(texts, api_key)

if __name__ == "__main__":
    # Simple test
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        test_embedding = generate_single_embedding("This is a test", api_key)
        print(f"Test embedding dimension: {len(test_embedding) if test_embedding else 'None'}")
        print(f"Test embedding valid: {validate_embedding(test_embedding) if test_embedding else False}")
    else:
        print("OPENAI_API_KEY not found in environment") 