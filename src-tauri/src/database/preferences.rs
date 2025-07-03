// User preferences database operations
use anyhow::{Context, Result};
use serde_json::Value;
use uuid::Uuid;
use crate::database::Database;

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