// Database connection management
use anyhow::{Context, Result};
use sqlx::{PgPool, Row};
use crate::database::types::DatabaseStats;

pub struct Database {
    pub pool: PgPool,
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