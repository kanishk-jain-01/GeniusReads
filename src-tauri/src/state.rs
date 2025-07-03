// Application state management
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::database::Database;
use crate::langraph_bridge::LangGraphBridge;

// Global database instance
pub type DbState = Arc<Mutex<Option<Database>>>;

// Global LangGraph bridge instance
pub type LangGraphState = Arc<Mutex<Option<LangGraphBridge>>>; 