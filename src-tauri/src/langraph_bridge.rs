use pyo3::prelude::*;
use pyo3::types::{PyDict, PyList};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use anyhow::{Result, anyhow};
use tracing::{info, error};

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
    pub chat_session_id: Uuid,
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

/// LangGraph bridge for concept extraction
pub struct LangGraphBridge {
    python_module_path: String,
}

impl LangGraphBridge {
    /// Create a new LangGraph bridge instance
    pub fn new() -> Self {
        Self {
            python_module_path: "src-tauri/python".to_string(),
        }
    }

    /// Initialize the Python environment and load required modules
    pub fn initialize(&self) -> Result<()> {
        info!("Initializing Python environment for LangGraph");
        
        Python::with_gil(|py| -> Result<()> {
            // Add the Python module path to sys.path
            let sys = py.import_bound("sys").map_err(|e| anyhow!("Failed to import sys: {}", e))?;
            let path: Bound<PyList> = sys.getattr("path")
                .map_err(|e| anyhow!("Failed to get sys.path: {}", e))?
                .downcast_into()
                .map_err(|e| anyhow!("sys.path is not a list: {}", e))?;
            
            path.insert(0, &self.python_module_path)
                .map_err(|e| anyhow!("Failed to add path to sys.path: {}", e))?;
            
            // Test import of our concept extractor module
            match py.import_bound("concept_extractor") {
                Ok(_) => {
                    info!("Successfully loaded concept_extractor module");
                    Ok(())
                }
                Err(e) => {
                    error!("Failed to load concept_extractor module: {}", e);
                    Err(anyhow!("Failed to load Python concept extractor: {}", e))
                }
            }
        })
    }

    /// Extract concepts from chat session data using LangGraph
    pub fn extract_concepts(&self, input: ConceptExtractionInput) -> Result<ConceptExtractionResult> {
        info!("Starting concept extraction for chat session: {}", input.chat_session_id);
        
        let start_time = std::time::Instant::now();
        
        let result = Python::with_gil(|py| -> Result<ConceptExtractionResult> {
            // Import the concept extractor module
            let concept_extractor = py.import_bound("concept_extractor")
                .map_err(|e| anyhow!("Failed to import concept_extractor: {}", e))?;
            
            // Convert input data to Python dictionary
            let input_dict = self.input_to_python_dict(py, &input)
                .map_err(|e| anyhow!("Failed to convert input to Python dict: {}", e))?;
            
            // Call the extract_concepts function
            let extract_function = concept_extractor.getattr("extract_concepts")
                .map_err(|e| anyhow!("Failed to get extract_concepts function: {}", e))?;
            let py_result = extract_function.call1((input_dict,))
                .map_err(|e| anyhow!("Failed to call extract_concepts: {}", e))?;
            
            // Convert Python result back to Rust
            self.python_result_to_rust(&py_result)
                .map_err(|e| anyhow!("Failed to convert Python result: {}", e))
        });

        match result {
            Ok(mut extraction_result) => {
                extraction_result.processing_time_ms = start_time.elapsed().as_millis() as u64;
                info!(
                    "Concept extraction completed successfully. Found {} concepts in {}ms",
                    extraction_result.total_concepts_found,
                    extraction_result.processing_time_ms
                );
                Ok(extraction_result)
            }
            Err(e) => {
                error!("Concept extraction failed: {}", e);
                Ok(ConceptExtractionResult {
                    concepts: vec![],
                    processing_time_ms: start_time.elapsed().as_millis() as u64,
                    total_concepts_found: 0,
                    success: false,
                    error_message: Some(format!("Extraction failed: {}", e)),
                })
            }
        }
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
            chat_session_id: Uuid::new_v4(),
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