-- Migration 003: Update vector dimensions for OpenAI embeddings
-- Changes embedding dimensions from 384 (sentence-transformers) to 1536 (OpenAI text-embedding-3-small)

-- Drop the existing vector index (it will be recreated with new dimensions)
DROP INDEX IF EXISTS idx_concepts_embedding_hnsw;

-- Drop the similarity function (it will be recreated with new dimensions)
DROP FUNCTION IF EXISTS find_similar_concepts(VECTOR(384), FLOAT, INTEGER);

-- Update the embedding column to use 1536 dimensions
ALTER TABLE concepts ALTER COLUMN embedding TYPE VECTOR(1536);

-- Recreate the vector similarity index with new dimensions
CREATE INDEX idx_concepts_embedding_hnsw ON concepts USING hnsw (embedding vector_cosine_ops);

-- Recreate the similarity function with new dimensions
CREATE OR REPLACE FUNCTION find_similar_concepts(
    target_embedding VECTOR(1536),
    similarity_threshold FLOAT DEFAULT 0.7,
    max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
    concept_id UUID,
    concept_name VARCHAR(500),
    concept_description TEXT,
    similarity_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.description,
        1 - (c.embedding <=> target_embedding) as similarity
    FROM concepts c
    WHERE c.embedding IS NOT NULL
      AND 1 - (c.embedding <=> target_embedding) >= similarity_threshold
    ORDER BY c.embedding <=> target_embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Update the comment to reflect the new embedding source
COMMENT ON COLUMN concepts.embedding IS '1536-dimensional vector embedding from OpenAI text-embedding-3-small'; 