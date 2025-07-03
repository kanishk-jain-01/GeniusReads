// User preferences management commands
use crate::state::DbState;
use serde_json;

#[tauri::command]
pub async fn save_user_preferences(
    preferences: serde_json::Value,
    db: tauri::State<'_, DbState>,
) -> Result<(), String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        let openai_api_key = preferences.get("openaiApiKey")
            .and_then(|v| v.as_str());
        
        let theme = preferences.get("theme")
            .and_then(|v| v.as_str());
        
        match database.save_user_preferences(openai_api_key, theme).await {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to save user preferences: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn get_user_preferences(
    db: tauri::State<'_, DbState>,
) -> Result<Option<serde_json::Value>, String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        match database.get_user_preferences().await {
            Ok(preferences) => Ok(preferences),
            Err(e) => Err(format!("Failed to get user preferences: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
} 