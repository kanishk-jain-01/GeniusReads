// Navigation state database operations
use anyhow::{Context, Result};
use serde_json::Value;
use uuid::Uuid;
use crate::database::{Database, UserSessionState};

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
        let mut tx = self.pool.begin().await.context("Failed to begin transaction")?;
        
        Self::update_user_session_state_with_transaction(
            &mut tx,
            current_document_id,
            current_page,
            zoom_level,
            scroll_position,
            active_tab,
            active_chat_id,
            last_reading_position,
        )
        .await
        .context("Failed to update user session state")?;

        tx.commit().await.context("Failed to commit transaction")?;

        Ok(())
    }

    /// Update user session state within a transaction
    pub async fn update_user_session_state_with_transaction(
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        current_document_id: Option<Uuid>,
        current_page: Option<i32>,
        zoom_level: Option<i32>,
        scroll_position: Option<i32>,
        active_tab: Option<&str>,
        active_chat_id: Option<Uuid>,
        last_reading_position: Option<Value>,
    ) -> Result<()> {
        // Check if a session state row exists
        let row_exists: Option<i32> = sqlx::query_scalar("SELECT 1 FROM user_session_state LIMIT 1")
            .fetch_optional(&mut **tx)
            .await
            .context("Failed to check for existing user session state")?;

        if row_exists.is_some() {
            // Row exists, so update it
            sqlx::query!(
                r#"
                UPDATE user_session_state SET
                    current_document_id = COALESCE($1, current_document_id),
                    current_page = COALESCE($2, current_page),
                    zoom_level = COALESCE($3, zoom_level),
                    scroll_position = COALESCE($4, scroll_position),
                    active_tab = COALESCE($5, active_tab),
                    active_chat_id = COALESCE($6, active_chat_id),
                    last_reading_position = COALESCE($7, last_reading_position),
                    updated_at = NOW()
                WHERE singleton_key = true
                "#,
                current_document_id,
                current_page,
                zoom_level,
                scroll_position,
                active_tab,
                active_chat_id,
                last_reading_position
            )
            .execute(&mut **tx)
            .await
            .context("Failed to update user session state")?;
        } else {
            // No row exists, so insert a new one
            sqlx::query!(
                r#"
                INSERT INTO user_session_state (
                    singleton_key, current_document_id, current_page, zoom_level, 
                    scroll_position, active_tab, active_chat_id, last_reading_position
                )
                VALUES (true, $1, COALESCE($2, 1), COALESCE($3, 100), COALESCE($4, 0), COALESCE($5, 'library'), $6, $7)
                "#,
                current_document_id,
                current_page,
                zoom_level,
                scroll_position,
                active_tab,
                active_chat_id,
                last_reading_position
            )
            .execute(&mut **tx)
            .await
            .context("Failed to insert user session state")?;
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
            Some("reader"),
            None,
            Some(reading_position),
        )
        .await?;

        Ok(())
    }

    /// Get last reading position
    pub async fn get_last_reading_position(&self) -> Result<Option<Value>> {
        let state = self.get_user_session_state().await?;
        Ok(state.and_then(|s| s.last_reading_position))
    }
} 