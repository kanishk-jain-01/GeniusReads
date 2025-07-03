"""
GeniusReads Concept Processor

This script is the main entry point called from the Rust backend. It orchestrates
the process of:
1. Receiving newly extracted concepts and existing concepts from the database.
2. Using the `concept_similarity` module to find matches.
3. Writing new concepts or linking to existing ones directly in the database.
4. Returning a summary of the operations to the Rust backend.

This approach centralizes the database logic (especially `pgvector` operations)
in Python, avoiding potential issues with Rust's `sqlx` and `pgvector`
integration.
"""

import os
import json
import logging
import psycopg2
from typing import List, Dict, Any
from pathlib import Path
from dotenv import load_dotenv

from concept_similarity import find_best_concept_match, ConceptMatch
from vector_embeddings import generate_concept_embedding, embedding_to_pgvector_format

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Construct an absolute path to the .env file
# The script is in src-tauri/python, so we go up two levels to find the project root
project_root = Path(__file__).resolve().parent.parent.parent
dotenv_path = project_root / '.env'
logger.info(f"Loading .env file from: {dotenv_path}")

# Load environment variables from the specific .env file path
if dotenv_path.exists():
    load_dotenv(dotenv_path=dotenv_path)
else:
    logger.error(f".env file not found at the expected path: {dotenv_path}")

def get_db_connection():
    """Establishes a connection to the PostgreSQL database."""
    # Log the environment variables being used for the connection
    dbname = os.getenv("PG_DBNAME")
    user = os.getenv("PG_USER")
    host = os.getenv("PG_HOST")
    port = os.getenv("PG_PORT")
    
    logger.info(f"Attempting to connect to database '{dbname}' on {host}:{port} for user '{user}'")

    try:
        conn = psycopg2.connect(
            dbname=dbname,
            user=user,
            password=os.getenv("PG_PASSWORD"), # Don't log the password
            host=host,
            port=port
        )
        logger.info("Database connection successful.")
        return conn
    except psycopg2.OperationalError as e:
        logger.error(f"Error connecting to the database: {e}")
        raise

def process_and_store_concepts(chat_session_id: str, new_concepts_json: str, existing_concepts_json: str) -> str:
    """
    Main function to process, compare, and store concepts.

    Args:
        chat_session_id: The ID of the current chat session.
        new_concepts_json: A JSON string representing the list of newly extracted concepts.
        existing_concepts_json: A JSON string representing the list of existing concepts.

    Returns:
        A JSON string with the results of the processing.
    """
    new_concepts = json.loads(new_concepts_json)
    existing_concepts = json.loads(existing_concepts_json)
    
    logger.info(f"Starting concept processing for chat session {chat_session_id}. "
                f"Processing {len(new_concepts)} new concepts against {len(existing_concepts)} existing ones.")

    results = {
        "success": False,
        "newConceptsCreated": 0,
        "conceptsLinked": 0,
        "errorMessage": None
    }

    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            for concept in new_concepts:
                best_match = find_best_concept_match(concept, existing_concepts)
                
                if best_match and best_match.is_strong_match:
                    # Strong match found, link to the existing concept
                    logger.info(f"Linking to existing concept '{best_match.existing_concept_name}' "
                                f"with similarity {best_match.similarity_score:.2f}")
                    
                    cur.execute(
                        """
                        INSERT INTO concept_chat_links (concept_id, chat_session_id, relevance_score, created_at)
                        VALUES (%s, %s, %s, NOW())
                        ON CONFLICT (concept_id, chat_session_id) DO NOTHING;
                        """,
                        (best_match.existing_concept_id, chat_session_id, best_match.similarity_score)
                    )

                    # Also, increment the source_chat_count for the existing concept
                    cur.execute(
                        """
                        UPDATE concepts
                        SET 
                            source_chat_count = source_chat_count + 1,
                            updated_at = NOW()
                        WHERE id = %s;
                        """,
                        (best_match.existing_concept_id,)
                    )
                    
                    results["conceptsLinked"] += 1
                else:
                    # No strong match, create a new concept
                    logger.info(f"Creating new concept: '{concept.get('name')}'")
                    
                    # Generate embedding for the new concept
                    embedding = generate_concept_embedding(
                        concept.get('name', ''),
                        concept.get('description', '')
                    )
                    embedding_str = embedding_to_pgvector_format(embedding) if embedding else None

                    cur.execute(
                        """
                        INSERT INTO concepts (name, description, tags, confidence_score, embedding, source_chat_count, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, 1, NOW(), NOW())
                        RETURNING id;
                        """,
                        (
                            concept.get('name'),
                            concept.get('description'),
                            json.dumps(concept.get('tags', [])),
                            concept.get('confidence_score', 0.5),
                            embedding_str
                        )
                    )
                    new_concept_id = cur.fetchone()[0]
                    
                    # Link the new concept to the chat session
                    cur.execute(
                        """
                        INSERT INTO concept_chat_links (concept_id, chat_session_id, relevance_score, created_at)
                        VALUES (%s, %s, %s, NOW());
                        """,
                        (new_concept_id, chat_session_id, concept.get('confidence_score', 0.5))
                    )
                    results["newConceptsCreated"] += 1

            conn.commit()
            results["success"] = True
            logger.info(f"Processing complete. Created: {results['newConceptsCreated']}, Linked: {results['conceptsLinked']}")

    except Exception as e:
        logger.error(f"An error occurred during concept processing: {e}", exc_info=True)
        results["errorMessage"] = str(e)
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

    return json.dumps(results) 