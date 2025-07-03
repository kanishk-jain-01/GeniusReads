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
            Ok(Some(preferences)) => Ok(Some(preferences)),
            Ok(None) => {
                // No preferences found, so create default ones
                let default_theme = "system";
                if let Err(e) = database.save_user_preferences(None, Some(default_theme)).await {
                    return Err(format!("Failed to save default user preferences: {}", e));
                }
                
                // Return the newly created default preferences
                Ok(Some(serde_json::json!({
                    "openai_api_key": serde_json::Value::Null,
                    "theme": default_theme
                })))
            }
            Err(e) => Err(format!("Failed to get user preferences: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
} 