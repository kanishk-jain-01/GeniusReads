// Database operations for GeniusReads
// Handles PostgreSQL connections and queries using sqlx

use anyhow::{Context, Result};
use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::{PgPool, Row};
use std::str::FromStr;
use uuid::Uuid;
use pgvector::Vector;

// ============================================================================
// Database Connection Management
// ============================================================================

pub struct Database {
    pool: PgPool,
}

impl Database {
    /// Create a new database connection pool
    pub async fn new(database_url: &str) -> Result<Self> {
        let pool = PgPool::connect(database_url)
            .await
            .context("Failed to connect to PostgreSQL database")?;

        Ok(Database { pool })
    }

    /// Create database connection with default local settings
    pub async fn new_local() -> Result<Self> {
        let database_url = "postgresql://localhost/genius_reads";
        Self::new(database_url).await
    }

    /// Test database connection
    pub async fn test_connection(&self) -> Result<bool> {
        let row = sqlx::query("SELECT 1 as test")
            .fetch_one(&self.pool)
            .await
            .context("Failed to execute test query")?;

        let test_value: i32 = row.get("test");
        Ok(test_value == 1)
    }

    /// Get database statistics
    pub async fn get_stats(&self) -> Result<DatabaseStats> {
        let row = sqlx::query(
            r#"
            SELECT 
                (SELECT COUNT(*) FROM documents) as document_count,
                (SELECT COUNT(*) FROM questions) as question_count,
                (SELECT COUNT(*) FROM ai_responses) as response_count,
                (SELECT COUNT(*) FROM knowledge_entries) as knowledge_count,
                (SELECT COUNT(*) FROM user_notes) as note_count
        "#,
        )
        .fetch_one(&self.pool)
        .await
        .context("Failed to get database statistics")?;

        Ok(DatabaseStats {
            document_count: row.get::<i64, _>("document_count") as u32,
            question_count: row.get::<i64, _>("question_count") as u32,
            response_count: row.get::<i64, _>("response_count") as u32,
            knowledge_count: row.get::<i64, _>("knowledge_count") as u32,
            note_count: row.get::<i64, _>("note_count") as u32,
        })
    }
}

// ============================================================================
// Data Structures
// ============================================================================

#[derive(Debug, serde::Serialize)]
pub struct DatabaseStats {
    pub document_count: u32,
    pub question_count: u32,
    pub response_count: u32,
    pub knowledge_count: u32,
    pub note_count: u32,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct Document {
    pub id: Uuid,
    pub title: String,
    pub author: Option<String>,
    pub file_path: String,
    pub file_name: String,
    pub file_size: i64,
    pub total_pages: i32,
    pub current_page: i32,
    pub zoom_level: i32,
    pub last_accessed: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub metadata: Value,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct TextSelection {
    pub id: Uuid,
    pub document_id: Uuid,
    pub page_number: i32,
    pub selected_text: String,
    pub start_coordinate: Value,
    pub end_coordinate: Value,
    pub bounding_boxes: Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct Question {
    pub id: Uuid,
    pub document_id: Uuid,
    pub selection_id: Uuid,
    pub question_text: String,
    pub context: String,
    pub page_number: i32,
    pub asked_at: DateTime<Utc>,
    pub status: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct KnowledgeEntry {
    pub id: Uuid,
    pub document_id: Uuid,
    pub concept: String,
    pub definition: String,
    pub explanation: String,
    pub context: String,
    pub page_number: i32,
    pub tags: Option<Vec<String>>,
    pub related_concepts: Option<Vec<String>>,
    pub source: String,
    pub confidence: Option<BigDecimal>,
    pub review_count: i32,
    pub last_reviewed: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ChatSession {
    pub id: Uuid,
    pub title: String,
    pub preview_text: Option<String>,
    pub source_document_count: i32,
    pub analysis_status: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ChatMessage {
    pub id: Uuid,
    pub chat_session_id: Uuid,
    pub content: String,
    pub sender_type: String,
    pub created_at: DateTime<Utc>,
    pub metadata: Value,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct HighlightedContext {
    pub id: Uuid,
    pub chat_session_id: Uuid,
    pub document_id: Uuid,
    pub document_title: String,
    pub page_number: i32,
    pub selected_text: String,
    pub text_coordinates: Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct UserSessionState {
    pub id: Uuid,
    pub current_document_id: Option<Uuid>,
    pub current_page: i32,
    pub zoom_level: i32,
    pub scroll_position: i32,
    pub active_tab: String,
    pub active_chat_id: Option<Uuid>,
    pub last_reading_position: Option<Value>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ChatSessionForAnalysis {
    pub id: Uuid,
    pub title: String,
    pub messages: Vec<ChatMessage>,
    pub highlighted_contexts: Vec<HighlightedContext>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ExtractedConcept {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub tags: Vec<String>,
    pub confidence_score: f64,
    pub source_chat_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Document Operations
// ============================================================================

impl Database {
    /// Get all documents
    pub async fn get_documents(&self) -> Result<Vec<Document>> {
        let documents = sqlx::query_as!(
            Document,
            "SELECT * FROM documents ORDER BY last_accessed DESC"
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to fetch documents")?;

        Ok(documents)
    }

    /// Get document by ID
    pub async fn get_document(&self, id: Uuid) -> Result<Option<Document>> {
        let document = sqlx::query_as!(Document, "SELECT * FROM documents WHERE id = $1", id)
            .fetch_optional(&self.pool)
            .await
            .context("Failed to fetch document")?;

        Ok(document)
    }

    /// Get document by file path
    pub async fn get_document_by_path(&self, file_path: &str) -> Result<Option<Document>> {
        let document = sqlx::query_as!(Document, "SELECT * FROM documents WHERE file_path = $1", file_path)
            .fetch_optional(&self.pool)
            .await
            .context("Failed to fetch document by path")?;

        Ok(document)
    }

    /// Create a new document record
    pub async fn create_document(
        &self,
        title: &str,
        author: Option<&str>,
        file_path: &str,
        file_name: &str,
        file_size: i64,
        total_pages: i32,
        metadata: Value,
    ) -> Result<Uuid> {
        let id = Uuid::new_v4();

        sqlx::query!(
            r#"
            INSERT INTO documents (id, title, author, file_path, file_name, file_size, total_pages, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
            id,
            title,
            author,
            file_path,
            file_name,
            file_size,
            total_pages,
            metadata
        )
        .execute(&self.pool)
        .await
        .context("Failed to create document")?;

        Ok(id)
    }

    /// Update document reading position
    pub async fn update_document_position(
        &self,
        id: Uuid,
        current_page: i32,
        zoom_level: i32,
    ) -> Result<()> {
        sqlx::query!(
            r#"
            UPDATE documents 
            SET current_page = $2, zoom_level = $3, last_accessed = NOW()
            WHERE id = $1
            "#,
            id,
            current_page,
            zoom_level
        )
        .execute(&self.pool)
        .await
        .context("Failed to update document position")?;

        Ok(())
    }

    /// Update document total pages (when PDF.js loads and determines actual page count)
    pub async fn update_document_total_pages(
        &self,
        id: Uuid,
        total_pages: i32,
    ) -> Result<()> {
        sqlx::query!(
            r#"
            UPDATE documents 
            SET total_pages = $2, updated_at = NOW()
            WHERE id = $1
            "#,
            id,
            total_pages
        )
        .execute(&self.pool)
        .await
        .context("Failed to update document total pages")?;

        Ok(())
    }
}

// ============================================================================
// Knowledge Operations
// ============================================================================

impl Database {
    /// Get knowledge entries for a document
    pub async fn get_knowledge_entries(&self, document_id: Uuid) -> Result<Vec<KnowledgeEntry>> {
        let entries = sqlx::query_as!(
            KnowledgeEntry,
            "SELECT * FROM knowledge_entries WHERE document_id = $1 ORDER BY created_at DESC",
            document_id
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to fetch knowledge entries")?;

        Ok(entries)
    }

    /// Search knowledge entries
    pub async fn search_knowledge(&self, query: &str, limit: i32) -> Result<Vec<KnowledgeEntry>> {
        let entries = sqlx::query_as!(
            KnowledgeEntry,
            r#"
            SELECT k.* FROM knowledge_entries k
            JOIN search_index s ON k.id = s.entity_id
            WHERE s.entity_type = 'knowledge-entry'
            AND to_tsvector('english', s.searchable_text) @@ plainto_tsquery('english', $1)
            ORDER BY ts_rank(to_tsvector('english', s.searchable_text), plainto_tsquery('english', $1)) DESC
            LIMIT $2
            "#,
            query,
            limit as i64
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to search knowledge entries")?;

        Ok(entries)
    }

    /// Create a knowledge entry
    pub async fn create_knowledge_entry(
        &self,
        document_id: Uuid,
        concept: &str,
        definition: &str,
        explanation: &str,
        context: &str,
        page_number: i32,
        tags: Vec<String>,
        source: &str,
        confidence: f64,
    ) -> Result<Uuid> {
        let id = Uuid::new_v4();
        let confidence_decimal = BigDecimal::from_str(&confidence.to_string()).unwrap();

        sqlx::query!(
            r#"
            INSERT INTO knowledge_entries (
                id, document_id, concept, definition, explanation, context, 
                page_number, tags, source, confidence
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            "#,
            id,
            document_id,
            concept,
            definition,
            explanation,
            context,
            page_number,
            &tags,
            source,
            confidence_decimal
        )
        .execute(&self.pool)
        .await
        .context("Failed to create knowledge entry")?;

        // Create search index entry
        self.create_search_index_entry(
            "knowledge-entry",
            id,
            &format!("{} {} {}", concept, definition, explanation),
            document_id,
            Some(page_number),
            BigDecimal::from_str("1.0").unwrap(),
        )
        .await?;

        Ok(id)
    }
}

// ============================================================================
// Search Index Operations
// ============================================================================

impl Database {
    /// Create a search index entry
    pub async fn create_search_index_entry(
        &self,
        entity_type: &str,
        entity_id: Uuid,
        searchable_text: &str,
        document_id: Uuid,
        page_number: Option<i32>,
        weight: BigDecimal,
    ) -> Result<Uuid> {
        let id = Uuid::new_v4();

        sqlx::query!(
            r#"
            INSERT INTO search_index (id, entity_type, entity_id, searchable_text, document_id, page_number, weight)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#,
            id,
            entity_type,
            entity_id,
            searchable_text,
            document_id,
            page_number,
            weight
        )
        .execute(&self.pool)
        .await
        .context("Failed to create search index entry")?;

        Ok(id)
    }
}

// ============================================================================
// Chat Session Operations
// ============================================================================

impl Database {
    /// Create a new chat session
    pub async fn create_chat_session(&self, title: &str) -> Result<Uuid> {
        let id = Uuid::new_v4();

        sqlx::query!(
            r#"
            INSERT INTO chat_sessions (id, title)
            VALUES ($1, $2)
            "#,
            id,
            title
        )
        .execute(&self.pool)
        .await
        .context("Failed to create chat session")?;

        Ok(id)
    }

    /// Get all chat sessions
    pub async fn get_chat_sessions(&self) -> Result<Vec<ChatSession>> {
        let sessions = sqlx::query_as!(
            ChatSession,
            "SELECT * FROM chat_sessions WHERE is_active = false ORDER BY updated_at DESC"
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to fetch chat sessions")?;

        Ok(sessions)
    }

    /// Get active chat session
    pub async fn get_active_chat_session(&self) -> Result<Option<Value>> {
        let result = sqlx::query!(
            "SELECT * FROM active_chat_session LIMIT 1"
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch active chat session")?;

        if let Some(row) = result {
            Ok(Some(serde_json::json!({
                "id": row.id,
                "title": row.title,
                "highlighted_contexts": row.highlighted_contexts,
                "messages": row.messages,
                "created_at": row.created_at,
                "updated_at": row.updated_at
            })))
        } else {
            Ok(None)
        }
    }

    /// Get specific chat session by ID with full details
    pub async fn get_chat_session_by_id(&self, chat_session_id: Uuid) -> Result<Option<Value>> {
        let result = sqlx::query!(
            r#"
            SELECT 
                cs.id,
                cs.title,
                cs.preview_text,
                cs.source_document_count,
                cs.analysis_status,
                cs.is_active,
                cs.created_at,
                cs.updated_at,
                COALESCE(hc_data.highlighted_contexts, '[]'::json) as highlighted_contexts,
                COALESCE(cm_data.messages, '[]'::json) as messages
            FROM chat_sessions cs
            LEFT JOIN (
                SELECT 
                    chat_session_id,
                    json_agg(
                        json_build_object(
                            'id', id,
                            'documentId', document_id,
                            'documentTitle', document_title,
                            'pageNumber', page_number,
                            'selectedText', selected_text,
                            'textCoordinates', text_coordinates,
                            'createdAt', created_at
                        ) ORDER BY created_at
                    ) as highlighted_contexts
                FROM highlighted_contexts
                WHERE chat_session_id = $1
                GROUP BY chat_session_id
            ) hc_data ON cs.id = hc_data.chat_session_id
            LEFT JOIN (
                SELECT 
                    chat_session_id,
                    json_agg(
                        json_build_object(
                            'id', id,
                            'content', content,
                            'senderType', sender_type,
                            'createdAt', created_at,
                            'metadata', metadata
                        ) ORDER BY created_at
                    ) as messages
                FROM chat_messages
                WHERE chat_session_id = $1
                GROUP BY chat_session_id
            ) cm_data ON cs.id = cm_data.chat_session_id
            WHERE cs.id = $1
            "#,
            chat_session_id
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch chat session by ID")?;

        if let Some(row) = result {
            Ok(Some(serde_json::json!({
                "id": row.id,
                "title": row.title,
                "highlighted_contexts": row.highlighted_contexts,
                "messages": row.messages,
                "is_active": row.is_active,
                "created_at": row.created_at,
                "updated_at": row.updated_at
            })))
        } else {
            Ok(None)
        }
    }

    /// Set active chat session
    pub async fn set_active_chat_session(&self, chat_session_id: Uuid) -> Result<()> {
        // First, deactivate all chat sessions
        sqlx::query!("UPDATE chat_sessions SET is_active = false")
            .execute(&self.pool)
            .await
            .context("Failed to deactivate chat sessions")?;

        // Then activate the specified session
        sqlx::query!(
            "UPDATE chat_sessions SET is_active = true WHERE id = $1",
            chat_session_id
        )
        .execute(&self.pool)
        .await
        .context("Failed to set active chat session")?;

        Ok(())
    }

    /// Add a message to a chat session
    pub async fn add_chat_message(
        &self,
        chat_session_id: Uuid,
        content: &str,
        sender_type: &str,
        metadata: Value,
    ) -> Result<Uuid> {
        let id = Uuid::new_v4();

        sqlx::query!(
            r#"
            INSERT INTO chat_messages (id, chat_session_id, content, sender_type, metadata)
            VALUES ($1, $2, $3, $4, $5)
            "#,
            id,
            chat_session_id,
            content,
            sender_type,
            metadata
        )
        .execute(&self.pool)
        .await
        .context("Failed to add chat message")?;

        // Update chat session's updated_at timestamp
        sqlx::query!(
            "UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1",
            chat_session_id
        )
        .execute(&self.pool)
        .await
        .context("Failed to update chat session timestamp")?;

        Ok(id)
    }

    /// Add highlighted context to a chat session
    pub async fn add_highlighted_context(
        &self,
        chat_session_id: Uuid,
        document_id: Uuid,
        document_title: &str,
        page_number: i32,
        selected_text: &str,
        text_coordinates: Value,
    ) -> Result<Uuid> {
        let id = Uuid::new_v4();

        sqlx::query!(
            r#"
            INSERT INTO highlighted_contexts (
                id, chat_session_id, document_id, document_title, 
                page_number, selected_text, text_coordinates
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#,
            id,
            chat_session_id,
            document_id,
            document_title,
            page_number,
            selected_text,
            text_coordinates
        )
        .execute(&self.pool)
        .await
        .context("Failed to add highlighted context")?;

        // Update source document count
        sqlx::query!(
            r#"
            UPDATE chat_sessions 
            SET source_document_count = (
                SELECT COUNT(DISTINCT document_id) 
                FROM highlighted_contexts 
                WHERE chat_session_id = $1
            )
            WHERE id = $1
            "#,
            chat_session_id
        )
        .execute(&self.pool)
        .await
        .context("Failed to update source document count")?;

        Ok(id)
    }

    /// Delete a chat session
    pub async fn delete_chat_session(&self, chat_session_id: Uuid) -> Result<()> {
        sqlx::query!("DELETE FROM chat_sessions WHERE id = $1", chat_session_id)
            .execute(&self.pool)
            .await
            .context("Failed to delete chat session")?;

        Ok(())
    }

    /// Clear chat session (delete all messages and contexts, keep session active)
    pub async fn clear_chat_session(&self, chat_session_id: Uuid) -> Result<()> {
        // Delete all messages for this chat session
        sqlx::query!("DELETE FROM chat_messages WHERE chat_session_id = $1", chat_session_id)
            .execute(&self.pool)
            .await
            .context("Failed to delete chat messages")?;

        // Delete all highlighted contexts for this chat session
        sqlx::query!("DELETE FROM highlighted_contexts WHERE chat_session_id = $1", chat_session_id)
            .execute(&self.pool)
            .await
            .context("Failed to delete highlighted contexts")?;

        // Reset source document count and update timestamp
        sqlx::query!(
            r#"
            UPDATE chat_sessions 
            SET source_document_count = 0, updated_at = NOW()
            WHERE id = $1
            "#,
            chat_session_id
        )
        .execute(&self.pool)
        .await
        .context("Failed to reset chat session")?;

        Ok(())
    }

    /// End chat session (mark as inactive and set completed_at)
    pub async fn end_chat_session(&self, chat_session_id: Uuid) -> Result<()> {
        sqlx::query!(
            r#"
            UPDATE chat_sessions 
            SET is_active = false, completed_at = NOW(), updated_at = NOW()
            WHERE id = $1
            "#,
            chat_session_id
        )
        .execute(&self.pool)
        .await
        .context("Failed to end chat session")?;

        Ok(())
    }

    /// Update chat session title
    pub async fn update_chat_session_title(&self, chat_session_id: Uuid, title: &str) -> Result<()> {
        sqlx::query!(
            "UPDATE chat_sessions SET title = $2, updated_at = NOW() WHERE id = $1",
            chat_session_id,
            title
        )
        .execute(&self.pool)
        .await
        .context("Failed to update chat session title")?;

        Ok(())
    }

    /// Update chat session analysis status
    pub async fn update_chat_analysis_status(
        &self,
        chat_session_id: Uuid,
        status: &str,
    ) -> Result<()> {
        sqlx::query!(
            r#"
            UPDATE chat_sessions 
            SET analysis_status = $1, updated_at = NOW()
            WHERE id = $2
            "#,
            status,
            chat_session_id
        )
        .execute(&self.pool)
        .await
        .context("Failed to update chat analysis status")?;

        Ok(())
    }

    /// Get chat session data for analysis (messages and contexts)
    pub async fn get_chat_session_for_analysis(
        &self,
        chat_session_id: Uuid,
    ) -> Result<Option<ChatSessionForAnalysis>> {
        // Get the chat session
        let session = sqlx::query!(
            r#"
            SELECT id, title
            FROM chat_sessions
            WHERE id = $1
            "#,
            chat_session_id
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to get chat session")?;

        if let Some(session_row) = session {
            // Get messages
            let message_rows = sqlx::query!(
                r#"
                SELECT id, content, sender_type, created_at, metadata
                FROM chat_messages
                WHERE chat_session_id = $1
                ORDER BY created_at ASC
                "#,
                chat_session_id
            )
            .fetch_all(&self.pool)
            .await
            .context("Failed to get chat messages")?;

                            let messages: Vec<ChatMessage> = message_rows
                .into_iter()
                .map(|row| ChatMessage {
                    id: row.id,
                    chat_session_id,
                    content: row.content,
                    sender_type: row.sender_type,
                    created_at: row.created_at,
                    metadata: row.metadata.unwrap_or_else(|| serde_json::json!({})),
                })
                .collect();

            // Get highlighted contexts
            let context_rows = sqlx::query!(
                r#"
                SELECT id, document_id, document_title, page_number, selected_text, text_coordinates, created_at
                FROM highlighted_contexts
                WHERE chat_session_id = $1
                ORDER BY created_at ASC
                "#,
                chat_session_id
            )
            .fetch_all(&self.pool)
            .await
            .context("Failed to get highlighted contexts")?;

            let highlighted_contexts: Vec<HighlightedContext> = context_rows
                .into_iter()
                .map(|row| HighlightedContext {
                    id: row.id,
                    chat_session_id,
                    document_id: row.document_id,
                    document_title: row.document_title,
                    page_number: row.page_number,
                    selected_text: row.selected_text,
                    text_coordinates: row.text_coordinates,
                    created_at: row.created_at,
                })
                .collect();

            Ok(Some(ChatSessionForAnalysis {
                id: session_row.id,
                title: session_row.title,
                messages,
                highlighted_contexts,
            }))
        } else {
            Ok(None)
        }
    }

    /// Store an extracted concept in the database with vector embeddings
    pub async fn store_extracted_concept(
        &self,
        chat_session_id: Uuid,
        name: &str,
        description: &str,
        tags: &[String],
        confidence_score: f64,
        related_concepts: &[String],
    ) -> Result<Uuid> {
        let concept_id = Uuid::new_v4();

        // Generate vector embedding for the concept
        let embedding_vector = self.generate_concept_embedding(name, description).await?;
        let f32_embedding: Vec<f32> = embedding_vector.iter().map(|&x| x as f32).collect();
        let pgvector_embedding = Vector::from(f32_embedding);

        // Insert into concepts table with embedding
        sqlx::query!(
            r#"
            INSERT INTO concepts (id, name, description, tags, embedding, confidence_score, source_chat_count, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, 1, NOW(), NOW())
            "#,
            concept_id,
            name,
            description,
            serde_json::to_value(tags).unwrap(),
            pgvector_embedding as _,
            confidence_score
        )
        .execute(&self.pool)
        .await
        .context("Failed to insert concept with embedding")?;

        // Link concept to chat session
        sqlx::query!(
            r#"
            INSERT INTO concept_chat_links (id, concept_id, chat_session_id, relevance_score, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            "#,
            Uuid::new_v4(),
            concept_id,
            chat_session_id,
            confidence_score
        )
        .execute(&self.pool)
        .await
        .context("Failed to link concept to chat session")?;

        // Store related concepts with similarity calculation
        for related_concept_name in related_concepts {
            if !related_concept_name.trim().is_empty() {
                // Check if related concept already exists
                if let Some(existing_concept_id) = self.find_concept_by_name(related_concept_name).await? {
                    // Calculate similarity between concepts
                    let similarity_score = self.calculate_concept_similarity(concept_id, existing_concept_id).await.unwrap_or(0.5);
                    
                    // Create bidirectional relationship
                    sqlx::query!(
                        r#"
                        INSERT INTO concept_relationships (id, source_concept_id, target_concept_id, relationship_type, similarity_score, created_at)
                        VALUES ($1, $2, $3, 'related', $4, NOW())
                        ON CONFLICT (source_concept_id, target_concept_id) DO NOTHING
                        "#,
                        Uuid::new_v4(),
                        concept_id,
                        existing_concept_id,
                        similarity_score
                    )
                    .execute(&self.pool)
                    .await
                    .ok(); // Ignore errors for now

                    // Reverse relationship
                    sqlx::query!(
                        r#"
                        INSERT INTO concept_relationships (id, source_concept_id, target_concept_id, relationship_type, similarity_score, created_at)
                        VALUES ($1, $2, $3, 'related', $4, NOW())
                        ON CONFLICT (source_concept_id, target_concept_id) DO NOTHING
                        "#,
                        Uuid::new_v4(),
                        existing_concept_id,
                        concept_id,
                        similarity_score
                    )
                    .execute(&self.pool)
                    .await
                    .ok(); // Ignore errors for now
                }
            }
        }

        Ok(concept_id)
    }

    /// Generate vector embedding for a concept using LangGraph bridge
    async fn generate_concept_embedding(&self, name: &str, description: &str) -> Result<Vec<f64>> {
        use crate::langraph_bridge::LangGraphBridge;
        
        // Combine name and description for embedding generation
        let concept_text = format!("{}: {}", name, description);
        
        // Initialize LangGraph bridge
        let bridge = LangGraphBridge::new();
        
        // Generate embedding
        let embeddings = bridge.generate_embeddings(vec![concept_text])
            .context("Failed to generate concept embedding")?;
        
        if embeddings.is_empty() {
            return Err(anyhow::anyhow!("No embedding generated for concept"));
        }
        
        Ok(embeddings[0].clone())
    }

    /// Find a concept by name (case-insensitive)
    async fn find_concept_by_name(&self, name: &str) -> Result<Option<Uuid>> {
        let result = sqlx::query!(
            r#"
            SELECT id FROM concepts 
            WHERE LOWER(name) = LOWER($1)
            LIMIT 1
            "#,
            name
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to find concept by name")?;
        
        Ok(result.map(|row| row.id))
    }

    /// Calculate similarity between two concepts using their vector embeddings
    async fn calculate_concept_similarity(&self, concept1_id: Uuid, concept2_id: Uuid) -> Result<f64> {
        // Get embeddings for both concepts
        let embeddings = sqlx::query!(
            r#"
            SELECT id, embedding as "embedding: Vector" FROM concepts 
            WHERE id = $1 OR id = $2
            "#,
            concept1_id,
            concept2_id
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to fetch concept embeddings")?;
        
        if embeddings.len() != 2 {
            return Err(anyhow::anyhow!("Could not find embeddings for both concepts"));
        }
        
        let mut embedding1: Option<Vec<f64>> = None;
        let mut embedding2: Option<Vec<f64>> = None;
        
        for row in embeddings {
            if let Some(pgvector) = row.embedding {
                let f32_vec: Vec<f32> = pgvector.into();
                let embedding: Vec<f64> = f32_vec.iter().map(|&x| x as f64).collect();
                if row.id == concept1_id {
                    embedding1 = Some(embedding);
                } else if row.id == concept2_id {
                    embedding2 = Some(embedding);
                }
            }
        }
        
        match (embedding1, embedding2) {
            (Some(emb1), Some(emb2)) => {
                use crate::langraph_bridge::LangGraphBridge;
                let bridge = LangGraphBridge::new();
                bridge.calculate_similarity(emb1, emb2)
                    .context("Failed to calculate similarity")
            }
            _ => Err(anyhow::anyhow!("Missing embeddings for similarity calculation"))
        }
    }

    /// Find similar concepts using vector similarity search
    pub async fn find_similar_concepts(&self, concept_id: Uuid, similarity_threshold: f64, max_results: i32) -> Result<Vec<serde_json::Value>> {
        let similar_concepts = sqlx::query!(
            r#"
            SELECT 
                c2.id,
                c2.name,
                c2.description,
                c2.confidence_score,
                1 - (c1.embedding <=> c2.embedding) as similarity_score
            FROM concepts c1
            CROSS JOIN concepts c2
            WHERE c1.id = $1 
              AND c2.id != $1
              AND c1.embedding IS NOT NULL 
              AND c2.embedding IS NOT NULL
              AND 1 - (c1.embedding <=> c2.embedding) >= $2
            ORDER BY c1.embedding <=> c2.embedding
            LIMIT $3
            "#,
            concept_id,
            similarity_threshold,
            max_results as i64
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to find similar concepts")?;
        
        let results: Vec<serde_json::Value> = similar_concepts
            .into_iter()
            .map(|row| serde_json::json!({
                "id": row.id,
                "name": row.name,
                "description": row.description,
                "confidenceScore": row.confidence_score,
                "similarityScore": row.similarity_score.unwrap_or(0.0)
            }))
            .collect();
        
        Ok(results)
    }

        /// Search concepts by text similarity using vector embeddings
    pub async fn search_concepts_by_text(&self, query_text: &str, similarity_threshold: f64, max_results: i32) -> Result<Vec<serde_json::Value>> {
        // Generate embedding for the query text
        let query_embedding = self.generate_concept_embedding("search", query_text).await?;
        let f32_query: Vec<f32> = query_embedding.iter().map(|&x| x as f32).collect();
        let pgvector_query = Vector::from(f32_query);

        // Use the database function for vector similarity search
        let similar_concepts = sqlx::query!(
            r#"
            SELECT concept_id, concept_name, concept_description, similarity_score
            FROM find_similar_concepts($1, $2, $3)
            "#,
            pgvector_query as _,
            similarity_threshold,
            max_results as i64
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to search concepts by text similarity")?;
        
        let results: Vec<serde_json::Value> = similar_concepts
            .into_iter()
            .map(|row| serde_json::json!({
                "id": row.concept_id,
                "name": row.concept_name,
                "description": row.concept_description,
                "similarityScore": row.similarity_score.unwrap_or(0.0)
            }))
            .collect();
        
        Ok(results)
    }

    /// Get all extracted concepts
    pub async fn get_all_concepts(&self) -> Result<Vec<ExtractedConcept>> {
        let rows = sqlx::query!(
            r#"
            SELECT id, name, description, tags, confidence_score, source_chat_count, created_at, updated_at
            FROM concepts
            ORDER BY updated_at DESC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to get concepts")?;

                    let concepts: Vec<ExtractedConcept> = rows
            .into_iter()
            .map(|row| ExtractedConcept {
                id: row.id,
                name: row.name,
                description: row.description,
                tags: row.tags
                    .and_then(|t| serde_json::from_value(t).ok())
                    .unwrap_or_default(),
                confidence_score: row.confidence_score,
                source_chat_count: row.source_chat_count,
                created_at: row.created_at,
                updated_at: row.updated_at,
            })
            .collect();

        Ok(concepts)
    }

    /// Get a specific concept by ID with its relationships and detailed source information
    pub async fn get_concept_by_id(&self, concept_id: Uuid) -> Result<Option<serde_json::Value>> {
        let concept_row = sqlx::query!(
            r#"
            SELECT id, name, description, tags, confidence_score, source_chat_count, created_at, updated_at
            FROM concepts
            WHERE id = $1
            "#,
            concept_id
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to get concept by ID")?;

        if let Some(concept) = concept_row {
            // Get related chat sessions with detailed information
            let chat_links = sqlx::query!(
                r#"
                SELECT 
                    cs.id, 
                    cs.title, 
                    cs.preview_text,
                    cs.created_at,
                    cs.updated_at,
                    ccl.relevance_score,
                    COUNT(DISTINCT cm.id) as message_count,
                    COUNT(DISTINCT hc.id) as context_count
                FROM concept_chat_links ccl
                JOIN chat_sessions cs ON ccl.chat_session_id = cs.id
                LEFT JOIN chat_messages cm ON cs.id = cm.chat_session_id
                LEFT JOIN highlighted_contexts hc ON cs.id = hc.chat_session_id
                WHERE ccl.concept_id = $1
                GROUP BY cs.id, cs.title, cs.preview_text, cs.created_at, cs.updated_at, ccl.relevance_score
                ORDER BY ccl.relevance_score DESC
                "#,
                concept_id
            )
            .fetch_all(&self.pool)
            .await
            .context("Failed to get concept chat links")?;

            let mut source_chats: Vec<serde_json::Value> = Vec::new();

            for chat_link in chat_links {
                // Get specific messages from this chat that might be relevant
                let sample_messages = sqlx::query!(
                    r#"
                    SELECT id, content, sender_type, created_at
                    FROM chat_messages
                    WHERE chat_session_id = $1
                    ORDER BY created_at ASC
                    LIMIT 3
                    "#,
                    chat_link.id
                )
                .fetch_all(&self.pool)
                .await
                .context("Failed to get sample messages")?;

                let messages: Vec<serde_json::Value> = sample_messages
                    .into_iter()
                    .map(|msg| serde_json::json!({
                        "id": msg.id,
                        "content": msg.content,
                        "senderType": msg.sender_type,
                        "createdAt": msg.created_at.to_rfc3339()
                    }))
                    .collect();

                // Get highlighted contexts from this chat
                let highlighted_contexts = sqlx::query!(
                    r#"
                    SELECT id, document_title, page_number, selected_text, created_at
                    FROM highlighted_contexts
                    WHERE chat_session_id = $1
                    ORDER BY created_at ASC
                    "#,
                    chat_link.id
                )
                .fetch_all(&self.pool)
                .await
                .context("Failed to get highlighted contexts")?;

                let contexts: Vec<serde_json::Value> = highlighted_contexts
                    .into_iter()
                    .map(|ctx| serde_json::json!({
                        "id": ctx.id,
                        "documentTitle": ctx.document_title,
                        "pageNumber": ctx.page_number,
                        "selectedText": ctx.selected_text,
                        "createdAt": ctx.created_at.to_rfc3339()
                    }))
                    .collect();

                source_chats.push(serde_json::json!({
                    "id": chat_link.id,
                    "title": chat_link.title,
                    "previewText": chat_link.preview_text,
                    "relevanceScore": chat_link.relevance_score,
                    "messageCount": chat_link.message_count.unwrap_or(0),
                    "contextCount": chat_link.context_count.unwrap_or(0),
                    "createdAt": chat_link.created_at.to_rfc3339(),
                    "updatedAt": chat_link.updated_at.to_rfc3339(),
                    "sampleMessages": messages,
                    "highlightedContexts": contexts
                }));
            }

            // Get related concepts
            let related_concepts = sqlx::query!(
                r#"
                SELECT c.id, c.name, cr.relationship_type, cr.similarity_score
                FROM concept_relationships cr
                JOIN concepts c ON cr.target_concept_id = c.id
                WHERE cr.source_concept_id = $1
                ORDER BY cr.similarity_score DESC
                "#,
                concept_id
            )
            .fetch_all(&self.pool)
            .await
            .context("Failed to get related concepts")?;

            let related: Vec<serde_json::Value> = related_concepts
                .into_iter()
                .map(|row| serde_json::json!({
                    "id": row.id,
                    "name": row.name,
                    "relationshipType": row.relationship_type,
                    "similarityScore": row.similarity_score
                }))
                .collect();

            Ok(Some(serde_json::json!({
                "id": concept.id,
                "name": concept.name,
                "description": concept.description,
                "tags": concept.tags
                    .and_then(|t| serde_json::from_value(t).ok())
                    .unwrap_or_else(|| Vec::<String>::new()),
                "confidenceScore": concept.confidence_score,
                "sourceChatCount": concept.source_chat_count,
                "createdAt": concept.created_at.to_rfc3339(),
                "updatedAt": concept.updated_at.to_rfc3339(),
                "sourceChats": source_chats,
                "relatedConcepts": related
            })))
        } else {
            Ok(None)
        }
    }

    /// Get detailed concept-chat relationship information for navigation
    pub async fn get_concept_chat_relationship(&self, concept_id: Uuid, chat_session_id: Uuid) -> Result<Option<serde_json::Value>> {
        // Get the concept-chat link information
        let link_info = sqlx::query!(
            r#"
            SELECT ccl.relevance_score, ccl.created_at as link_created_at,
                   c.name as concept_name, c.description as concept_description,
                   cs.title as chat_title, cs.preview_text
            FROM concept_chat_links ccl
            JOIN concepts c ON ccl.concept_id = c.id
            JOIN chat_sessions cs ON ccl.chat_session_id = cs.id
            WHERE ccl.concept_id = $1 AND ccl.chat_session_id = $2
            "#,
            concept_id,
            chat_session_id
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to get concept-chat relationship")?;

        if let Some(link) = link_info {
            // Get all messages from the chat session
            let messages = sqlx::query!(
                r#"
                SELECT id, content, sender_type, created_at, metadata
                FROM chat_messages
                WHERE chat_session_id = $1
                ORDER BY created_at ASC
                "#,
                chat_session_id
            )
            .fetch_all(&self.pool)
            .await
            .context("Failed to get chat messages")?;

            let chat_messages: Vec<serde_json::Value> = messages
                .into_iter()
                .map(|msg| serde_json::json!({
                    "id": msg.id,
                    "content": msg.content,
                    "senderType": msg.sender_type,
                    "createdAt": msg.created_at.to_rfc3339(),
                    "metadata": msg.metadata
                }))
                .collect();

            // Get all highlighted contexts from the chat session
            let contexts = sqlx::query!(
                r#"
                SELECT id, document_id, document_title, page_number, selected_text, text_coordinates, created_at
                FROM highlighted_contexts
                WHERE chat_session_id = $1
                ORDER BY created_at ASC
                "#,
                chat_session_id
            )
            .fetch_all(&self.pool)
            .await
            .context("Failed to get highlighted contexts")?;

            let highlighted_contexts: Vec<serde_json::Value> = contexts
                .into_iter()
                .map(|ctx| serde_json::json!({
                    "id": ctx.id,
                    "documentId": ctx.document_id,
                    "documentTitle": ctx.document_title,
                    "pageNumber": ctx.page_number,
                    "selectedText": ctx.selected_text,
                    "textCoordinates": ctx.text_coordinates,
                    "createdAt": ctx.created_at.to_rfc3339()
                }))
                .collect();

            Ok(Some(serde_json::json!({
                "conceptId": concept_id,
                "chatSessionId": chat_session_id,
                "conceptName": link.concept_name,
                "conceptDescription": link.concept_description,
                "chatTitle": link.chat_title,
                "chatPreviewText": link.preview_text,
                "relevanceScore": link.relevance_score,
                "linkCreatedAt": link.link_created_at.to_rfc3339(),
                "messages": chat_messages,
                "highlightedContexts": highlighted_contexts
            })))
        } else {
            Ok(None)
        }
    }

    /// Get all concepts linked to a specific chat session
    pub async fn get_concepts_for_chat_session(&self, chat_session_id: Uuid) -> Result<Vec<serde_json::Value>> {
        let concept_links = sqlx::query!(
            r#"
            SELECT c.id, c.name, c.description, c.confidence_score, ccl.relevance_score, ccl.created_at as link_created_at
            FROM concept_chat_links ccl
            JOIN concepts c ON ccl.concept_id = c.id
            WHERE ccl.chat_session_id = $1
            ORDER BY ccl.relevance_score DESC
            "#,
            chat_session_id
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to get concepts for chat session")?;

        let concepts: Vec<serde_json::Value> = concept_links
            .into_iter()
            .map(|row| serde_json::json!({
                "id": row.id,
                "name": row.name,
                "description": row.description,
                "confidenceScore": row.confidence_score,
                "relevanceScore": row.relevance_score,
                "linkCreatedAt": row.link_created_at.to_rfc3339()
            }))
            .collect();

        Ok(concepts)
    }
}

// ============================================================================
// Navigation State Operations
// ============================================================================

impl Database {
    /// Get user session state
    pub async fn get_user_session_state(&self) -> Result<Option<UserSessionState>> {
        let state = sqlx::query_as!(
            UserSessionState,
            "SELECT * FROM user_session_state ORDER BY updated_at DESC LIMIT 1"
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch user session state")?;

        Ok(state)
    }

    /// Update user session state
    pub async fn update_user_session_state(
        &self,
        current_document_id: Option<Uuid>,
        current_page: Option<i32>,
        zoom_level: Option<i32>,
        scroll_position: Option<i32>,
        active_tab: Option<&str>,
        active_chat_id: Option<Uuid>,
        last_reading_position: Option<Value>,
    ) -> Result<()> {
        // First try to get existing state
        let existing_state = self.get_user_session_state().await?;

        if let Some(state) = existing_state {
            // Update existing state
            sqlx::query!(
                r#"
                UPDATE user_session_state 
                SET 
                    current_document_id = COALESCE($2, current_document_id),
                    current_page = COALESCE($3, current_page),
                    zoom_level = COALESCE($4, zoom_level),
                    scroll_position = COALESCE($5, scroll_position),
                    active_tab = COALESCE($6, active_tab),
                    active_chat_id = COALESCE($7, active_chat_id),
                    last_reading_position = COALESCE($8, last_reading_position),
                    updated_at = NOW()
                WHERE id = $1
                "#,
                state.id,
                current_document_id,
                current_page,
                zoom_level,
                scroll_position,
                active_tab,
                active_chat_id,
                last_reading_position
            )
            .execute(&self.pool)
            .await
            .context("Failed to update user session state")?;
        } else {
            // Create new state
            let id = Uuid::new_v4();
            sqlx::query!(
                r#"
                INSERT INTO user_session_state (
                    id, current_document_id, current_page, zoom_level, 
                    scroll_position, active_tab, active_chat_id, last_reading_position
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                "#,
                id,
                current_document_id,
                current_page.unwrap_or(1),
                zoom_level.unwrap_or(100),
                scroll_position.unwrap_or(0),
                active_tab.unwrap_or("library"),
                active_chat_id,
                last_reading_position
            )
            .execute(&self.pool)
            .await
            .context("Failed to create user session state")?;
        }

        Ok(())
    }

    /// Save reading position
    pub async fn save_reading_position(
        &self,
        document_id: Uuid,
        page: i32,
        zoom: i32,
        scroll: i32,
    ) -> Result<()> {
        let reading_position = serde_json::json!({
            "documentId": document_id,
            "page": page,
            "zoom": zoom,
            "scroll": scroll
        });

        self.update_user_session_state(
            Some(document_id),
            Some(page),
            Some(zoom),
            Some(scroll),
            None,
            None,
            Some(reading_position),
        )
        .await
    }

    /// Get last reading position
    pub async fn get_last_reading_position(&self) -> Result<Option<Value>> {
        let state = self.get_user_session_state().await?;
        Ok(state.and_then(|s| s.last_reading_position))
    }
}

// ============================================================================
// User Preferences Operations
// ============================================================================

impl Database {
    /// Save user preferences
    pub async fn save_user_preferences(
        &self,
        openai_api_key: Option<&str>,
        theme: Option<&str>,
    ) -> Result<()> {
        // First, try to update existing preferences
        let updated = sqlx::query!(
            r#"
            UPDATE user_preferences 
            SET openai_api_key = $1, theme = $2, updated_at = NOW()
            WHERE id = (SELECT id FROM user_preferences LIMIT 1)
            "#,
            openai_api_key,
            theme
        )
        .execute(&self.pool)
        .await
        .context("Failed to update user preferences")?;

        // If no rows were updated, insert new preferences
        if updated.rows_affected() == 0 {
            let id = Uuid::new_v4();
            sqlx::query!(
                r#"
                INSERT INTO user_preferences (id, openai_api_key, theme)
                VALUES ($1, $2, $3)
                "#,
                id,
                openai_api_key,
                theme
            )
            .execute(&self.pool)
            .await
            .context("Failed to create user preferences")?;
        }

        Ok(())
    }

    /// Get user preferences
    pub async fn get_user_preferences(&self) -> Result<Option<Value>> {
        let result = sqlx::query!(
            "SELECT * FROM user_preferences LIMIT 1"
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch user preferences")?;

        if let Some(row) = result {
            Ok(Some(serde_json::json!({
                "openai_api_key": row.openai_api_key,
                "theme": row.theme
            })))
        } else {
            Ok(None)
        }
    }
}

// ============================================================================
// Testing and Development Functions
// ============================================================================

impl Database {
    /// Insert test data for development
    pub async fn insert_test_data(&self) -> Result<()> {
        // This function can be used to populate test data
        // Already have sample document from migration

        tracing::info!("Test data insertion completed");
        Ok(())
    }

    /// Clean all data (for testing)
    pub async fn clean_all_data(&self) -> Result<()> {
        sqlx::query!("TRUNCATE TABLE search_index, user_notes, knowledge_entries, ai_responses, questions, text_selections, document_sessions, documents RESTART IDENTITY CASCADE")
            .execute(&self.pool)
            .await
            .context("Failed to clean database")?;

        Ok(())
    }
}
