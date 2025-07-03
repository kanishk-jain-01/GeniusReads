"""
GeniusReads Concept Similarity

Core functionality for matching new concepts against an existing knowledge base
using vector embeddings to prevent duplicate entries.
"""

import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from vector_embeddings import (
    generate_concept_embedding,
    calculate_similarity,
    validate_embedding
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# Data Models
# ============================================================================

@dataclass
class ConceptMatch:
    """Represents a similarity match between a new concept and an existing one."""
    existing_concept_id: str
    existing_concept_name: str
    similarity_score: float
    is_strong_match: bool

# ============================================================================
# Similarity Thresholds and Configuration
# ============================================================================

class SimilarityConfig:
    """Configuration for concept similarity matching."""
    
    # When a new concept is considered a "strong" match to an existing one,
    # meaning it should be linked rather than created anew.
    STRONG_MATCH_THRESHOLD = 0.70
    
    # The minimum similarity for a concept to even be considered related.
    # This can be used to find related concepts without creating a link.
    RELATED_THRESHOLD = 0.70

# ============================================================================
# Core Similarity Matching Function
# ============================================================================

def find_best_concept_match(
    new_concept: Dict[str, Any],
    existing_concepts: List[Dict[str, Any]]
) -> Optional[ConceptMatch]:
    """
    Finds the single best match for a new concept from a list of existing ones.

    This function calculates the similarity between a new concept and all existing
    concepts, returning the one with the highest similarity score, provided it
    meets the minimum RELATED_THRESHOLD.
    
    Args:
        new_concept: The newly extracted concept to match against.
                     Expected keys: 'name', 'description'.
        existing_concepts: A list of existing concepts from the database.
                           Expected keys: 'id', 'name', 'embedding'.
        
    Returns:
        A ConceptMatch object if a suitable match is found, otherwise None.
    """
    logger.info(f"Finding best match for new concept: '{new_concept.get('name', 'Unknown')}'")
    
    try:
        new_embedding = generate_concept_embedding(
            new_concept.get('name', ''),
            new_concept.get('description', '')
        )
        
        if not new_embedding:
            logger.warning("Failed to generate embedding for the new concept. Cannot find matches.")
            return None
        
        best_match: Optional[ConceptMatch] = None
        highest_similarity = -1.0
        
        for existing_concept in existing_concepts:
            existing_embedding = existing_concept.get('embedding')
            if not existing_embedding or not validate_embedding(existing_embedding):
                continue
            
            similarity = calculate_similarity(new_embedding, existing_embedding)
            
            if similarity > highest_similarity:
                highest_similarity = similarity
                
                if similarity >= SimilarityConfig.RELATED_THRESHOLD:
                    best_match = ConceptMatch(
                        existing_concept_id=existing_concept.get('id', ''),
                        existing_concept_name=existing_concept.get('name', ''),
                        similarity_score=similarity,
                        is_strong_match=(similarity >= SimilarityConfig.STRONG_MATCH_THRESHOLD)
                    )

        if best_match:
            logger.info(
                f"Best match found: '{best_match.existing_concept_name}' "
                f"with similarity {best_match.similarity_score:.2f}."
            )
        else:
            logger.info("No suitable match found above the minimum threshold.")
            
        return best_match
        
    except Exception as e:
        logger.error(f"An error occurred while finding the best concept match: {str(e)}")
        return None 