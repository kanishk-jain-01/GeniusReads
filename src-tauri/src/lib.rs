// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;

mod database;
mod pdf_handler;

use database::Database;
use pdf_handler::PDFHandler;

// Global database instance
type DbState = Arc<Mutex<Option<Database>>>;

// Simple test command to verify Tauri-React communication
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! Tauri-React communication is working.")
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

// PDF file operations
#[tauri::command]
async fn open_pdf_dialog(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let file_path = app.dialog()
        .file()
        .add_filter("PDF Files", &["pdf"])
        .set_title("Select PDF Document")
        .blocking_pick_file();
    
    match file_path {
        Some(path) => {
            let path_str = path.to_string();
            Ok(Some(path_str))
        }
        None => Ok(None), // User cancelled
    }
}

#[tauri::command]
async fn load_pdf_document(
    file_path: String,
    db: tauri::State<'_, DbState>,
) -> Result<serde_json::Value, String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        // First, check if document already exists in database
        match database.get_document_by_path(&file_path).await {
            Ok(Some(existing_doc)) => {
                // Document already exists, update last_accessed and return it
                let _ = database.update_document_position(
                    existing_doc.id, 
                    existing_doc.current_page, 
                    existing_doc.zoom_level
                ).await; // This updates last_accessed
                
                return Ok(serde_json::json!({
                    "id": existing_doc.id.to_string(),
                    "title": existing_doc.title,
                    "filePath": existing_doc.file_path,
                    "fileName": existing_doc.file_name,
                    "fileSize": existing_doc.file_size,
                    "totalPages": existing_doc.total_pages,
                    "currentPage": existing_doc.current_page,
                    "zoomLevel": existing_doc.zoom_level,
                    "lastAccessed": existing_doc.last_accessed.to_rfc3339(),
                    "createdAt": existing_doc.created_at.to_rfc3339(),
                    "updatedAt": existing_doc.updated_at.to_rfc3339(),
                    "metadata": existing_doc.metadata
                }));
            }
            Ok(None) => {
                // Document doesn't exist, proceed to create it
            }
            Err(e) => {
                return Err(format!("Failed to check existing document: {}", e));
            }
        }
    } else {
        return Err("Database not initialized".to_string());
    }

    // Create PDF document from file (only for new documents)
    let pdf_doc = match PDFHandler::create_document(&file_path) {
        Ok(doc) => doc,
        Err(e) => return Err(format!("Failed to load PDF: {}", e)),
    };
    
    // Store new document in database
    if let Some(database) = db_guard.as_ref() {
        match database.create_document(
            &pdf_doc.title,
            None, // author
            &pdf_doc.file_path,
            &pdf_doc.file_name,
            pdf_doc.file_size as i64,
            pdf_doc.total_pages as i32,
            serde_json::json!(pdf_doc.metadata),
        ).await {
            Ok(_) => {
                // Return document info for frontend
                Ok(serde_json::json!({
                    "id": pdf_doc.id,
                    "title": pdf_doc.title,
                    "filePath": pdf_doc.file_path,
                    "fileName": pdf_doc.file_name,
                    "fileSize": pdf_doc.file_size,
                    "totalPages": pdf_doc.total_pages,
                    "currentPage": 1,
                    "zoomLevel": 100,
                    "lastAccessed": chrono::Utc::now().to_rfc3339(),
                    "createdAt": chrono::Utc::now().to_rfc3339(),
                    "updatedAt": chrono::Utc::now().to_rfc3339(),
                    "metadata": pdf_doc.metadata
                }))
            }
            Err(e) => Err(format!("Failed to save document to database: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
async fn read_pdf_file(file_path: String) -> Result<String, String> {
    use std::fs;
    use base64::{Engine as _, engine::general_purpose};
    
    // Read the PDF file as bytes
    match fs::read(&file_path) {
        Ok(file_data) => {
            // Convert to base64
            let base64_data = general_purpose::STANDARD.encode(&file_data);
            Ok(format!("data:application/pdf;base64,{}", base64_data))
        }
        Err(e) => Err(format!("Failed to read PDF file: {}", e))
    }
}

#[tauri::command]
async fn update_document_state(
    document_id: String,
    current_page: i32,
    zoom_level: i32,
    db: tauri::State<'_, DbState>,
) -> Result<(), String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        let doc_id = uuid::Uuid::parse_str(&document_id).map_err(|e| format!("Invalid UUID: {}", e))?;
        
        match database.update_document_position(doc_id, current_page, zoom_level).await {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to update document state: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
async fn update_document_total_pages(
    document_id: String,
    total_pages: i32,
    db: tauri::State<'_, DbState>,
) -> Result<(), String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        let doc_id = uuid::Uuid::parse_str(&document_id).map_err(|e| format!("Invalid UUID: {}", e))?;
        
        match database.update_document_total_pages(doc_id, total_pages).await {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to update document total pages: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
async fn get_recent_documents(
    db: tauri::State<'_, DbState>,
) -> Result<serde_json::Value, String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        match database.get_documents().await {
            Ok(documents) => Ok(serde_json::to_value(documents).unwrap()),
            Err(e) => Err(format!("Failed to get recent documents: {}", e)),
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

// Database test commands
#[tauri::command]
async fn test_database_connection(
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
async fn get_database_stats(db: tauri::State<'_, DbState>) -> Result<serde_json::Value, String> {
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
async fn get_documents(db: tauri::State<'_, DbState>) -> Result<serde_json::Value, String> {
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
            open_pdf_dialog,
            load_pdf_document,
            read_pdf_file,
            update_document_state,
            update_document_total_pages,
            get_recent_documents,
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
