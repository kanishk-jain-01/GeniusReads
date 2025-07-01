// Database operations for GeniusReads
// Handles PostgreSQL connections and queries using sqlx

use sqlx::{PgPool, Row};
use serde_json::Value;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use anyhow::{Result, Context};
use bigdecimal::BigDecimal;
use std::str::FromStr;

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
        let row = sqlx::query(r#"
            SELECT 
                (SELECT COUNT(*) FROM documents) as document_count,
                (SELECT COUNT(*) FROM questions) as question_count,
                (SELECT COUNT(*) FROM ai_responses) as response_count,
                (SELECT COUNT(*) FROM knowledge_entries) as knowledge_count,
                (SELECT COUNT(*) FROM user_notes) as note_count
        "#)
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
        let document = sqlx::query_as!(
            Document,
            "SELECT * FROM documents WHERE id = $1",
            id
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch document")?;

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
        ).await?;

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