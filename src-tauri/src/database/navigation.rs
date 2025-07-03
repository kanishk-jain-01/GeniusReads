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
        // Use a single, unique key to ensure only one session row exists.
        // The value 't' is arbitrary; its purpose is to be a constant
        // for the UNIQUE constraint.
        let singleton_key = true;

        sqlx::query!(
            r#"
            INSERT INTO user_session_state (
                singleton_key, current_document_id, current_page, zoom_level, 
                scroll_position, active_tab, active_chat_id, last_reading_position
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (singleton_key) DO UPDATE SET
                current_document_id = COALESCE($2, user_session_state.current_document_id),
                current_page = COALESCE($3, user_session_state.current_page),
                zoom_level = COALESCE($4, user_session_state.zoom_level),
                scroll_position = COALESCE($5, user_session_state.scroll_position),
                active_tab = COALESCE($6, user_session_state.active_tab),
                active_chat_id = COALESCE($7, user_session_state.active_chat_id),
                last_reading_position = COALESCE($8, user_session_state.last_reading_position),
                updated_at = NOW()
            "#,
            singleton_key,
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
        .context("Failed to create or update user session state")?;

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
        .await
    }

    /// Get last reading position
    pub async fn get_last_reading_position(&self) -> Result<Option<Value>> {
        let state = self.get_user_session_state().await?;
        Ok(state.and_then(|s| s.last_reading_position))
    }
} 