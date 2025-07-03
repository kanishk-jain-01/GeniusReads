// App info and system commands
use serde_json;

// Simple test command to verify Tauri-React communication
#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {name}! Tauri-React communication is working.")
}

// Test command for application info
#[tauri::command]
pub fn get_app_info() -> serde_json::Value {
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
pub fn get_system_info() -> serde_json::Value {
    serde_json::json!({
        "platform": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "rust_version": "stable",
        "tauri_working": true
    })
} 