// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;
use std::sync::Arc;
use tokio::sync::Mutex;

mod database;
use database::Database;

// Global database instance
type DbState = Arc<Mutex<Option<Database>>>;

// Simple test command to verify Tauri-React communication
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Tauri-React communication is working.", name)
}

// Test command for application info
#[tauri::command]
fn get_app_info() -> serde_json::Value {
    serde_json::json!({
        "name": "GeniusReads",
        "version": "0.1.0",
        "framework": "Tauri + React",
        "status": "Foundation Phase",
        "timestamp": chrono::Utc::now().to_rfc3339()
    })
}

// Test command for system information
#[tauri::command]
fn get_system_info() -> serde_json::Value {
    serde_json::json!({
        "platform": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "rust_version": "stable",
        "tauri_working": true
    })
}

// Database test commands
#[tauri::command]
async fn test_database_connection(db: tauri::State<'_, DbState>) -> Result<serde_json::Value, String> {
    let db_guard = db.lock().await;
    
    if let Some(database) = db_guard.as_ref() {
        match database.test_connection().await {
            Ok(connected) => Ok(serde_json::json!({
                "connected": connected,
                "message": "Database connection successful",
                "timestamp": chrono::Utc::now().to_rfc3339()
            })),
            Err(e) => Err(format!("Database connection failed: {}", e))
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
async fn get_database_stats(db: tauri::State<'_, DbState>) -> Result<serde_json::Value, String> {
    let db_guard = db.lock().await;
    
    if let Some(database) = db_guard.as_ref() {
        match database.get_stats().await {
            Ok(stats) => Ok(serde_json::to_value(stats).unwrap()),
            Err(e) => Err(format!("Failed to get database stats: {}", e))
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
async fn get_documents(db: tauri::State<'_, DbState>) -> Result<serde_json::Value, String> {
    let db_guard = db.lock().await;
    
    if let Some(database) = db_guard.as_ref() {
        match database.get_documents().await {
            Ok(documents) => Ok(serde_json::to_value(documents).unwrap()),
            Err(e) => Err(format!("Failed to get documents: {}", e))
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_app_info,
            get_system_info,
            test_database_connection,
            get_database_stats,
            get_documents
        ])
        .setup(|app| {
            // Initialize database connection
            let db_state: DbState = Arc::new(Mutex::new(None));
            app.manage(db_state.clone());

            // Connect to database in async context
            tauri::async_runtime::spawn(async move {
                match Database::new_local().await {
                    Ok(database) => {
                        tracing::info!("Database connected successfully");
                        *db_state.lock().await = Some(database);
                    }
                    Err(e) => {
                        tracing::error!("Failed to connect to database: {}", e);
                    }
                }
            });

            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
