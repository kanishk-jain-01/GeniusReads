// Chat session database operations
use anyhow::{Context, Result};
use serde_json::Value;
use uuid::Uuid;
use crate::database::{Database, ChatSession, ChatSessionForAnalysis, ChatMessage, HighlightedContext};

impl Database {
    /// Create a new chat session within a transaction
    async fn create_chat_session_with_transaction(
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        title: &str,
    ) -> Result<Uuid> {
        let id = Uuid::new_v4();

        sqlx::query!(
            r#"
            INSERT INTO chat_sessions (id, title, is_active)
            VALUES ($1, $2, true)
            "#,
            id,
            title
        )
        .execute(&mut **tx)
        .await
        .context("Failed to create chat session")?;

        Ok(id)
    }

    /// Create a new chat session and set it as active
    pub async fn create_chat_session(&self, title: &str) -> Result<Uuid> {
        let mut tx = self.pool.begin().await.context("Failed to begin transaction")?;

        // Deactivate all other chat sessions
        sqlx::query!("UPDATE chat_sessions SET is_active = false")
            .execute(&mut *tx)
            .await
            .context("Failed to deactivate other chat sessions")?;
        
        // Create the new session as active
        let new_session_id = Self::create_chat_session_with_transaction(&mut tx, title).await?;

        // Update user session state to point to the new active chat
        Self::update_user_session_state_with_transaction(
            &mut tx,
            None,
            None,
            None,
            None,
            Some("chat"),
            Some(new_session_id),
            None,
        )
        .await
        .context("Failed to update user session state for new chat")?;
        
        tx.commit().await.context("Failed to commit transaction")?;

        Ok(new_session_id)
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
                "updated_at": row.updated_at,
                "analysis_status": row.analysis_status
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
                "updated_at": row.updated_at,
                "analysis_status": row.analysis_status
            })))
        } else {
            Ok(None)
        }
    }

    /// Set active chat session
    pub async fn set_active_chat_session(&self, chat_session_id: Uuid) -> Result<()> {
        let mut tx = self.pool.begin().await.context("Failed to begin transaction")?;

        // First, deactivate all chat sessions
        sqlx::query!("UPDATE chat_sessions SET is_active = false")
            .execute(&mut *tx)
            .await
            .context("Failed to deactivate chat sessions")?;

        // Then activate the specified session
        sqlx::query!(
            "UPDATE chat_sessions SET is_active = true WHERE id = $1",
            chat_session_id
        )
        .execute(&mut *tx)
        .await
        .context("Failed to set active chat session")?;
        
        // Update user session state to point to the new active chat
        Self::update_user_session_state_with_transaction(
            &mut tx,
            None,
            None,
            None,
            None,
            Some("chat"),
            Some(chat_session_id),
            None,
        ).await.context("Failed to update user session state for active chat")?;
        
        tx.commit().await.context("Failed to commit transaction")?;

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
} 