// Database data structures
use anyhow::Result;
use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, serde::Serialize)]
pub struct DatabaseStats {
    pub document_count: u32,
    pub question_count: u32,
    pub response_count: u32,
    pub knowledge_count: u32,
    pub note_count: u32,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct Document {
    pub id: Uuid,
    pub title: String,
    pub author: Option<String>,
    pub file_path: String,
    pub file_name: String,
    pub file_size: i64,
    pub total_pages: i32,
    pub current_page: i32,
    pub zoom_level: i32,
    pub last_accessed: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub metadata: Value,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct TextSelection {
    pub id: Uuid,
    pub document_id: Uuid,
    pub page_number: i32,
    pub selected_text: String,
    pub start_coordinate: Value,
    pub end_coordinate: Value,
    pub bounding_boxes: Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct Question {
    pub id: Uuid,
    pub document_id: Uuid,
    pub selection_id: Uuid,
    pub question_text: String,
    pub context: String,
    pub page_number: i32,
    pub asked_at: DateTime<Utc>,
    pub status: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct KnowledgeEntry {
    pub id: Uuid,
    pub document_id: Uuid,
    pub concept: String,
    pub definition: String,
    pub explanation: String,
    pub context: String,
    pub page_number: i32,
    pub tags: Option<Vec<String>>,
    pub related_concepts: Option<Vec<String>>,
    pub source: String,
    pub confidence: Option<BigDecimal>,
    pub review_count: i32,
    pub last_reviewed: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ChatSession {
    pub id: Uuid,
    pub title: String,
    pub preview_text: Option<String>,
    pub source_document_count: i32,
    pub analysis_status: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ChatMessage {
    pub id: Uuid,
    pub chat_session_id: Uuid,
    pub content: String,
    pub sender_type: String,
    pub created_at: DateTime<Utc>,
    pub metadata: Value,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct HighlightedContext {
    pub id: Uuid,
    pub chat_session_id: Uuid,
    pub document_id: Uuid,
    pub document_title: String,
    pub page_number: i32,
    pub selected_text: String,
    pub text_coordinates: Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct UserSessionState {
    pub id: Uuid,
    pub singleton_key: bool,
    pub current_document_id: Option<Uuid>,
    pub current_page: i32,
    pub zoom_level: i32,
    pub scroll_position: i32,
    pub active_tab: String,
    pub active_chat_id: Option<Uuid>,
    pub last_reading_position: Option<Value>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct UserPreferences {
    pub id: Uuid,
    pub singleton_key: bool,
    pub openai_api_key: Option<String>,
    pub theme: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ChatSessionForAnalysis {
    pub id: Uuid,
    pub title: String,
    pub messages: Vec<ChatMessage>,
    pub highlighted_contexts: Vec<HighlightedContext>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ExtractedConcept {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub tags: Vec<String>,
    pub confidence_score: f64,
    pub source_chat_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
} 