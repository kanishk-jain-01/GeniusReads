-- Add vector extension
CREATE EXTENSION IF NOT EXISTS "vector";

-- GeniusReads Concept Extraction Schema with pgvector Support
-- Migration 002: Adds concept tables for LangGraph-based knowledge extraction
-- Requires: pgvector extension (installed in previous step)

-- ============================================================================
-- Concepts Table
-- Stores extracted concepts with vector embeddings for semantic search
-- ============================================================================
CREATE TABLE concepts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    embedding VECTOR(384), -- 384-dimensional embeddings from sentence-transformers
    confidence_score FLOAT NOT NULL DEFAULT 0.0,
    source_chat_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT concepts_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT concepts_description_not_empty CHECK (LENGTH(TRIM(description)) > 0),
    CONSTRAINT concepts_confidence_range CHECK (confidence_score BETWEEN 0.0 AND 1.0),
    CONSTRAINT concepts_source_chat_count_positive CHECK (source_chat_count >= 0)
);

-- ============================================================================
-- Concept Chat Links Table
-- Links concepts to the chat sessions where they were extracted
-- ============================================================================
CREATE TABLE concept_chat_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    chat_session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    relevance_score FLOAT NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT concept_chat_links_relevance_range CHECK (relevance_score BETWEEN 0.0 AND 1.0),
    CONSTRAINT concept_chat_links_unique UNIQUE (concept_id, chat_session_id)
);

-- ============================================================================
-- Concept Relationships Table
-- Stores relationships between related concepts
-- ============================================================================
CREATE TABLE concept_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    target_concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL DEFAULT 'related',
    similarity_score FLOAT NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT concept_relationships_similarity_range CHECK (similarity_score BETWEEN 0.0 AND 1.0),
    CONSTRAINT concept_relationships_not_self UNIQUE (source_concept_id, target_concept_id),
    CONSTRAINT concept_relationships_type_valid CHECK (relationship_type IN ('related', 'prerequisite', 'builds_on', 'similar', 'opposite'))
);

-- ============================================================================
-- LangGraph Processing Table
-- Tracks the status and progress of concept extraction workflows
-- ============================================================================
CREATE TABLE langraph_processing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    processing_stages JSONB DEFAULT '[]'::jsonb,
    extracted_concept_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    processing_time_ms INTEGER,
    
    CONSTRAINT langraph_status_valid CHECK (status IN ('pending', 'processing', 'complete', 'failed', 'cancelled')),
    CONSTRAINT langraph_concept_count_positive CHECK (extracted_concept_count >= 0),
    CONSTRAINT langraph_processing_time_positive CHECK (processing_time_ms IS NULL OR processing_time_ms >= 0)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Concepts indexes
CREATE INDEX idx_concepts_name ON concepts(name);
CREATE INDEX idx_concepts_created_at ON concepts(created_at DESC);
CREATE INDEX idx_concepts_updated_at ON concepts(updated_at DESC);
CREATE INDEX idx_concepts_confidence_score ON concepts(confidence_score DESC);
CREATE INDEX idx_concepts_source_chat_count ON concepts(source_chat_count DESC);
CREATE INDEX idx_concepts_tags ON concepts USING GIN(tags);

-- Vector similarity index (HNSW for fast approximate nearest neighbor search)
CREATE INDEX idx_concepts_embedding_hnsw ON concepts USING hnsw (embedding vector_cosine_ops);

-- Alternative IVFFlat index (can be used instead of or alongside HNSW)
-- CREATE INDEX idx_concepts_embedding_ivfflat ON concepts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Concept chat links indexes
CREATE INDEX idx_concept_chat_links_concept_id ON concept_chat_links(concept_id);
CREATE INDEX idx_concept_chat_links_chat_session_id ON concept_chat_links(chat_session_id);
CREATE INDEX idx_concept_chat_links_relevance_score ON concept_chat_links(relevance_score DESC);
CREATE INDEX idx_concept_chat_links_created_at ON concept_chat_links(created_at DESC);

-- Concept relationships indexes
CREATE INDEX idx_concept_relationships_source ON concept_relationships(source_concept_id);
CREATE INDEX idx_concept_relationships_target ON concept_relationships(target_concept_id);
CREATE INDEX idx_concept_relationships_type ON concept_relationships(relationship_type);
CREATE INDEX idx_concept_relationships_similarity ON concept_relationships(similarity_score DESC);

-- LangGraph processing indexes
CREATE INDEX idx_langraph_processing_chat_session ON langraph_processing(chat_session_id);
CREATE INDEX idx_langraph_processing_status ON langraph_processing(status);
CREATE INDEX idx_langraph_processing_started_at ON langraph_processing(started_at DESC);
CREATE INDEX idx_langraph_processing_completed_at ON langraph_processing(completed_at DESC);

-- ============================================================================
-- Triggers for Automatic Timestamps
-- ============================================================================

-- Apply updated_at trigger to concepts table
CREATE TRIGGER update_concepts_updated_at BEFORE UPDATE ON concepts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- View for concept summary with chat source information
CREATE VIEW concept_summary AS
SELECT 
    c.id,
    c.name,
    c.description,
    c.tags,
    c.confidence_score,
    c.source_chat_count,
    c.created_at,
    c.updated_at,
    COUNT(DISTINCT ccl.chat_session_id) as linked_chat_count,
    AVG(ccl.relevance_score) as avg_relevance_score,
    array_agg(DISTINCT cs.title) FILTER (WHERE cs.title IS NOT NULL) as source_chat_titles
FROM concepts c
LEFT JOIN concept_chat_links ccl ON c.id = ccl.concept_id
LEFT JOIN chat_sessions cs ON ccl.chat_session_id = cs.id
GROUP BY c.id, c.name, c.description, c.tags, c.confidence_score, c.source_chat_count, c.created_at, c.updated_at;

-- View for concept relationships with names
CREATE VIEW concept_relationships_detailed AS
SELECT 
    cr.id,
    cr.source_concept_id,
    sc.name as source_concept_name,
    cr.target_concept_id,
    tc.name as target_concept_name,
    cr.relationship_type,
    cr.similarity_score,
    cr.created_at
FROM concept_relationships cr
JOIN concepts sc ON cr.source_concept_id = sc.id
JOIN concepts tc ON cr.target_concept_id = tc.id;

-- View for LangGraph processing status with chat information
CREATE VIEW langraph_processing_status AS
SELECT 
    lp.id,
    lp.chat_session_id,
    cs.title as chat_title,
    cs.preview_text as chat_preview,
    lp.status,
    lp.processing_stages,
    lp.extracted_concept_count,
    lp.error_message,
    lp.started_at,
    lp.completed_at,
    lp.processing_time_ms,
    CASE 
        WHEN lp.completed_at IS NOT NULL AND lp.started_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (lp.completed_at - lp.started_at)) * 1000
        ELSE NULL 
    END as actual_processing_time_ms
FROM langraph_processing lp
JOIN chat_sessions cs ON lp.chat_session_id = cs.id;

-- ============================================================================
-- Functions for Vector Operations
-- ============================================================================

-- Function to find similar concepts using vector similarity
CREATE OR REPLACE FUNCTION find_similar_concepts(
    target_embedding VECTOR(384),
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

-- Function to get concept recommendations based on chat content
CREATE OR REPLACE FUNCTION get_concept_recommendations_for_chat(
    target_chat_session_id UUID,
    max_results INTEGER DEFAULT 5
)
RETURNS TABLE (
    concept_id UUID,
    concept_name VARCHAR(500),
    concept_description TEXT,
    relevance_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.description,
        ccl.relevance_score
    FROM concepts c
    JOIN concept_chat_links ccl ON c.id = ccl.concept_id
    WHERE ccl.chat_session_id = target_chat_session_id
    ORDER BY ccl.relevance_score DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Sample Data for Testing (Optional)
-- ============================================================================

-- Insert a sample concept for testing
-- INSERT INTO concepts (name, description, tags, confidence_score) 
-- VALUES (
--     'Test Concept',
--     'This is a test concept for validating the vector storage system.',
--     '["test", "sample", "validation"]'::jsonb,
--     0.95
-- );

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Update any existing chat sessions to have proper analysis status
UPDATE chat_sessions 
SET analysis_status = 'none' 
WHERE analysis_status IS NULL;

COMMENT ON TABLE concepts IS 'Stores extracted concepts with vector embeddings for semantic search';
COMMENT ON TABLE concept_chat_links IS 'Links concepts to source chat sessions with relevance scores';
COMMENT ON TABLE concept_relationships IS 'Stores relationships between related concepts';
COMMENT ON TABLE langraph_processing IS 'Tracks LangGraph concept extraction workflow status';

COMMENT ON COLUMN concepts.embedding IS '384-dimensional vector embedding from sentence-transformers';
COMMENT ON COLUMN concepts.confidence_score IS 'Confidence score for concept extraction accuracy (0.0-1.0)';
COMMENT ON COLUMN concept_chat_links.relevance_score IS 'Relevance score for concept in specific chat (0.0-1.0)';
COMMENT ON COLUMN concept_relationships.similarity_score IS 'Vector similarity score between concepts (0.0-1.0)'; 