"""
GeniusReads Concept Extractor

LangGraph workflow for automated concept extraction from chat sessions.
Analyzes conversation content and highlighted text to identify key concepts,
generate descriptions, and return structured results for knowledge base storage.
"""

import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import asyncio

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import Graph, StateGraph, END
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field
import openai

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# Data Models
# ============================================================================

class ConceptExtractionState(BaseModel):
    """State object for the LangGraph workflow"""
    chat_session_id: str
    messages: List[Dict[str, Any]]
    highlighted_contexts: List[Dict[str, Any]]
    raw_content: str = ""
    extracted_concepts: List[Dict[str, Any]] = Field(default_factory=list)
    processing_stage: str = "initialized"
    error_message: Optional[str] = None
    success: bool = False

class ExtractedConcept(BaseModel):
    """Represents a single extracted concept"""
    name: str
    description: str
    tags: List[str] = Field(default_factory=list)
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0)
    related_concepts: List[str] = Field(default_factory=list)

# ============================================================================
# LangGraph Workflow Nodes
# ============================================================================

def parse_input_data(state: ConceptExtractionState) -> ConceptExtractionState:
    """Parse and prepare input data for concept extraction"""
    logger.info(f"Parsing input data for chat session: {state.chat_session_id}")
    
    try:
        # Combine all message content
        message_content = []
        for msg in state.messages:
            content = msg.get('content', '')
            sender = msg.get('sender_type', 'unknown')
            message_content.append(f"[{sender.upper()}]: {content}")
        
        # Add highlighted contexts
        context_content = []
        for context in state.highlighted_contexts:
            doc_title = context.get('document_title', 'Unknown Document')
            page_num = context.get('page_number', 0)
            selected_text = context.get('selected_text', '')
            context_content.append(f"From '{doc_title}' (page {page_num}): {selected_text}")
        
        # Combine all content
        raw_content_parts = []
        if context_content:
            raw_content_parts.append("=== HIGHLIGHTED TEXT CONTEXTS ===")
            raw_content_parts.extend(context_content)
            raw_content_parts.append("")
        
        if message_content:
            raw_content_parts.append("=== CONVERSATION MESSAGES ===")
            raw_content_parts.extend(message_content)
        
        state.raw_content = "\n".join(raw_content_parts)
        state.processing_stage = "content_parsed"
        
        logger.info(f"Successfully parsed {len(state.messages)} messages and {len(state.highlighted_contexts)} contexts")
        return state
        
    except Exception as e:
        logger.error(f"Error parsing input data: {str(e)}")
        state.error_message = f"Failed to parse input data: {str(e)}"
        state.processing_stage = "error"
        return state

def extract_concepts_with_openai(state: ConceptExtractionState) -> ConceptExtractionState:
    """Extract concepts using OpenAI GPT model"""
    logger.info("Extracting concepts using OpenAI")
    
    try:
        # Check if OpenAI API key is available
        import os
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            logger.error("OPENAI_API_KEY environment variable not set")
            state.error_message = "OpenAI API key not found in environment"
            state.processing_stage = "error"
            return state
        
        logger.info(f"OpenAI API key found (length: {len(api_key)})")
        
        # Initialize OpenAI client
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.1,  # Low temperature for consistent extraction
            max_tokens=2000
        )
        
        # Create system prompt for concept extraction
        system_prompt = """You are an expert at extracting key concepts from technical conversations and documents.

Your task is to analyze the provided conversation and highlighted text contexts to identify important concepts that the user is learning about.

Guidelines:
1. Focus on technical terms, important ideas, and concepts that would be valuable for building a knowledge base
2. Extract concepts that are explicitly discussed or defined in the conversation
3. Avoid overly broad concepts - focus on specific, actionable knowledge
4. Generate clear, concise descriptions that explain what each concept means
5. Assign confidence scores based on how well the concept is explained in the source material
6. Identify related concepts that are mentioned together

Return your response as a JSON object with the following structure:
{
    "concepts": [
        {
            "name": "Concept Name",
            "description": "Clear explanation of what this concept means",
            "tags": ["tag1", "tag2"],
            "confidence_score": 0.85,
            "related_concepts": ["Related Concept 1", "Related Concept 2"]
        }
    ]
}

Only return the JSON object, no additional text."""

        # Create user prompt with the content
        user_prompt = f"""Please extract key concepts from the following conversation and highlighted text contexts:

{state.raw_content}

Focus on technical concepts, important definitions, and knowledge that would be valuable for future reference."""

        # Call OpenAI
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response = llm.invoke(messages)
        response_content = response.content.strip()
        
        # Parse JSON response
        try:
            concept_data = json.loads(response_content)
            concepts = concept_data.get('concepts', [])
            
            # Validate and clean up concepts
            validated_concepts = []
            for concept in concepts:
                if isinstance(concept, dict) and 'name' in concept and 'description' in concept:
                    # Ensure required fields
                    validated_concept = {
                        'name': concept.get('name', '').strip(),
                        'description': concept.get('description', '').strip(),
                        'tags': concept.get('tags', []),
                        'confidence_score': min(max(concept.get('confidence_score', 0.5), 0.0), 1.0),
                        'related_concepts': concept.get('related_concepts', [])
                    }
                    
                    # Only add if name and description are not empty
                    if validated_concept['name'] and validated_concept['description']:
                        validated_concepts.append(validated_concept)
            
            state.extracted_concepts = validated_concepts
            state.processing_stage = "concepts_extracted"
            state.success = True
            
            logger.info(f"Successfully extracted {len(validated_concepts)} concepts")
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {str(e)}")
            logger.error(f"Response content: {response_content}")
            state.error_message = f"Failed to parse OpenAI response as JSON: {str(e)}"
            state.processing_stage = "error"
            
    except Exception as e:
        logger.error(f"Error during concept extraction: {str(e)}")
        state.error_message = f"OpenAI concept extraction failed: {str(e)}"
        state.processing_stage = "error"
    
    return state

def finalize_results(state: ConceptExtractionState) -> ConceptExtractionState:
    """Finalize and validate the extraction results"""
    logger.info("Finalizing concept extraction results")
    
    try:
        # Final validation and cleanup
        final_concepts = []
        
        for concept in state.extracted_concepts:
            # Additional validation
            if (concept.get('name') and 
                concept.get('description') and 
                len(concept.get('name', '').strip()) > 0 and
                len(concept.get('description', '').strip()) > 0):
                
                final_concepts.append(concept)
        
        state.extracted_concepts = final_concepts
        state.processing_stage = "completed"
        
        if final_concepts:
            state.success = True
            logger.info(f"Finalized {len(final_concepts)} concepts for extraction")
        else:
            state.success = False
            state.error_message = "No valid concepts were extracted"
            logger.warning("No valid concepts found after finalization")
            
    except Exception as e:
        logger.error(f"Error finalizing results: {str(e)}")
        state.error_message = f"Failed to finalize results: {str(e)}"
        state.processing_stage = "error"
        state.success = False
    
    return state

# ============================================================================
# LangGraph Workflow Definition
# ============================================================================

def create_concept_extraction_workflow():
    """Create and configure the LangGraph workflow"""
    
    # Create state graph
    workflow = StateGraph(ConceptExtractionState)
    
    # Add nodes
    workflow.add_node("parse_input", parse_input_data)
    workflow.add_node("extract_concepts", extract_concepts_with_openai)
    workflow.add_node("finalize_results", finalize_results)
    
    # Define edges
    workflow.add_edge("parse_input", "extract_concepts")
    workflow.add_edge("extract_concepts", "finalize_results")
    workflow.add_edge("finalize_results", END)
    
    # Set entry point
    workflow.set_entry_point("parse_input")
    
    # Compile the workflow
    return workflow.compile()

# ============================================================================
# Main Extraction Function (Called from Rust)
# ============================================================================

def extract_concepts_from_chat(input_data: Dict[str, Any]) -> str:
    """
    Main function called from Rust bridge for concept extraction
    
    Args:
        input_data: Dictionary containing:
            - chat_session_id: UUID string
            - messages: List of chat messages
            - highlighted_contexts: List of highlighted text contexts
    
    Returns:
        JSON string with extraction results:
            - success: bool
            - concepts: List of extracted concepts
            - error_message: Optional error message
    """
    logger.info(f"Starting concept extraction for chat session: {input_data.get('chat_session_id')}")
    
    try:
        # Create initial state
        state = ConceptExtractionState(
            chat_session_id=input_data.get('chat_session_id', ''),
            messages=input_data.get('messages', []),
            highlighted_contexts=input_data.get('highlighted_contexts', [])
        )
        
        # Create and run workflow
        workflow = create_concept_extraction_workflow()
        
        # Execute the workflow
        final_state = workflow.invoke(state)
        
        # Extract values from the LangGraph state object
        # LangGraph returns an AddableValuesDict, so we need to access the fields properly
        success = final_state.get('success', False)
        concepts = final_state.get('extracted_concepts', [])
        processing_stage = final_state.get('processing_stage', 'unknown')
        error_message = final_state.get('error_message', None)
        
        # Prepare response
        response = {
            'success': success,
            'concepts': concepts,
            'processing_stage': processing_stage,
            'error_message': error_message
        }
        
        logger.info(f"Concept extraction completed. Success: {success}, Concepts: {len(concepts)}")
        return json.dumps(response)
        
    except Exception as e:
        logger.error(f"Unexpected error in concept extraction: {str(e)}")
        error_response = {
            'success': False,
            'concepts': [],
            'processing_stage': 'error',
            'error_message': f"Unexpected error: {str(e)}"
        }
        return json.dumps(error_response)

def extract_concepts(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Legacy function for backward compatibility
    
    Args:
        input_data: Dictionary containing:
            - chat_session_id: UUID string
            - messages: List of chat messages
            - highlighted_contexts: List of highlighted text contexts
    
    Returns:
        Dictionary with extraction results:
            - success: bool
            - concepts: List of extracted concepts
            - error_message: Optional error message
    """
    result_json = extract_concepts_from_chat(input_data)
    return json.loads(result_json)

# ============================================================================
# Testing and Development Functions
# ============================================================================

def test_concept_extraction():
    """Test function for development and debugging"""
    test_input = {
        'chat_session_id': 'test-session-123',
        'messages': [
            {
                'content': 'What is machine learning?',
                'sender_type': 'user',
                'created_at': '2024-01-01T00:00:00Z'
            },
            {
                'content': 'Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed. It uses algorithms to analyze data, identify patterns, and make predictions or decisions.',
                'sender_type': 'assistant',
                'created_at': '2024-01-01T00:01:00Z'
            }
        ],
        'highlighted_contexts': [
            {
                'document_title': 'AI Textbook',
                'page_number': 15,
                'selected_text': 'Machine learning algorithms can be categorized into supervised learning, unsupervised learning, and reinforcement learning.'
            }
        ]
    }
    
    result = extract_concepts(test_input)
    print("Test Result:")
    print(json.dumps(result, indent=2))
    return result

if __name__ == "__main__":
    # Run test when executed directly
    test_concept_extraction() 