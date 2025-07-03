// Database connection management
use anyhow::{Context, Result};
use sqlx::{PgPool, Row};
use crate::database::types::DatabaseStats;
use std::env;

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
        // Load environment variables from .env file in the root directory
        dotenvy::dotenv().ok();

        // Construct the database URL from environment variables
        let database_url = env::var("DATABASE_URL")
            .context("DATABASE_URL must be set in your .env file")?;
        
        tracing::info!("Connecting to database: {}", database_url);

        let pool = PgPool::connect(&database_url)
            .await
            .context(format!("Failed to connect to database at {}", database_url))?;

        Ok(Database { pool })
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
                (SELECT COUNT(*) FROM chat_messages WHERE sender_type = 'user') as question_count,
                (SELECT COUNT(*) FROM chat_messages WHERE sender_type = 'assistant') as response_count,
                (SELECT COUNT(*) FROM concepts) as knowledge_count,
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