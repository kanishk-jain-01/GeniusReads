-- GeniusReads Initial Database Schema
-- Based on TypeScript types in src/lib/types.ts
-- Supports: Documents, Text Selection, AI Processing, Knowledge Management

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Documents Table
-- Stores PDF document metadata and reading state
-- ============================================================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255),
    file_path TEXT NOT NULL UNIQUE,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    total_pages INTEGER NOT NULL,
    current_page INTEGER NOT NULL DEFAULT 1,
    zoom_level INTEGER NOT NULL DEFAULT 100,
    last_accessed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- PDF metadata (JSON for flexibility)
    metadata JSONB DEFAULT '{}',
    
    CONSTRAINT documents_current_page_positive CHECK (current_page > 0),
    CONSTRAINT documents_total_pages_positive CHECK (total_pages > 0),
    CONSTRAINT documents_zoom_level_range CHECK (zoom_level BETWEEN 25 AND 500),
    CONSTRAINT documents_file_size_positive CHECK (file_size > 0)
);

-- ============================================================================
-- Document Sessions Table
-- Tracks reading sessions and progress
-- ============================================================================
CREATE TABLE document_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    current_page INTEGER NOT NULL,
    zoom_level INTEGER NOT NULL,
    scroll_position INTEGER NOT NULL DEFAULT 0,
    reading_progress DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- Percentage 0-100
    time_spent INTEGER NOT NULL DEFAULT 0, -- Seconds
    last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT sessions_reading_progress_range CHECK (reading_progress BETWEEN 0 AND 100),
    CONSTRAINT sessions_time_spent_positive CHECK (time_spent >= 0),
    CONSTRAINT sessions_scroll_position_positive CHECK (scroll_position >= 0)
);

-- ============================================================================
-- Text Selections Table
-- Stores user text selections with coordinates
-- ============================================================================
CREATE TABLE text_selections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    selected_text TEXT NOT NULL,
    start_coordinate JSONB NOT NULL, -- {x: number, y: number}
    end_coordinate JSONB NOT NULL,   -- {x: number, y: number}
    bounding_boxes JSONB NOT NULL,   -- Array of {x, y, width, height}
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT selections_page_number_positive CHECK (page_number > 0),
    CONSTRAINT selections_text_not_empty CHECK (LENGTH(TRIM(selected_text)) > 0)
);

-- ============================================================================
-- Questions Table
-- User questions about selected text
-- ============================================================================
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    selection_id UUID NOT NULL REFERENCES text_selections(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    context TEXT NOT NULL, -- The selected text that prompted the question
    page_number INTEGER NOT NULL,
    asked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    
    CONSTRAINT questions_status_valid CHECK (status IN ('pending', 'answered', 'failed')),
    CONSTRAINT questions_page_number_positive CHECK (page_number > 0),
    CONSTRAINT questions_text_not_empty CHECK (LENGTH(TRIM(question_text)) > 0)
);

-- ============================================================================
-- AI Responses Table
-- Stores AI-generated explanations and responses
-- ============================================================================
CREATE TABLE ai_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    response_text TEXT NOT NULL,
    explanation TEXT NOT NULL,
    definitions JSONB NOT NULL DEFAULT '[]', -- Array of Definition objects
    related_concepts TEXT[] DEFAULT '{}',
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.00, -- 0-1 confidence score
    processing_time INTEGER NOT NULL DEFAULT 0, -- Milliseconds
    model VARCHAR(50) NOT NULL DEFAULT 'gpt-4',
    tone VARCHAR(30) NOT NULL DEFAULT 'explain-like-im-5',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'streaming',
    
    CONSTRAINT responses_confidence_range CHECK (confidence BETWEEN 0 AND 1),
    CONSTRAINT responses_processing_time_positive CHECK (processing_time >= 0),
    CONSTRAINT responses_status_valid CHECK (status IN ('streaming', 'complete', 'error'))
);

-- ============================================================================
-- Knowledge Entries Table
-- Accumulated knowledge from AI responses and user input
-- ============================================================================
CREATE TABLE knowledge_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    concept VARCHAR(255) NOT NULL,
    definition TEXT NOT NULL,
    explanation TEXT NOT NULL,
    context TEXT NOT NULL, -- Where this was learned
    page_number INTEGER NOT NULL,
    tags TEXT[] DEFAULT '{}',
    related_concepts TEXT[] DEFAULT '{}',
    source VARCHAR(30) NOT NULL,
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.00, -- How well understood
    review_count INTEGER NOT NULL DEFAULT 0,
    last_reviewed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT knowledge_source_valid CHECK (source IN ('ai-explanation', 'user-note', 'definition-extraction')),
    CONSTRAINT knowledge_confidence_range CHECK (confidence BETWEEN 0 AND 1),
    CONSTRAINT knowledge_review_count_positive CHECK (review_count >= 0),
    CONSTRAINT knowledge_page_number_positive CHECK (page_number > 0),
    CONSTRAINT knowledge_concept_not_empty CHECK (LENGTH(TRIM(concept)) > 0)
);

-- ============================================================================
-- User Notes Table
-- Personal notes and annotations
-- ============================================================================
CREATE TABLE user_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    selection_id UUID REFERENCES text_selections(id) ON DELETE SET NULL,
    page_number INTEGER NOT NULL,
    note_text TEXT NOT NULL,
    note_type VARCHAR(20) NOT NULL DEFAULT 'personal-insight',
    position JSONB, -- Optional {x: number, y: number}
    tags TEXT[] DEFAULT '{}',
    is_private BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT notes_type_valid CHECK (note_type IN ('personal-insight', 'summary', 'question', 'highlight')),
    CONSTRAINT notes_page_number_positive CHECK (page_number > 0),
    CONSTRAINT notes_text_not_empty CHECK (LENGTH(TRIM(note_text)) > 0)
);

-- ============================================================================
-- Search Index Table
-- Full-text search index for knowledge corpus
-- ============================================================================
CREATE TABLE search_index (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(20) NOT NULL,
    entity_id UUID NOT NULL,
    searchable_text TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_number INTEGER,
    weight DECIMAL(3,2) NOT NULL DEFAULT 1.00, -- Search relevance weight
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT search_entity_type_valid CHECK (entity_type IN ('knowledge-entry', 'user-note', 'ai-response', 'document')),
    CONSTRAINT search_weight_positive CHECK (weight > 0),
    CONSTRAINT search_text_not_empty CHECK (LENGTH(TRIM(searchable_text)) > 0)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Documents
CREATE INDEX idx_documents_file_path ON documents(file_path);
CREATE INDEX idx_documents_last_accessed ON documents(last_accessed DESC);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);

-- Document Sessions
CREATE INDEX idx_sessions_document_id ON document_sessions(document_id);
CREATE INDEX idx_sessions_last_activity ON document_sessions(last_activity DESC);

-- Text Selections
CREATE INDEX idx_selections_document_id ON text_selections(document_id);
CREATE INDEX idx_selections_page_number ON text_selections(page_number);
CREATE INDEX idx_selections_created_at ON text_selections(created_at DESC);

-- Questions
CREATE INDEX idx_questions_document_id ON questions(document_id);
CREATE INDEX idx_questions_selection_id ON questions(selection_id);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_questions_asked_at ON questions(asked_at DESC);

-- AI Responses
CREATE INDEX idx_responses_question_id ON ai_responses(question_id);
CREATE INDEX idx_responses_status ON ai_responses(status);
CREATE INDEX idx_responses_created_at ON ai_responses(created_at DESC);

-- Knowledge Entries
CREATE INDEX idx_knowledge_document_id ON knowledge_entries(document_id);
CREATE INDEX idx_knowledge_concept ON knowledge_entries(concept);
CREATE INDEX idx_knowledge_source ON knowledge_entries(source);
CREATE INDEX idx_knowledge_page_number ON knowledge_entries(page_number);
CREATE INDEX idx_knowledge_created_at ON knowledge_entries(created_at DESC);
CREATE INDEX idx_knowledge_tags ON knowledge_entries USING GIN(tags);

-- User Notes
CREATE INDEX idx_notes_document_id ON user_notes(document_id);
CREATE INDEX idx_notes_selection_id ON user_notes(selection_id);
CREATE INDEX idx_notes_page_number ON user_notes(page_number);
CREATE INDEX idx_notes_type ON user_notes(note_type);
CREATE INDEX idx_notes_created_at ON user_notes(created_at DESC);
CREATE INDEX idx_notes_tags ON user_notes USING GIN(tags);

-- Search Index
CREATE INDEX idx_search_entity_type ON search_index(entity_type);
CREATE INDEX idx_search_entity_id ON search_index(entity_id);
CREATE INDEX idx_search_document_id ON search_index(document_id);
CREATE INDEX idx_search_keywords ON search_index USING GIN(keywords);
CREATE INDEX idx_search_text ON search_index USING GIN(to_tsvector('english', searchable_text));

-- ============================================================================
-- Triggers for Automatic Timestamps
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at columns
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_updated_at BEFORE UPDATE ON knowledge_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON user_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_search_updated_at BEFORE UPDATE ON search_index
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Sample Data for Testing (Optional)
-- ============================================================================

-- Insert a sample document for testing
INSERT INTO documents (
    title, 
    author, 
    file_path, 
    file_name, 
    file_size, 
    total_pages,
    metadata
) VALUES (
    'Introduction to Machine Learning',
    'Sample Author',
    '/sample/path/ml-intro.pdf',
    'ml-intro.pdf',
    2048576, -- 2MB
    245,
    '{"subject": "Machine Learning", "keywords": ["AI", "ML", "algorithms"], "producer": "Sample Publisher"}'::jsonb
);

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- View for document reading progress
CREATE VIEW document_progress AS
SELECT 
    d.id,
    d.title,
    d.current_page,
    d.total_pages,
    ROUND((d.current_page::decimal / d.total_pages::decimal) * 100, 2) as progress_percentage,
    d.last_accessed,
    COUNT(DISTINCT q.id) as questions_asked,
    COUNT(DISTINCT k.id) as concepts_learned,
    COUNT(DISTINCT n.id) as notes_taken
FROM documents d
LEFT JOIN questions q ON d.id = q.document_id
LEFT JOIN knowledge_entries k ON d.id = k.document_id
LEFT JOIN user_notes n ON d.id = n.document_id
GROUP BY d.id, d.title, d.current_page, d.total_pages, d.last_accessed;

-- View for knowledge corpus summary
CREATE VIEW knowledge_summary AS
SELECT 
    d.id as document_id,
    d.title as document_title,
    COUNT(DISTINCT k.id) as total_concepts,
    COUNT(DISTINCT k.concept) as unique_concepts,
    AVG(k.confidence) as avg_confidence,
    MAX(k.created_at) as last_learned,
    array_agg(DISTINCT unnest(k.tags)) FILTER (WHERE array_length(k.tags, 1) > 0) as all_tags
FROM documents d
LEFT JOIN knowledge_entries k ON d.id = k.document_id
GROUP BY d.id, d.title; 