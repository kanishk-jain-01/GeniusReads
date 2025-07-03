// Concept extraction database operations
use anyhow::{Context, Result};
use serde_json::Value;
use uuid::Uuid;
use crate::database::{Database, ExtractedConcept};

impl Database {
    /// Store an extracted concept in the database
    pub async fn store_extracted_concept(
        &self,
        chat_session_id: Uuid,
        name: &str,
        description: &str,
        tags: &[String],
        confidence_score: f64,
        _related_concepts: &[String], // Simplified for now
    ) -> Result<Uuid> {
        let concept_id = Uuid::new_v4();

        // Insert into concepts table (simplified without embeddings for now)
        sqlx::query!(
            r#"
            INSERT INTO concepts (id, name, description, tags, confidence_score, source_chat_count, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, 1, NOW(), NOW())
            "#,
            concept_id,
            name,
            description,
            serde_json::to_value(tags).unwrap(),
            confidence_score
        )
        .execute(&self.pool)
        .await
        .context("Failed to insert concept")?;

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

        Ok(concept_id)
    }

    /// Find similar concepts (simplified version)
    pub async fn find_similar_concepts(&self, _concept_id: Uuid, _similarity_threshold: f64, max_results: i32) -> Result<Vec<serde_json::Value>> {
        // Simplified implementation - just return empty for now
        let _limit = max_results;
        Ok(vec![])
    }

    /// Search concepts by text (simplified version)
    pub async fn search_concepts_by_text(&self, query_text: &str, _similarity_threshold: f64, max_results: i32) -> Result<Vec<serde_json::Value>> {
        // Simple text search for now
        let concepts = sqlx::query!(
            r#"
            SELECT id, name, description, confidence_score
            FROM concepts
            WHERE LOWER(name) LIKE LOWER($1) OR LOWER(description) LIKE LOWER($1)
            ORDER BY confidence_score DESC
            LIMIT $2
            "#,
            format!("%{}%", query_text),
            max_results as i64
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to search concepts by text")?;
        
        let results: Vec<serde_json::Value> = concepts
            .into_iter()
            .map(|row| serde_json::json!({
                "id": row.id,
                "name": row.name,
                "description": row.description,
                "confidenceScore": row.confidence_score,
                "similarityScore": 0.8 // Placeholder
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

    /// Get a specific concept by ID
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
                "updatedAt": concept.updated_at.to_rfc3339()
            })))
        } else {
            Ok(None)
        }
    }

    /// Get concept-chat relationship
    pub async fn get_concept_chat_relationship(&self, concept_id: Uuid, chat_session_id: Uuid) -> Result<Option<serde_json::Value>> {
        let link_info = sqlx::query!(
            r#"
            SELECT ccl.relevance_score, ccl.created_at as link_created_at,
                   c.name as concept_name, c.description as concept_description,
                   cs.title as chat_title
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
            Ok(Some(serde_json::json!({
                "conceptId": concept_id,
                "chatSessionId": chat_session_id,
                "conceptName": link.concept_name,
                "conceptDescription": link.concept_description,
                "chatTitle": link.chat_title,
                "relevanceScore": link.relevance_score,
                "linkCreatedAt": link.link_created_at.to_rfc3339()
            })))
        } else {
            Ok(None)
        }
    }

    /// Get concepts for chat session
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

    /// Get chats for a concept
    pub async fn get_chats_for_concept(&self, concept_id: Uuid) -> Result<Vec<serde_json::Value>> {
        let chat_links = sqlx::query!(
            r#"
            SELECT cs.id, cs.title, ccl.relevance_score, ccl.created_at as link_created_at
            FROM concept_chat_links ccl
            JOIN chat_sessions cs ON ccl.chat_session_id = cs.id
            WHERE ccl.concept_id = $1
            ORDER BY ccl.relevance_score DESC
            "#,
            concept_id
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to get chats for concept")?;

        let chats: Vec<serde_json::Value> = chat_links
            .into_iter()
            .map(|row| serde_json::json!({
                "id": row.id,
                "title": row.title,
                "relevanceScore": row.relevance_score,
                "createdAt": row.link_created_at.to_rfc3339()
            }))
            .collect();

        Ok(chats)
    }
} 