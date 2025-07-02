"""
GeniusReads Concept Similarity and Merging

Advanced concept similarity matching and merging logic for building an intelligent
knowledge base. Handles concept deduplication, relationship detection, and merging
of similar concepts using vector embeddings and database operations.
"""

import logging
import json
from typing import List, Dict, Any, Optional, Tuple, Set
from dataclasses import dataclass
from datetime import datetime
import uuid

from vector_embeddings import (
    generate_concept_embedding,
    calculate_similarity,
    find_most_similar,
    validate_embedding,
    embedding_to_pgvector_format
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# Data Models
# ============================================================================

@dataclass
class ConceptMatch:
    """Represents a similarity match between concepts"""
    source_concept_id: str
    target_concept_id: str
    similarity_score: float
    match_type: str  # 'exact', 'high_similarity', 'related', 'potential_merge'
    confidence: float

@dataclass
class ConceptMergeCandidate:
    """Represents a candidate for concept merging"""
    primary_concept: Dict[str, Any]
    secondary_concepts: List[Dict[str, Any]]
    merge_rationale: str
    combined_confidence: float
    combined_tags: List[str]
    source_chat_sessions: Set[str]

@dataclass
class ConceptRelationship:
    """Represents a relationship between concepts"""
    source_concept_id: str
    target_concept_id: str
    relationship_type: str  # 'related', 'prerequisite', 'builds_on', 'similar', 'opposite'
    strength: float
    detected_reason: str

# ============================================================================
# Similarity Thresholds and Configuration
# ============================================================================

class SimilarityConfig:
    """Configuration for concept similarity matching"""
    
    # Similarity thresholds
    EXACT_MATCH_THRESHOLD = 0.95      # Consider concepts identical
    HIGH_SIMILARITY_THRESHOLD = 0.85  # Strong candidates for merging
    RELATED_THRESHOLD = 0.70          # Related concepts
    MINIMUM_SIMILARITY = 0.60         # Minimum to consider any relationship
    
    # Merging criteria
    MIN_MERGE_CONFIDENCE = 0.80       # Minimum confidence to auto-merge
    MAX_CONCEPTS_PER_MERGE = 5        # Maximum concepts to merge together
    
    # Relationship detection
    PREREQUISITE_KEYWORDS = ['requires', 'needs', 'depends on', 'based on', 'built on']
    OPPOSITE_KEYWORDS = ['not', 'opposite', 'contrary', 'versus', 'vs', 'different from']
    SIMILAR_KEYWORDS = ['similar', 'like', 'comparable', 'analogous', 'equivalent']

# ============================================================================
# Core Similarity Matching Functions
# ============================================================================

def find_similar_concepts(
    new_concept: Dict[str, Any],
    existing_concepts: List[Dict[str, Any]],
    threshold: float = SimilarityConfig.RELATED_THRESHOLD
) -> List[ConceptMatch]:
    """
    Find existing concepts similar to a new concept
    
    Args:
        new_concept: New concept to match against
        existing_concepts: List of existing concepts in the database
        threshold: Minimum similarity threshold
        
    Returns:
        List of ConceptMatch objects sorted by similarity
    """
    logger.info(f"Finding similar concepts for: {new_concept.get('name', 'Unknown')}")
    
    try:
        # Generate embedding for new concept
        new_embedding = generate_concept_embedding(
            new_concept.get('name', ''),
            new_concept.get('description', '')
        )
        
        if not new_embedding:
            logger.warning("Failed to generate embedding for new concept")
            return []
        
        matches = []
        
        for existing_concept in existing_concepts:
            # Skip if no embedding available
            existing_embedding = existing_concept.get('embedding')
            if not existing_embedding or not validate_embedding(existing_embedding):
                continue
            
            # Calculate similarity
            similarity = calculate_similarity(new_embedding, existing_embedding)
            
            if similarity >= threshold:
                # Determine match type
                match_type = _determine_match_type(similarity)
                
                # Calculate confidence based on similarity and concept quality
                confidence = _calculate_match_confidence(
                    new_concept, existing_concept, similarity
                )
                
                match = ConceptMatch(
                    source_concept_id=new_concept.get('id', ''),
                    target_concept_id=existing_concept.get('id', ''),
                    similarity_score=similarity,
                    match_type=match_type,
                    confidence=confidence
                )
                
                matches.append(match)
        
        # Sort by similarity score (descending)
        matches.sort(key=lambda x: x.similarity_score, reverse=True)
        
        logger.info(f"Found {len(matches)} similar concepts above threshold {threshold}")
        return matches
        
    except Exception as e:
        logger.error(f"Error finding similar concepts: {str(e)}")
        return []

def detect_concept_relationships(
    concept: Dict[str, Any],
    related_concepts: List[Dict[str, Any]]
) -> List[ConceptRelationship]:
    """
    Detect specific relationships between concepts based on content analysis
    
    Args:
        concept: Primary concept
        related_concepts: List of potentially related concepts
        
    Returns:
        List of detected relationships
    """
    logger.info(f"Detecting relationships for concept: {concept.get('name', 'Unknown')}")
    
    relationships = []
    concept_description = concept.get('description', '').lower()
    concept_name = concept.get('name', '').lower()
    
    try:
        for related_concept in related_concepts:
            related_name = related_concept.get('name', '').lower()
            related_description = related_concept.get('description', '').lower()
            
            # Analyze text for relationship indicators
            relationship_type, strength, reason = _analyze_relationship_text(
                concept_name, concept_description,
                related_name, related_description
            )
            
            if relationship_type and strength > 0.5:
                relationship = ConceptRelationship(
                    source_concept_id=concept.get('id', ''),
                    target_concept_id=related_concept.get('id', ''),
                    relationship_type=relationship_type,
                    strength=strength,
                    detected_reason=reason
                )
                
                relationships.append(relationship)
        
        logger.info(f"Detected {len(relationships)} relationships")
        return relationships
        
    except Exception as e:
        logger.error(f"Error detecting relationships: {str(e)}")
        return []

# ============================================================================
# Concept Merging Logic
# ============================================================================

def identify_merge_candidates(
    concepts: List[Dict[str, Any]],
    similarity_threshold: float = SimilarityConfig.HIGH_SIMILARITY_THRESHOLD
) -> List[ConceptMergeCandidate]:
    """
    Identify groups of concepts that should be merged together
    
    Args:
        concepts: List of concepts to analyze
        similarity_threshold: Threshold for considering merge candidates
        
    Returns:
        List of merge candidates
    """
    logger.info(f"Identifying merge candidates from {len(concepts)} concepts")
    
    try:
        merge_candidates = []
        processed_concept_ids = set()
        
        for i, primary_concept in enumerate(concepts):
            primary_id = primary_concept.get('id', '')
            
            # Skip if already processed as part of another merge
            if primary_id in processed_concept_ids:
                continue
            
            # Find similar concepts
            similar_concepts = []
            
            for j, other_concept in enumerate(concepts):
                if i == j:  # Skip self
                    continue
                
                other_id = other_concept.get('id', '')
                if other_id in processed_concept_ids:
                    continue
                
                # Calculate similarity
                similarity = _calculate_concept_similarity(primary_concept, other_concept)
                
                if similarity >= similarity_threshold:
                    similar_concepts.append({
                        'concept': other_concept,
                        'similarity': similarity
                    })
            
            # If we found similar concepts, create a merge candidate
            if similar_concepts:
                # Sort by similarity
                similar_concepts.sort(key=lambda x: x['similarity'], reverse=True)
                
                # Limit the number of concepts per merge
                similar_concepts = similar_concepts[:SimilarityConfig.MAX_CONCEPTS_PER_MERGE - 1]
                
                # Create merge candidate
                merge_candidate = _create_merge_candidate(
                    primary_concept,
                    [sc['concept'] for sc in similar_concepts]
                )
                
                if merge_candidate.combined_confidence >= SimilarityConfig.MIN_MERGE_CONFIDENCE:
                    merge_candidates.append(merge_candidate)
                    
                    # Mark all concepts as processed
                    processed_concept_ids.add(primary_id)
                    for sc in similar_concepts:
                        processed_concept_ids.add(sc['concept'].get('id', ''))
        
        logger.info(f"Identified {len(merge_candidates)} merge candidates")
        return merge_candidates
        
    except Exception as e:
        logger.error(f"Error identifying merge candidates: {str(e)}")
        return []

def merge_concepts(merge_candidate: ConceptMergeCandidate) -> Dict[str, Any]:
    """
    Merge multiple concepts into a single, improved concept
    
    Args:
        merge_candidate: The merge candidate containing concepts to merge
        
    Returns:
        Merged concept dictionary
    """
    logger.info(f"Merging concepts: {merge_candidate.primary_concept.get('name', 'Unknown')}")
    
    try:
        primary = merge_candidate.primary_concept
        secondaries = merge_candidate.secondary_concepts
        
        # Start with primary concept as base
        merged_concept = primary.copy()
        
        # Improve the description by combining insights
        merged_description = _merge_descriptions(
            primary.get('description', ''),
            [sc.get('description', '') for sc in secondaries]
        )
        
        # Combine and deduplicate tags
        all_tags = set(primary.get('tags', []))
        for secondary in secondaries:
            all_tags.update(secondary.get('tags', []))
        
        # Combine related concepts
        all_related = set(primary.get('related_concepts', []))
        for secondary in secondaries:
            all_related.update(secondary.get('related_concepts', []))
        
        # Calculate combined confidence
        confidences = [primary.get('confidence_score', 0.0)]
        confidences.extend([sc.get('confidence_score', 0.0) for sc in secondaries])
        combined_confidence = sum(confidences) / len(confidences)
        
        # Update merged concept
        merged_concept.update({
            'description': merged_description,
            'tags': sorted(list(all_tags)),
            'related_concepts': sorted(list(all_related)),
            'confidence_score': min(combined_confidence * 1.1, 1.0),  # Slight boost for merging
            'source_chat_count': sum([
                primary.get('source_chat_count', 0)
            ] + [sc.get('source_chat_count', 0) for sc in secondaries]),
            'merged_from': [sc.get('id', '') for sc in secondaries],
            'merge_timestamp': datetime.now().isoformat(),
            'merge_rationale': merge_candidate.merge_rationale
        })
        
        logger.info(f"Successfully merged {len(secondaries) + 1} concepts")
        return merged_concept
        
    except Exception as e:
        logger.error(f"Error merging concepts: {str(e)}")
        return merge_candidate.primary_concept

# ============================================================================
# Helper Functions
# ============================================================================

def _determine_match_type(similarity: float) -> str:
    """Determine the type of match based on similarity score"""
    if similarity >= SimilarityConfig.EXACT_MATCH_THRESHOLD:
        return 'exact'
    elif similarity >= SimilarityConfig.HIGH_SIMILARITY_THRESHOLD:
        return 'high_similarity'
    elif similarity >= SimilarityConfig.RELATED_THRESHOLD:
        return 'related'
    else:
        return 'potential_merge'

def _calculate_match_confidence(
    concept1: Dict[str, Any],
    concept2: Dict[str, Any],
    similarity: float
) -> float:
    """Calculate confidence in a concept match"""
    base_confidence = similarity
    
    # Boost confidence if concepts have similar tags
    tags1 = set(concept1.get('tags', []))
    tags2 = set(concept2.get('tags', []))
    tag_overlap = len(tags1.intersection(tags2)) / max(len(tags1.union(tags2)), 1)
    
    # Boost confidence if both concepts have high individual confidence
    conf1 = concept1.get('confidence_score', 0.5)
    conf2 = concept2.get('confidence_score', 0.5)
    avg_confidence = (conf1 + conf2) / 2
    
    # Combined confidence
    combined_confidence = (base_confidence * 0.7 + tag_overlap * 0.2 + avg_confidence * 0.1)
    return min(combined_confidence, 1.0)

def _analyze_relationship_text(
    name1: str, desc1: str, name2: str, desc2: str
) -> Tuple[Optional[str], float, str]:
    """Analyze text to detect specific relationship types"""
    
    # Check for prerequisite relationships
    for keyword in SimilarityConfig.PREREQUISITE_KEYWORDS:
        if keyword in desc1 and name2 in desc1:
            return 'prerequisite', 0.8, f"'{name1}' mentions requiring '{name2}'"
        elif keyword in desc2 and name1 in desc2:
            return 'builds_on', 0.8, f"'{name2}' builds on '{name1}'"
    
    # Check for opposite relationships
    for keyword in SimilarityConfig.OPPOSITE_KEYWORDS:
        if keyword in desc1 and name2 in desc1:
            return 'opposite', 0.7, f"'{name1}' described as opposite to '{name2}'"
        elif keyword in desc2 and name1 in desc2:
            return 'opposite', 0.7, f"'{name2}' described as opposite to '{name1}'"
    
    # Check for similar relationships
    for keyword in SimilarityConfig.SIMILAR_KEYWORDS:
        if keyword in desc1 and name2 in desc1:
            return 'similar', 0.6, f"'{name1}' described as similar to '{name2}'"
        elif keyword in desc2 and name1 in desc2:
            return 'similar', 0.6, f"'{name2}' described as similar to '{name1}'"
    
    # Default to related if no specific relationship found
    return 'related', 0.5, "Concepts appear related based on content"

def _calculate_concept_similarity(concept1: Dict[str, Any], concept2: Dict[str, Any]) -> float:
    """Calculate similarity between two concepts"""
    try:
        emb1 = concept1.get('embedding')
        emb2 = concept2.get('embedding')
        
        if not emb1 or not emb2:
            # Fallback to generating embeddings if not available
            emb1 = generate_concept_embedding(
                concept1.get('name', ''), concept1.get('description', '')
            )
            emb2 = generate_concept_embedding(
                concept2.get('name', ''), concept2.get('description', '')
            )
        
        if emb1 and emb2:
            return calculate_similarity(emb1, emb2)
        
        return 0.0
        
    except Exception as e:
        logger.error(f"Error calculating concept similarity: {str(e)}")
        return 0.0

def _create_merge_candidate(
    primary: Dict[str, Any],
    secondaries: List[Dict[str, Any]]
) -> ConceptMergeCandidate:
    """Create a merge candidate from concepts"""
    
    # Calculate combined confidence
    all_confidences = [primary.get('confidence_score', 0.5)]
    all_confidences.extend([sc.get('confidence_score', 0.5) for sc in secondaries])
    combined_confidence = sum(all_confidences) / len(all_confidences)
    
    # Combine tags
    all_tags = set(primary.get('tags', []))
    for secondary in secondaries:
        all_tags.update(secondary.get('tags', []))
    
    # Collect source chat sessions
    source_sessions = set()
    # Note: This would need to be populated from actual database queries
    
    # Create rationale
    secondary_names = [sc.get('name', 'Unknown') for sc in secondaries]
    rationale = f"High similarity detected between '{primary.get('name', 'Unknown')}' and {len(secondaries)} other concepts: {', '.join(secondary_names)}"
    
    return ConceptMergeCandidate(
        primary_concept=primary,
        secondary_concepts=secondaries,
        merge_rationale=rationale,
        combined_confidence=combined_confidence,
        combined_tags=sorted(list(all_tags)),
        source_chat_sessions=source_sessions
    )

def _merge_descriptions(primary_desc: str, secondary_descs: List[str]) -> str:
    """Merge multiple concept descriptions into an improved single description"""
    
    # Start with primary description
    merged = primary_desc.strip()
    
    # Add unique insights from secondary descriptions
    for secondary_desc in secondary_descs:
        secondary = secondary_desc.strip()
        if secondary and secondary not in merged:
            # Simple approach: add as additional context
            # In a more sophisticated system, this could use LLM to properly merge
            if merged and not merged.endswith('.'):
                merged += '.'
            merged += f" Additionally, {secondary}"
    
    return merged

# ============================================================================
# Main Processing Functions
# ============================================================================

def process_concept_similarities(
    new_concepts: List[Dict[str, Any]],
    existing_concepts: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Main function to process concept similarities and merging
    
    Args:
        new_concepts: Newly extracted concepts
        existing_concepts: Existing concepts in the database
        
    Returns:
        Dictionary with similarity results and merge recommendations
    """
    logger.info(f"Processing similarities for {len(new_concepts)} new concepts against {len(existing_concepts)} existing")
    
    try:
        results = {
            'matches': [],
            'relationships': [],
            'merge_candidates': [],
            'new_concepts_to_add': [],
            'concepts_to_update': [],
            'processing_summary': {}
        }
        
        for new_concept in new_concepts:
            # Find similar existing concepts
            matches = find_similar_concepts(new_concept, existing_concepts)
            results['matches'].extend(matches)
            
            # If high similarity match found, recommend update instead of new concept
            high_similarity_matches = [m for m in matches if m.match_type in ['exact', 'high_similarity']]
            
            if high_similarity_matches:
                # Recommend updating existing concept
                best_match = high_similarity_matches[0]
                results['concepts_to_update'].append({
                    'existing_concept_id': best_match.target_concept_id,
                    'new_concept_data': new_concept,
                    'similarity_score': best_match.similarity_score,
                    'match_type': best_match.match_type
                })
            else:
                # Add as new concept
                results['new_concepts_to_add'].append(new_concept)
            
            # Detect relationships with related concepts
            related_concepts = [
                existing_concepts[i] for i, ec in enumerate(existing_concepts)
                if any(m.target_concept_id == ec.get('id', '') for m in matches)
            ]
            
            if related_concepts:
                relationships = detect_concept_relationships(new_concept, related_concepts)
                results['relationships'].extend(relationships)
        
        # Identify merge candidates among all concepts
        all_concepts = existing_concepts + results['new_concepts_to_add']
        merge_candidates = identify_merge_candidates(all_concepts)
        results['merge_candidates'] = merge_candidates
        
        # Processing summary
        results['processing_summary'] = {
            'total_new_concepts': len(new_concepts),
            'total_existing_concepts': len(existing_concepts),
            'matches_found': len(results['matches']),
            'relationships_detected': len(results['relationships']),
            'merge_candidates_identified': len(merge_candidates),
            'concepts_to_add': len(results['new_concepts_to_add']),
            'concepts_to_update': len(results['concepts_to_update'])
        }
        
        logger.info(f"Similarity processing complete: {results['processing_summary']}")
        return results
        
    except Exception as e:
        logger.error(f"Error processing concept similarities: {str(e)}")
        return {
            'matches': [],
            'relationships': [],
            'merge_candidates': [],
            'new_concepts_to_add': new_concepts,  # Fallback: add all as new
            'concepts_to_update': [],
            'processing_summary': {'error': str(e)}
        }

# ============================================================================
# Testing Functions
# ============================================================================

def test_concept_similarity():
    """Test function for development and debugging"""
    
    # Sample concepts for testing
    test_concepts = [
        {
            'id': '1',
            'name': 'Machine Learning',
            'description': 'A subset of AI that enables computers to learn from data',
            'tags': ['ai', 'technology', 'data'],
            'confidence_score': 0.9
        },
        {
            'id': '2',
            'name': 'ML',
            'description': 'Machine learning algorithms that learn patterns from data',
            'tags': ['ai', 'algorithms', 'data'],
            'confidence_score': 0.8
        },
        {
            'id': '3',
            'name': 'Neural Networks',
            'description': 'Computing systems inspired by biological neural networks',
            'tags': ['ai', 'deep-learning', 'networks'],
            'confidence_score': 0.85
        }
    ]
    
    print("Testing concept similarity matching...")
    
    # Test similarity finding
    matches = find_similar_concepts(test_concepts[0], test_concepts[1:])
    print(f"Found {len(matches)} matches")
    
    # Test merge candidate identification
    merge_candidates = identify_merge_candidates(test_concepts)
    print(f"Identified {len(merge_candidates)} merge candidates")
    
    # Test relationship detection
    relationships = detect_concept_relationships(test_concepts[0], test_concepts[1:])
    print(f"Detected {len(relationships)} relationships")
    
    print("Concept similarity tests completed!")

if __name__ == "__main__":
    # Run tests when executed directly
    test_concept_similarity() 