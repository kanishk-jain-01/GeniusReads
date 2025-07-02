// Database operations for GeniusReads
// Handles PostgreSQL connections and queries using sqlx

use anyhow::{Context, Result};
use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::{PgPool, Row};
use std::str::FromStr;
use uuid::Uuid;

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
            "SELECT * FROM chat_sessions ORDER BY updated_at DESC"
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
