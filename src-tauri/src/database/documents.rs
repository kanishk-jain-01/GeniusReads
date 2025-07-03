// Document database operations
use anyhow::{Context, Result};
use serde_json::Value;
use sqlx::Row;
use uuid::Uuid;
use crate::database::{Database, Document};

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