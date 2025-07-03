// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;

mod database;
mod pdf_handler;
mod langraph_bridge;
mod commands;
mod state;

use database::Database;
use langraph_bridge::LangGraphBridge;
use state::{DbState, LangGraphState};

// Re-export all commands from the commands module
use commands::*;

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
            get_concepts_for_chat_session,
            get_chats_for_concept,
            test_langraph_bridge
        ])
        .setup(|app| {
            // Initialize database connection
            let db_state: DbState = Arc::new(Mutex::new(None));
            app.manage(db_state.clone());

            // Initialize LangGraph bridge state
            let langraph_state: LangGraphState = Arc::new(Mutex::new(None));
            app.manage(langraph_state.clone());

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

            // Initialize LangGraph bridge in async context
            tauri::async_runtime::spawn(async move {
                println!("🚀 STARTING LangGraph bridge initialization...");
                tracing::info!("Starting LangGraph bridge initialization...");
                
                let bridge = LangGraphBridge::new();
                println!("🔧 Created LangGraph bridge, attempting to initialize...");
                
                match bridge.initialize() {
                    Ok(_) => {
                        println!("✅ LangGraph bridge initialized successfully!");
                        tracing::info!("LangGraph bridge initialized successfully");
                        *langraph_state.lock().await = Some(bridge);
                    }
                    Err(e) => {
                        println!("❌ Failed to initialize LangGraph bridge: {}", e);
                        tracing::error!("Failed to initialize LangGraph bridge: {}", e);
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
