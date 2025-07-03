use pyo3::prelude::*;
use pyo3::types::{PyDict, PyList};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;
use anyhow::{Result, anyhow};
use tracing::info;

use crate::database::concepts::ConceptForMatching;

/// Represents a concept extracted from chat messages
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtractedConcept {
    pub name: String,
    pub description: String,
    pub tags: Vec<String>,
    pub confidence_score: f64,
    pub related_concepts: Vec<String>,
}

/// Represents the input data for concept extraction
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConceptExtractionInput {
    pub chat_session_id: String,
    pub messages: Vec<ChatMessageForExtraction>,
    pub highlighted_contexts: Vec<HighlightedContextForExtraction>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatMessageForExtraction {
    pub content: String,
    pub sender_type: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HighlightedContextForExtraction {
    pub document_title: String,
    pub page_number: i32,
    pub selected_text: String,
}

/// Represents the result of concept extraction
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConceptExtractionResult {
    pub concepts: Vec<ExtractedConcept>,
    pub processing_time_ms: u64,
    pub total_concepts_found: usize,
    pub success: bool,
    pub error_message: Option<String>,
}

/// Represents the final result after processing and saving concepts
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConceptProcessingResult {
    pub success: bool,
    pub new_concepts_created: usize,
    pub concepts_linked: usize,
    pub error_message: Option<String>,
}

/// LangGraph bridge for concept extraction
pub struct LangGraphBridge {
    python_module_path: String,
}

impl LangGraphBridge {
    /// Create a new LangGraph bridge instance
    pub fn new() -> Self {
        println!("🔨 Creating new LangGraph bridge...");
        
        // Use absolute path to ensure Python module can be found
        // Handle the case where cwd might already be in src-tauri
        let current_dir = std::env::current_dir()
            .unwrap_or_else(|_| std::path::PathBuf::from("."));
        
        let python_path = if current_dir.ends_with("src-tauri") {
            // Already in src-tauri directory
            current_dir.join("python")
        } else {
            // In project root, need to go into src-tauri
            current_dir.join("src-tauri").join("python")
        };
        
        let python_path_str = python_path.to_string_lossy().to_string();
        
        println!("📁 Python module path: {}", python_path_str);
        
        // Log the path for debugging
        tracing::info!("LangGraph bridge using Python path: {}", python_path_str);
        
        Self {
            python_module_path: python_path_str,
        }
    }

    /// Initialize the Python environment and load required modules
    pub fn initialize(&self) -> Result<()> {
        info!("Initializing Python environment for LangGraph");
        info!("Python module path: {}", self.python_module_path);
        
        Python::with_gil(|py| -> Result<()> {
            // Check if the path exists
            let path_exists = std::path::Path::new(&self.python_module_path).exists();
            info!("Python module path exists: {}", path_exists);
            
            // Get current Python executable and version
            let sys = py.import_bound("sys").map_err(|e| anyhow!("Failed to import sys: {}", e))?;
            let executable: String = sys.getattr("executable")
                .map_err(|e| anyhow!("Failed to get sys.executable: {}", e))?
                .extract()
                .map_err(|e| anyhow!("Failed to extract executable: {}", e))?;
            info!("Python executable: {}", executable);
            
            // Add the Python module path to sys.path
            let path: Bound<PyList> = sys.getattr("path")
                .map_err(|e| anyhow!("Failed to get sys.path: {}", e))?
                .downcast_into()
                .map_err(|e| anyhow!("sys.path is not a list: {}", e))?;
            
            // Log current sys.path for debugging
            let current_path: Vec<String> = path.extract()
                .map_err(|e| anyhow!("Failed to extract sys.path: {}", e))?;
            info!("Current sys.path (first 3): {:?}", &current_path[..std::cmp::min(3, current_path.len())]);
            
            path.insert(0, &self.python_module_path)
                .map_err(|e| anyhow!("Failed to add path to sys.path: {}", e))?;
            
            info!("Added {} to sys.path", self.python_module_path);
            
            // Test import of our concept extractor module
            py.import_bound("concept_extractor")?;
            // Also test import of the similarity module
            py.import_bound("concept_similarity")?;
            
            Ok(())
        })
    }

    /// Extract concepts from chat session using LangGraph workflow
    pub fn extract_concepts(&self, input: &ConceptExtractionInput, openai_api_key: &str) -> Result<serde_json::Value> {
        println!("🧠 Starting concept extraction for session: {}", input.chat_session_id);
        
        Python::with_gil(|py| -> Result<serde_json::Value> {
            // Set the OpenAI API key as an environment variable for the Python process
            std::env::set_var("OPENAI_API_KEY", openai_api_key);
            
            // Also set it directly in Python's os.environ to ensure it's available
            let os = py.import_bound("os").map_err(|e| anyhow!("Failed to import os: {}", e))?;
            let environ = os.getattr("environ").map_err(|e| anyhow!("Failed to get os.environ: {}", e))?;
            environ.set_item("OPENAI_API_KEY", openai_api_key)
                .map_err(|e| anyhow!("Failed to set OPENAI_API_KEY in Python environ: {}", e))?;
            
            // Add the Python module path to sys.path
            let sys = py.import_bound("sys").map_err(|e| anyhow!("Failed to import sys: {}", e))?;
            let path_list = sys.getattr("path").map_err(|e| anyhow!("Failed to get sys.path: {}", e))?;
            path_list.call_method1("insert", (0, &self.python_module_path))
                .map_err(|e| anyhow!("Failed to add module path to sys.path: {}", e))?;
            
            // Import the concept_extractor module
            let concept_extractor = py.import_bound("concept_extractor")
                .map_err(|e| anyhow!("Failed to import concept_extractor: {}", e))?;
            
            // Convert input to Python format
            let py_input = pyo3::types::PyDict::new_bound(py);
            py_input.set_item("chat_session_id", &input.chat_session_id)
                .map_err(|e| anyhow!("Failed to set chat_session_id: {}", e))?;
            
            // Convert messages
            let py_messages = pyo3::types::PyList::new_bound(py, input.messages.iter().map(|msg| {
                let py_msg = pyo3::types::PyDict::new_bound(py);
                let _ = py_msg.set_item("content", &msg.content);
                let _ = py_msg.set_item("sender_type", &msg.sender_type);
                let _ = py_msg.set_item("created_at", &msg.created_at);
                py_msg
            }));
            py_input.set_item("messages", py_messages)
                .map_err(|e| anyhow!("Failed to set messages: {}", e))?;
            
            // Convert highlighted contexts
            let py_contexts = pyo3::types::PyList::new_bound(py, input.highlighted_contexts.iter().map(|ctx| {
                let py_ctx = pyo3::types::PyDict::new_bound(py);
                let _ = py_ctx.set_item("document_title", &ctx.document_title);
                let _ = py_ctx.set_item("page_number", ctx.page_number);
                let _ = py_ctx.set_item("selected_text", &ctx.selected_text);
                py_ctx
            }));
            py_input.set_item("highlighted_contexts", py_contexts)
                .map_err(|e| anyhow!("Failed to set highlighted_contexts: {}", e))?;
            
            // Call the main extraction function
            let result = concept_extractor.call_method1("extract_concepts_from_chat", (py_input,))
                .map_err(|e| anyhow!("Failed to call extract_concepts_from_chat: {}", e))?;
            
            // Convert Python result to JSON
            let result_str: String = result.str()
                .map_err(|e| anyhow!("Failed to convert result to string: {}", e))?
                .to_string();
            
            // Parse as JSON
            let json_result: serde_json::Value = serde_json::from_str(&result_str)
                .map_err(|e| anyhow!("Failed to parse result as JSON: {}", e))?;
            
            println!("✅ Concept extraction completed successfully");
            Ok(json_result)
        })
    }

    /// Takes new concepts, compares them with existing ones, and saves them to the database.
    /// This entire operation is handled by the Python script to leverage `pgvector` correctly.
    pub fn process_concepts_and_save(
        &self,
        chat_session_id: &Uuid,
        new_concepts: &[Value],
        existing_concepts: &[ConceptForMatching],
    ) -> Result<ConceptProcessingResult> {
        info!(
            "Processing {} new concepts against {} existing concepts for chat session {}",
            new_concepts.len(),
            existing_concepts.len(),
            chat_session_id
        );

        Python::with_gil(|py| -> Result<ConceptProcessingResult> {
            let concept_processor = py.import_bound("concept_processor")?;

            // Serialize the structs to JSON strings to pass them to Python
            let new_concepts_json = serde_json::to_string(new_concepts)?;
            let existing_concepts_json = serde_json::to_string(existing_concepts)?;

            let py_result = concept_processor.call_method1(
                "process_and_store_concepts",
                (
                    chat_session_id.to_string(),
                    new_concepts_json,
                    existing_concepts_json,
                ),
            )?;

            let result_str: String = py_result.extract()?;
            serde_json::from_str(&result_str)
                .map_err(|e| anyhow!("Failed to deserialize concept processing result: {}", e))
        })
    }

    /// Generate vector embeddings for a list of concept descriptions
    pub fn generate_embeddings(&self, texts: Vec<String>) -> Result<Vec<Vec<f64>>> {
        info!("Generating vector embeddings for {} texts", texts.len());
        
        Python::with_gil(|py| -> Result<Vec<Vec<f64>>> {
            // Import the vector embeddings module
            let vector_embeddings = py.import_bound("vector_embeddings")
                .map_err(|e| anyhow!("Failed to import vector_embeddings: {}", e))?;
            
            // Convert texts to Python list
            let py_texts = PyList::new_bound(py, texts.iter().map(|s| s.as_str()));
            
            // Call the generate_embeddings function
            let generate_function = vector_embeddings.getattr("generate_embeddings")
                .map_err(|e| anyhow!("Failed to get generate_embeddings function: {}", e))?;
            let py_result = generate_function.call1((py_texts,))
                .map_err(|e| anyhow!("Failed to call generate_embeddings: {}", e))?;
            
            // Convert Python result to Rust Vec<Vec<f64>>
            let embeddings: Vec<Vec<f64>> = py_result.extract()
                .map_err(|e| anyhow!("Failed to extract embeddings: {}", e))?;
            
            info!("Generated {} embeddings", embeddings.len());
            Ok(embeddings)
        })
    }

    /// Calculate similarity between two concept embeddings
    pub fn calculate_similarity(&self, embedding1: Vec<f64>, embedding2: Vec<f64>) -> Result<f64> {
        Python::with_gil(|py| -> Result<f64> {
            let vector_embeddings = py.import_bound("vector_embeddings")
                .map_err(|e| anyhow!("Failed to import vector_embeddings: {}", e))?;
            
            // Convert embeddings to Python lists
            let py_emb1 = PyList::new_bound(py, embedding1.iter());
            let py_emb2 = PyList::new_bound(py, embedding2.iter());
            
            // Call the calculate_similarity function
            let similarity_function = vector_embeddings.getattr("calculate_similarity")
                .map_err(|e| anyhow!("Failed to get calculate_similarity function: {}", e))?;
            let py_result = similarity_function.call1((py_emb1, py_emb2))
                .map_err(|e| anyhow!("Failed to call calculate_similarity: {}", e))?;
            
            let similarity: f64 = py_result.extract()
                .map_err(|e| anyhow!("Failed to extract similarity: {}", e))?;
            Ok(similarity)
        })
    }

    /// Convert Rust input to Python dictionary
    fn input_to_python_dict<'py>(&self, py: Python<'py>, input: &ConceptExtractionInput) -> PyResult<Bound<'py, PyDict>> {
        let dict = PyDict::new_bound(py);
        
        // Add chat session ID
        dict.set_item("chat_session_id", input.chat_session_id.to_string())?;
        
        // Add messages
        let messages_list = PyList::empty_bound(py);
        for message in &input.messages {
            let msg_dict = PyDict::new_bound(py);
            msg_dict.set_item("content", &message.content)?;
            msg_dict.set_item("sender_type", &message.sender_type)?;
            msg_dict.set_item("created_at", &message.created_at)?;
            messages_list.append(msg_dict)?;
        }
        dict.set_item("messages", messages_list)?;
        
        // Add highlighted contexts
        let contexts_list = PyList::empty_bound(py);
        for context in &input.highlighted_contexts {
            let ctx_dict = PyDict::new_bound(py);
            ctx_dict.set_item("document_title", &context.document_title)?;
            ctx_dict.set_item("page_number", context.page_number)?;
            ctx_dict.set_item("selected_text", &context.selected_text)?;
            contexts_list.append(ctx_dict)?;
        }
        dict.set_item("highlighted_contexts", contexts_list)?;
        
        Ok(dict)
    }

    /// Convert Python result to Rust struct
    fn python_result_to_rust(&self, py_result: &Bound<PyAny>) -> PyResult<ConceptExtractionResult> {
        let result_dict: Bound<PyDict> = py_result.clone().downcast_into()?;
        
        // Extract success status
        let success: bool = result_dict.get_item("success")?.unwrap().extract()?;
        
        if !success {
            let error_message: Option<String> = result_dict
                .get_item("error_message")?
                .map(|v| v.extract())
                .transpose()?;
            
            return Ok(ConceptExtractionResult {
                concepts: vec![],
                processing_time_ms: 0,
                total_concepts_found: 0,
                success: false,
                error_message,
            });
        }
        
        // Extract concepts
        let concepts_item = result_dict.get_item("concepts")?.unwrap();
        let concepts_list: Bound<PyList> = concepts_item.downcast_into()?;
        let mut concepts = Vec::new();
        
        for concept_item in concepts_list.iter() {
            let concept_dict: Bound<PyDict> = concept_item.downcast_into()?;
            
            let concept = ExtractedConcept {
                name: concept_dict.get_item("name")?.unwrap().extract()?,
                description: concept_dict.get_item("description")?.unwrap().extract()?,
                tags: concept_dict.get_item("tags")?.unwrap().extract()?,
                confidence_score: concept_dict.get_item("confidence_score")?.unwrap().extract()?,
                related_concepts: concept_dict.get_item("related_concepts")?.unwrap().extract()?,
            };
            
            concepts.push(concept);
        }
        
        Ok(ConceptExtractionResult {
            total_concepts_found: concepts.len(),
            concepts,
            processing_time_ms: 0, // Will be set by caller
            success: true,
            error_message: None,
        })
    }
}

impl Default for LangGraphBridge {
    fn default() -> Self {
        Self::new()
    }
}

/// Initialize the LangGraph bridge - called once at startup
pub fn initialize_langraph() -> Result<()> {
    let bridge = LangGraphBridge::new();
    bridge.initialize()
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    #[test]
    fn test_langraph_bridge_creation() {
        let bridge = LangGraphBridge::new();
        assert_eq!(bridge.python_module_path, "src-tauri/python");
    }

    #[test]
    fn test_concept_extraction_input_serialization() {
        let input = ConceptExtractionInput {
            chat_session_id: Uuid::new_v4().to_string(),
            messages: vec![
                ChatMessageForExtraction {
                    content: "What is machine learning?".to_string(),
                    sender_type: "user".to_string(),
                    created_at: "2024-01-01T00:00:00Z".to_string(),
                },
            ],
            highlighted_contexts: vec![
                HighlightedContextForExtraction {
                    document_title: "AI Textbook".to_string(),
                    page_number: 1,
                    selected_text: "Machine learning is a subset of AI".to_string(),
                },
            ],
        };

        let json = serde_json::to_string(&input).unwrap();
        assert!(json.contains("machine learning"));
    }
} 