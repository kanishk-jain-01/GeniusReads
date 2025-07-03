// Navigation state management commands
use crate::state::DbState;
use serde_json;

#[tauri::command]
pub async fn get_user_session_state(
    db: tauri::State<'_, DbState>,
) -> Result<Option<serde_json::Value>, String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        match database.get_user_session_state().await {
            Ok(state) => Ok(state.map(|s| serde_json::to_value(s).unwrap())),
            Err(e) => Err(format!("Failed to get user session state: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn update_user_session_state(
    state: serde_json::Value,
    db: tauri::State<'_, DbState>,
) -> Result<(), String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        // Parse the state object
        let current_document_id = state.get("currentDocumentId")
            .and_then(|v| v.as_str())
            .and_then(|s| uuid::Uuid::parse_str(s).ok());
        
        let current_page = state.get("currentPage")
            .and_then(|v| v.as_i64())
            .map(|i| i as i32);
        
        let zoom_level = state.get("zoomLevel")
            .and_then(|v| v.as_i64())
            .map(|i| i as i32);
        
        let scroll_position = state.get("scrollPosition")
            .and_then(|v| v.as_i64())
            .map(|i| i as i32);
        
        let active_tab = state.get("activeTab")
            .and_then(|v| v.as_str());
        
        let active_chat_id = state.get("activeChatId")
            .and_then(|v| v.as_str())
            .and_then(|s| uuid::Uuid::parse_str(s).ok());
        
        let last_reading_position = state.get("lastReadingPosition").cloned();
        
        match database.update_user_session_state(
            current_document_id,
            current_page,
            zoom_level,
            scroll_position,
            active_tab,
            active_chat_id,
            last_reading_position,
        ).await {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to update user session state: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn save_reading_position(
    document_id: String,
    page: i32,
    zoom: i32,
    scroll: i32,
    db: tauri::State<'_, DbState>,
) -> Result<(), String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        let doc_id = uuid::Uuid::parse_str(&document_id)
            .map_err(|e| format!("Invalid UUID: {}", e))?;
        
        match database.save_reading_position(doc_id, page, zoom, scroll).await {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to save reading position: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn get_last_reading_position(
    db: tauri::State<'_, DbState>,
) -> Result<Option<serde_json::Value>, String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        match database.get_last_reading_position().await {
            Ok(position) => Ok(position),
            Err(e) => Err(format!("Failed to get last reading position: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
} 