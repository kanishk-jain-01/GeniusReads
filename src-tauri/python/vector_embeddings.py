"""
GeniusReads Vector Embeddings

Vector embedding generation and similarity calculation using sentence-transformers.
Provides 384-dimensional embeddings compatible with pgvector for concept similarity search.
"""

import logging
import numpy as np
from typing import List, Union, Tuple, Optional
import warnings

# Suppress sentence-transformers warnings for cleaner output
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

try:
    from sentence_transformers import SentenceTransformer
    import torch
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    logging.warning("sentence-transformers not available. Vector operations will be disabled.")

from sklearn.metrics.pairwise import cosine_similarity
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# Global Model Management
# ============================================================================

# Global model instance for efficient reuse
_embedding_model = None
_model_name = "all-MiniLM-L6-v2"  # 384-dimensional embeddings, good performance/size balance

def get_embedding_model() -> Optional[SentenceTransformer]:
    """Get or initialize the sentence transformer model"""
    global _embedding_model
    
    if not SENTENCE_TRANSFORMERS_AVAILABLE:
        logger.error("sentence-transformers library not available")
        return None
    
    if _embedding_model is None:
        try:
            logger.info(f"Loading sentence transformer model: {_model_name}")
            _embedding_model = SentenceTransformer(_model_name)
            logger.info(f"Model loaded successfully. Embedding dimension: {_embedding_model.get_sentence_embedding_dimension()}")
        except Exception as e:
            logger.error(f"Failed to load sentence transformer model: {str(e)}")
            return None
    
    return _embedding_model

# ============================================================================
# Core Embedding Functions
# ============================================================================

def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generate vector embeddings for a list of texts
    
    Args:
        texts: List of text strings to embed
        
    Returns:
        List of 384-dimensional embedding vectors as lists of floats
    """
    if not texts:
        logger.warning("Empty text list provided for embedding generation")
        return []
    
    if not SENTENCE_TRANSFORMERS_AVAILABLE:
        logger.error("Cannot generate embeddings: sentence-transformers not available")
        return []
    
    model = get_embedding_model()
    if model is None:
        logger.error("Failed to load embedding model")
        return []
    
    try:
        logger.info(f"Generating embeddings for {len(texts)} texts")
        
        # Generate embeddings
        embeddings = model.encode(texts, convert_to_tensor=False, show_progress_bar=False)
        
        # Convert to list of lists (required for JSON serialization)
        embedding_lists = []
        for embedding in embeddings:
            if isinstance(embedding, np.ndarray):
                embedding_lists.append(embedding.tolist())
            else:
                embedding_lists.append(list(embedding))
        
        logger.info(f"Successfully generated {len(embedding_lists)} embeddings")
        return embedding_lists
        
    except Exception as e:
        logger.error(f"Error generating embeddings: {str(e)}")
        return []

def generate_single_embedding(text: str) -> Optional[List[float]]:
    """
    Generate a vector embedding for a single text
    
    Args:
        text: Text string to embed
        
    Returns:
        384-dimensional embedding vector as list of floats, or None if failed
    """
    if not text or not text.strip():
        logger.warning("Empty or whitespace-only text provided for embedding")
        return None
    
    embeddings = generate_embeddings([text.strip()])
    return embeddings[0] if embeddings else None

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
        emb1 = np.array(embedding1).reshape(1, -1)
        emb2 = np.array(embedding2).reshape(1, -1)
        
        # Calculate cosine similarity
        similarity = cosine_similarity(emb1, emb2)[0][0]
        
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
# Concept-Specific Functions
# ============================================================================

def generate_concept_embedding(concept_name: str, concept_description: str) -> Optional[List[float]]:
    """
    Generate embedding for a concept using both name and description
    
    Args:
        concept_name: Name of the concept
        concept_description: Description of the concept
        
    Returns:
        384-dimensional embedding vector, or None if failed
    """
    if not concept_name or not concept_description:
        logger.warning("Missing concept name or description for embedding generation")
        return None
    
    # Combine name and description for richer embedding
    combined_text = f"{concept_name}: {concept_description}"
    return generate_single_embedding(combined_text)

def batch_generate_concept_embeddings(concepts: List[dict]) -> List[Optional[List[float]]]:
    """
    Generate embeddings for a batch of concepts
    
    Args:
        concepts: List of concept dictionaries with 'name' and 'description' keys
        
    Returns:
        List of embedding vectors (same order as input)
    """
    if not concepts:
        return []
    
    try:
        # Prepare combined texts
        combined_texts = []
        for concept in concepts:
            name = concept.get('name', '').strip()
            description = concept.get('description', '').strip()
            
            if name and description:
                combined_texts.append(f"{name}: {description}")
            elif name:
                combined_texts.append(name)
            elif description:
                combined_texts.append(description)
            else:
                combined_texts.append("")  # Empty concept
        
        # Generate embeddings in batch (more efficient)
        embeddings = generate_embeddings(combined_texts)
        
        # Convert empty strings to None
        result = []
        for i, embedding in enumerate(embeddings):
            if combined_texts[i].strip():
                result.append(embedding)
            else:
                result.append(None)
        
        logger.info(f"Generated embeddings for {len([e for e in result if e is not None])}/{len(concepts)} concepts")
        return result
        
    except Exception as e:
        logger.error(f"Error in batch concept embedding generation: {str(e)}")
        return [None] * len(concepts)

# ============================================================================
# Utility Functions
# ============================================================================

def validate_embedding(embedding: List[float], expected_dim: int = 384) -> bool:
    """
    Validate that an embedding has the correct format and dimensions
    
    Args:
        embedding: Embedding vector to validate
        expected_dim: Expected dimension (default 384)
        
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
# Testing and Development Functions
# ============================================================================

def test_embedding_generation():
    """Test function for development and debugging"""
    test_texts = [
        "Machine learning is a subset of artificial intelligence",
        "Neural networks are inspired by biological neurons",
        "Deep learning uses multiple layers of neural networks",
        "Supervised learning requires labeled training data"
    ]
    
    print("Testing embedding generation...")
    
    # Test single embedding
    single_embedding = generate_single_embedding(test_texts[0])
    print(f"Single embedding dimension: {len(single_embedding) if single_embedding else 'None'}")
    print(f"Single embedding valid: {validate_embedding(single_embedding) if single_embedding else False}")
    
    # Test batch embeddings
    batch_embeddings = generate_embeddings(test_texts)
    print(f"Batch embeddings count: {len(batch_embeddings)}")
    
    # Test similarity calculation
    if len(batch_embeddings) >= 2:
        similarity = calculate_similarity(batch_embeddings[0], batch_embeddings[1])
        print(f"Similarity between first two embeddings: {similarity:.4f}")
    
    # Test concept embedding
    concept_embedding = generate_concept_embedding(
        "Machine Learning",
        "A subset of AI that enables computers to learn from data"
    )
    print(f"Concept embedding valid: {validate_embedding(concept_embedding) if concept_embedding else False}")
    
    # Test pgvector format
    if concept_embedding:
        pgvector_str = embedding_to_pgvector_format(concept_embedding)
        print(f"pgvector format length: {len(pgvector_str)}")
    
    print("Embedding tests completed!")

if __name__ == "__main__":
    # Run tests when executed directly
    test_embedding_generation() 