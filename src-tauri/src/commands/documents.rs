// Document management commands
use crate::state::DbState;
use crate::pdf_handler::PDFHandler;
use serde_json;

// PDF file operations
#[tauri::command]
pub async fn open_pdf_dialog(app: tauri::AppHandle) -> Result<Option<String>, String> {
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
pub async fn load_pdf_document(
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
pub async fn read_pdf_file(file_path: String) -> Result<String, String> {
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
pub async fn update_document_state(
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
pub async fn update_document_total_pages(
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
pub async fn get_recent_documents(
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