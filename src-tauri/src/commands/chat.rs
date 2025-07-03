// Chat session management commands
use crate::state::DbState;
use serde_json;

#[tauri::command]
pub async fn create_chat_session(
    title: String,
    db: tauri::State<'_, DbState>,
) -> Result<String, String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        match database.create_chat_session(&title).await {
            Ok(session_id) => Ok(session_id.to_string()),
            Err(e) => Err(format!("Failed to create chat session: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn get_chat_sessions(
    db: tauri::State<'_, DbState>,
) -> Result<serde_json::Value, String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        match database.get_chat_sessions().await {
            Ok(sessions) => Ok(serde_json::to_value(sessions).unwrap()),
            Err(e) => Err(format!("Failed to get chat sessions: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn get_active_chat_session(
    db: tauri::State<'_, DbState>,
) -> Result<Option<serde_json::Value>, String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        match database.get_active_chat_session().await {
            Ok(session) => Ok(session),
            Err(e) => Err(format!("Failed to get active chat session: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn get_chat_session_by_id(
    chat_session_id: String,
    db: tauri::State<'_, DbState>,
) -> Result<Option<serde_json::Value>, String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        let session_id = uuid::Uuid::parse_str(&chat_session_id)
            .map_err(|e| format!("Invalid UUID: {}", e))?;
        
        match database.get_chat_session_by_id(session_id).await {
            Ok(session) => Ok(session),
            Err(e) => Err(format!("Failed to get chat session by ID: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn set_active_chat_session(
    chat_session_id: String,
    db: tauri::State<'_, DbState>,
) -> Result<(), String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        let session_id = uuid::Uuid::parse_str(&chat_session_id)
            .map_err(|e| format!("Invalid UUID: {}", e))?;
        
        match database.set_active_chat_session(session_id).await {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to set active chat session: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn add_chat_message(
    chat_session_id: String,
    content: String,
    sender_type: String,
    metadata: serde_json::Value,
    db: tauri::State<'_, DbState>,
) -> Result<String, String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        let session_id = uuid::Uuid::parse_str(&chat_session_id)
            .map_err(|e| format!("Invalid UUID: {}", e))?;
        
        match database.add_chat_message(session_id, &content, &sender_type, metadata).await {
            Ok(message_id) => Ok(message_id.to_string()),
            Err(e) => Err(format!("Failed to add chat message: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn add_highlighted_context(
    chat_session_id: String,
    document_id: String,
    document_title: String,
    page_number: i32,
    selected_text: String,
    text_coordinates: serde_json::Value,
    db: tauri::State<'_, DbState>,
) -> Result<String, String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        let session_id = uuid::Uuid::parse_str(&chat_session_id)
            .map_err(|e| format!("Invalid chat session UUID: {}", e))?;
        let doc_id = uuid::Uuid::parse_str(&document_id)
            .map_err(|e| format!("Invalid document UUID: {}", e))?;
        
        match database.add_highlighted_context(
            session_id,
            doc_id,
            &document_title,
            page_number,
            &selected_text,
            text_coordinates,
        ).await {
            Ok(context_id) => Ok(context_id.to_string()),
            Err(e) => Err(format!("Failed to add highlighted context: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn delete_chat_session(
    chat_session_id: String,
    db: tauri::State<'_, DbState>,
) -> Result<(), String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        let session_id = uuid::Uuid::parse_str(&chat_session_id)
            .map_err(|e| format!("Invalid UUID: {}", e))?;
        
        match database.delete_chat_session(session_id).await {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to delete chat session: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn clear_chat_session(
    chat_session_id: String,
    db: tauri::State<'_, DbState>,
) -> Result<(), String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        let session_id = uuid::Uuid::parse_str(&chat_session_id)
            .map_err(|e| format!("Invalid UUID: {}", e))?;
        
        match database.clear_chat_session(session_id).await {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to clear chat session: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn end_chat_session(
    chat_session_id: String,
    db: tauri::State<'_, DbState>,
) -> Result<(), String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        let session_id = uuid::Uuid::parse_str(&chat_session_id)
            .map_err(|e| format!("Invalid UUID: {}", e))?;
        
        match database.end_chat_session(session_id).await {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to end chat session: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn update_chat_session_title(
    chat_session_id: String,
    title: String,
    db: tauri::State<'_, DbState>,
) -> Result<(), String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        let session_id = uuid::Uuid::parse_str(&chat_session_id)
            .map_err(|e| format!("Invalid UUID: {}", e))?;
        
        match database.update_chat_session_title(session_id, &title).await {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to update chat session title: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
} 