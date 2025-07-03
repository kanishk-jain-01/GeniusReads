// Concept extraction and similarity search commands
use crate::state::DbState;
use serde_json;

#[tauri::command]
pub async fn get_extraction_concepts(
    db: tauri::State<'_, DbState>,
) -> Result<serde_json::Value, String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        match database.get_all_concepts().await {
            Ok(concepts) => Ok(serde_json::to_value(concepts).unwrap()),
            Err(e) => Err(format!("Failed to get concepts: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn get_concept_by_id(
    concept_id: String,
    db: tauri::State<'_, DbState>,
) -> Result<Option<serde_json::Value>, String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        let id = uuid::Uuid::parse_str(&concept_id)
            .map_err(|e| format!("Invalid UUID: {}", e))?;
        
        match database.get_concept_by_id(id).await {
            Ok(concept) => Ok(concept),
            Err(e) => Err(format!("Failed to get concept: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

// Vector similarity search commands
#[tauri::command]
pub async fn find_similar_concepts(
    concept_id: String,
    similarity_threshold: Option<f64>,
    max_results: Option<i32>,
    db: tauri::State<'_, DbState>,
) -> Result<serde_json::Value, String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        let id = uuid::Uuid::parse_str(&concept_id)
            .map_err(|e| format!("Invalid UUID: {}", e))?;
        
        let threshold = similarity_threshold.unwrap_or(0.7);
        let limit = max_results.unwrap_or(10);
        
        match database.find_similar_concepts(id, threshold, limit).await {
            Ok(similar_concepts) => Ok(serde_json::to_value(similar_concepts).unwrap()),
            Err(e) => Err(format!("Failed to find similar concepts: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn search_concepts_by_text(
    query_text: String,
    similarity_threshold: Option<f64>,
    max_results: Option<i32>,
    db: tauri::State<'_, DbState>,
) -> Result<serde_json::Value, String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        let threshold = similarity_threshold.unwrap_or(0.6);
        let limit = max_results.unwrap_or(10);
        
        match database.search_concepts_by_text(&query_text, threshold, limit).await {
            Ok(matching_concepts) => Ok(serde_json::to_value(matching_concepts).unwrap()),
            Err(e) => Err(format!("Failed to search concepts by text: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

// Enhanced concept-chat linking commands
#[tauri::command]
pub async fn get_concept_chat_relationship(
    concept_id: String,
    chat_session_id: String,
    db: tauri::State<'_, DbState>,
) -> Result<Option<serde_json::Value>, String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        let concept_uuid = uuid::Uuid::parse_str(&concept_id)
            .map_err(|e| format!("Invalid concept UUID: {}", e))?;
        let chat_uuid = uuid::Uuid::parse_str(&chat_session_id)
            .map_err(|e| format!("Invalid chat session UUID: {}", e))?;
        
        match database.get_concept_chat_relationship(concept_uuid, chat_uuid).await {
            Ok(relationship) => Ok(relationship),
            Err(e) => Err(format!("Failed to get concept-chat relationship: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn get_concepts_for_chat_session(
    chat_session_id: String,
    db: tauri::State<'_, DbState>,
) -> Result<Vec<serde_json::Value>, String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        let chat_uuid = uuid::Uuid::parse_str(&chat_session_id)
            .map_err(|e| format!("Invalid chat session UUID: {}", e))?;
        
        match database.get_concepts_for_chat_session(chat_uuid).await {
            Ok(concepts) => Ok(concepts),
            Err(e) => Err(format!("Failed to get concepts for chat session: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
} 