// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;

mod database;
mod pdf_handler;
mod langraph_bridge;

use database::Database;
use pdf_handler::PDFHandler;
use langraph_bridge::{LangGraphBridge, ConceptExtractionInput, ChatMessageForExtraction, HighlightedContextForExtraction};

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

// ============================================================================
// Chat Session Management Commands
// ============================================================================

#[tauri::command]
async fn create_chat_session(
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
async fn get_chat_sessions(
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
async fn get_active_chat_session(
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
async fn get_chat_session_by_id(
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
async fn set_active_chat_session(
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
async fn add_chat_message(
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
async fn add_highlighted_context(
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
async fn delete_chat_session(
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
async fn clear_chat_session(
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
async fn end_chat_session(
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
async fn update_chat_session_title(
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

// ============================================================================
// Navigation State Management Commands
// ============================================================================

#[tauri::command]
async fn get_user_session_state(
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
async fn update_user_session_state(
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
async fn save_reading_position(
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
async fn get_last_reading_position(
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

// ============================================================================
// User Preferences Management Commands
// ============================================================================

#[tauri::command]
async fn save_user_preferences(
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
async fn get_user_preferences(
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

// ============================================================================
// LangGraph Concept Extraction Commands
// ============================================================================

#[tauri::command]
async fn analyze_chat_session(
    chat_session_id: String,
    db: tauri::State<'_, DbState>,
) -> Result<serde_json::Value, String> {
    let db_guard = db.lock().await;
    if let Some(database) = db_guard.as_ref() {
        let session_id = uuid::Uuid::parse_str(&chat_session_id)
            .map_err(|e| format!("Invalid UUID: {}", e))?;
        
        // Update analysis status to 'processing'
        database.update_chat_analysis_status(session_id, "processing").await
            .map_err(|e| format!("Failed to update analysis status: {}", e))?;
        
        // Get chat session data for analysis
        let chat_data = database.get_chat_session_for_analysis(session_id).await
            .map_err(|e| format!("Failed to get chat session data: {}", e))?;
        
        if chat_data.is_none() {
            return Err("Chat session not found".to_string());
        }
        
        let chat_session = chat_data.unwrap();
        
        // Prepare data for LangGraph
        let messages: Vec<ChatMessageForExtraction> = chat_session.messages.into_iter().map(|msg| {
            ChatMessageForExtraction {
                content: msg.content,
                sender_type: msg.sender_type,
                created_at: msg.created_at.to_rfc3339(),
            }
        }).collect();
        
        let highlighted_contexts: Vec<HighlightedContextForExtraction> = chat_session.highlighted_contexts.into_iter().map(|ctx| {
            HighlightedContextForExtraction {
                document_title: ctx.document_title,
                page_number: ctx.page_number,
                selected_text: ctx.selected_text,
            }
        }).collect();
        
        let extraction_input = ConceptExtractionInput {
            chat_session_id: session_id,
            messages,
            highlighted_contexts,
        };
        
        // Initialize LangGraph bridge and extract concepts
        let bridge = LangGraphBridge::new();
        let extraction_result = match bridge.extract_concepts(extraction_input) {
            Ok(result) => result,
            Err(e) => {
                // Update status to 'failed'
                let _ = database.update_chat_analysis_status(session_id, "failed").await;
                return Err(format!("Concept extraction failed: {}", e));
            }
        };
        
        if extraction_result.success {
            // Store extracted concepts in database
            for concept in &extraction_result.concepts {
                match database.store_extracted_concept(
                    session_id,
                    &concept.name,
                    &concept.description,
                    &concept.tags,
                    concept.confidence_score,
                    &concept.related_concepts,
                ).await {
                    Ok(_) => {},
                    Err(e) => {
                        tracing::warn!("Failed to store concept '{}': {}", concept.name, e);
                    }
                }
            }
            
            // Update analysis status to 'complete'
            database.update_chat_analysis_status(session_id, "complete").await
                .map_err(|e| format!("Failed to update analysis status: {}", e))?;
            
            Ok(serde_json::json!({
                "success": true,
                "conceptsExtracted": extraction_result.total_concepts_found,
                "processingTimeMs": extraction_result.processing_time_ms,
                "message": format!("Successfully extracted {} concepts", extraction_result.total_concepts_found)
            }))
        } else {
            // Update status to 'failed'
            database.update_chat_analysis_status(session_id, "failed").await
                .map_err(|e| format!("Failed to update analysis status: {}", e))?;
            
            Err(extraction_result.error_message.unwrap_or_else(|| "Unknown extraction error".to_string()))
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
async fn get_extraction_concepts(
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
async fn get_concept_by_id(
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

// ============================================================================
// Vector Similarity Search Commands
// ============================================================================

#[tauri::command]
async fn find_similar_concepts(
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
async fn search_concepts_by_text(
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

// ============================================================================
// Enhanced Concept-Chat Linking Commands
// ============================================================================

#[tauri::command]
async fn get_concept_chat_relationship(
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
async fn get_concepts_for_chat_session(
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
            get_documents,
            create_chat_session,
            get_chat_sessions,
            get_active_chat_session,
            get_chat_session_by_id,
            set_active_chat_session,
            add_chat_message,
            add_highlighted_context,
            delete_chat_session,
            clear_chat_session,
            end_chat_session,
            update_chat_session_title,
            get_user_session_state,
            update_user_session_state,
            save_reading_position,
            get_last_reading_position,
            save_user_preferences,
            get_user_preferences,
            analyze_chat_session,
            get_extraction_concepts,
            get_concept_by_id,
            find_similar_concepts,
            search_concepts_by_text,
            get_concept_chat_relationship,
            get_concepts_for_chat_session
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

            // Initialize LangGraph bridge
            tauri::async_runtime::spawn(async move {
                match langraph_bridge::initialize_langraph() {
                    Ok(_) => {
                        tracing::info!("LangGraph bridge initialized successfully");
                    }
                    Err(e) => {
                        tracing::warn!("Failed to initialize LangGraph bridge: {}", e);
                        tracing::warn!("Concept extraction features will not be available");
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
