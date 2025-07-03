// LangGraph concept extraction commands
use crate::state::{DbState, LangGraphState};
use crate::langraph_bridge::{ConceptExtractionInput, ChatMessageForExtraction, HighlightedContextForExtraction};
use serde_json;

#[tauri::command]
pub async fn analyze_chat_session(
    chat_session_id: String,
    db: tauri::State<'_, DbState>,
    langraph: tauri::State<'_, LangGraphState>,
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
        
        // Perform concept extraction using LangGraph
        let extraction_input = ConceptExtractionInput {
            chat_session_id: chat_session_id.clone(),
            messages: chat_session.messages.into_iter().map(|msg| ChatMessageForExtraction {
                content: msg.content,
                sender_type: msg.sender_type,
                created_at: msg.created_at.to_rfc3339(),
            }).collect(),
            highlighted_contexts: chat_session.highlighted_contexts.into_iter().map(|ctx| HighlightedContextForExtraction {
                document_title: ctx.document_title,
                page_number: ctx.page_number,
                selected_text: ctx.selected_text,
            }).collect(),
        };
        
        // Get OpenAI API key from user preferences
        let preferences = database.get_user_preferences().await
            .map_err(|e| format!("Failed to get user preferences: {}", e))?;
        
        let openai_api_key = preferences
            .and_then(|prefs| prefs.get("openai_api_key").and_then(|key| key.as_str().map(|s| s.to_string())))
            .ok_or_else(|| "OpenAI API key not configured. Please set your API key in Preferences.".to_string())?;
        
        // Perform concept extraction
        let langraph_guard = langraph.lock().await;
        let bridge = langraph_guard.as_ref()
            .ok_or_else(|| "LangGraph bridge not initialized. Please restart the application.".to_string())?;
        
        let extraction_result = bridge.extract_concepts(&extraction_input, &openai_api_key)
            .map_err(|e| format!("Concept extraction failed: {}", e))?;
        
        // Check if extraction was successful
        let success = extraction_result.get("success")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
            
        if success {
            // Get the concepts array
            let empty_vec = vec![];
            let concepts = extraction_result.get("concepts")
                .and_then(|v| v.as_array())
                .unwrap_or(&empty_vec);
            
            // Save concepts to database
            for concept in concepts {
                if let (Some(name), Some(description)) = (
                    concept.get("name").and_then(|v| v.as_str()),
                    concept.get("description").and_then(|v| v.as_str())
                ) {
                    let confidence_score = concept.get("confidence_score")
                        .and_then(|v| v.as_f64())
                        .unwrap_or(0.5);
                    
                    let tags: Vec<String> = concept.get("tags")
                        .and_then(|v| v.as_array())
                        .map(|arr| arr.iter()
                            .filter_map(|tag| tag.as_str().map(|s| s.to_string()))
                            .collect())
                        .unwrap_or_default();
                    
                    let related_concepts: Vec<String> = concept.get("related_concepts")
                        .and_then(|v| v.as_array())
                        .map(|arr| arr.iter()
                            .filter_map(|rel| rel.as_str().map(|s| s.to_string()))
                            .collect())
                        .unwrap_or_default();
                    
                    // Save concept to database
                    match database.store_extracted_concept(
                        session_id,
                        name,
                        description,
                        &tags,
                        confidence_score,
                        &related_concepts
                    ).await {
                        Ok(_) => {
                            println!("✅ Saved concept: {}", name);
                        }
                        Err(e) => {
                            println!("❌ Failed to save concept {}: {}", name, e);
                        }
                    }
                }
            }
            
            // Update analysis status to 'completed'
            database.update_chat_analysis_status(session_id, "completed").await
                .map_err(|e| format!("Failed to update analysis status: {}", e))?;
            
            Ok(serde_json::json!({
                "success": true,
                "message": "Analysis completed successfully",
                "concepts_found": concepts.len()
            }))
        } else {
            // Update analysis status to 'failed'
            database.update_chat_analysis_status(session_id, "failed").await
                .map_err(|e| format!("Failed to update analysis status: {}", e))?;
            
            let error_message = extraction_result.get("error_message")
                .and_then(|v| v.as_str())
                .unwrap_or("Unknown error during concept extraction");
            
            Err(format!("Concept extraction failed: {}", error_message))
        }
    } else {
        Err("Database not initialized".to_string())
    }
}

// Test command for LangGraph bridge status
#[tauri::command]
pub async fn test_langraph_bridge(
    langraph: tauri::State<'_, LangGraphState>,
) -> Result<serde_json::Value, String> {
    let langraph_guard = langraph.lock().await;
    
    match langraph_guard.as_ref() {
        Some(_bridge) => {
            Ok(serde_json::json!({
                "status": "initialized",
                "message": "LangGraph bridge is available and ready"
            }))
        }
        None => {
            Ok(serde_json::json!({
                "status": "not_initialized",
                "message": "LangGraph bridge is not initialized"
            }))
        }
    }
} 