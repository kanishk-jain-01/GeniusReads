// Database management commands
use crate::state::DbState;
use serde_json;

// Database test commands
#[tauri::command]
pub async fn test_database_connection(
    db: tauri::State<'_, DbState>,
) -> Result<serde_json::Value, String> {
    let db_guard = db.lock().await;

    if let Some(database) = db_guard.as_ref() {
        match database.test_connection().await {
            Ok(connected) => Ok(serde_json::json!({
                "connected": connected,
                "message": "Database connection successful",
                "timestamp": chrono::Utc::now().to_rfc3339()
            })),
            Err(e) => Err(format!("Database connection failed: {e}")),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn get_database_stats(db: tauri::State<'_, DbState>) -> Result<serde_json::Value, String> {
    let db_guard = db.lock().await;

    if let Some(database) = db_guard.as_ref() {
        match database.get_stats().await {
            Ok(stats) => Ok(serde_json::to_value(stats).unwrap()),
            Err(e) => Err(format!("Failed to get database stats: {e}")),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn get_documents(db: tauri::State<'_, DbState>) -> Result<serde_json::Value, String> {
    let db_guard = db.lock().await;

    if let Some(database) = db_guard.as_ref() {
        match database.get_documents().await {
            Ok(documents) => Ok(serde_json::to_value(documents).unwrap()),
            Err(e) => Err(format!("Failed to get documents: {e}")),
        }
    } else {
        Err("Database not initialized".to_string())
    }
} 