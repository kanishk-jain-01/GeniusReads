// Database module - organizes all database operations
pub mod connection;
pub mod documents;
pub mod chat;
pub mod concepts;
pub mod navigation;
pub mod preferences;
pub mod types;

// Re-export the main Database struct and commonly used types
pub use connection::Database;
pub use types::*; 