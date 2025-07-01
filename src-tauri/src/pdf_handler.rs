use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct PDFMetadata {
    pub title: Option<String>,
    pub author: Option<String>,
    pub subject: Option<String>,
    pub keywords: Option<Vec<String>>,
    pub creation_date: Option<String>,
    pub modification_date: Option<String>,
    pub producer: Option<String>,
    pub page_count: u32,
    pub file_size: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PDFDocument {
    pub id: String,
    pub title: String,
    pub file_path: String,
    pub file_name: String,
    pub file_size: u64,
    pub total_pages: u32,
    pub metadata: PDFMetadata,
}

pub struct PDFHandler;

impl PDFHandler {
    /// Validate if a file is a valid PDF
    pub fn validate_pdf(file_path: &str) -> Result<bool> {
        let path = Path::new(file_path);
        
        // Check if file exists
        if !path.exists() {
            return Err(anyhow!("File does not exist: {}", file_path));
        }
        
        // Check file extension
        if let Some(extension) = path.extension() {
            if extension.to_str().unwrap_or("").to_lowercase() != "pdf" {
                return Err(anyhow!("File is not a PDF: {}", file_path));
            }
        } else {
            return Err(anyhow!("File has no extension: {}", file_path));
        }
        
        // Read first few bytes to check PDF signature
        let mut file_content = vec![0u8; 8];
        match fs::File::open(path) {
            Ok(mut file) => {
                use std::io::Read;
                if let Err(e) = file.read_exact(&mut file_content) {
                    return Err(anyhow!("Failed to read PDF header: {}", e));
                }
                
                // Check for PDF signature (%PDF-)
                if file_content.starts_with(b"%PDF-") {
                    Ok(true)
                } else {
                    Err(anyhow!("Invalid PDF file format"))
                }
            }
            Err(e) => Err(anyhow!("Failed to open file: {}", e)),
        }
    }
    
    /// Extract basic metadata from PDF file
    pub fn extract_metadata(file_path: &str) -> Result<PDFMetadata> {
        // Validate the PDF first
        Self::validate_pdf(file_path)?;
        
        let path = Path::new(file_path);
        let file_size = fs::metadata(path)?.len();
        
        // For now, we'll extract basic information
        // In a full implementation, you'd use a PDF parsing library like pdf-extract or lopdf
        // For MVP, we'll extract what we can from the file system and provide defaults
        
        let file_name = path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("Unknown")
            .to_string();
        
        // Basic metadata extraction (this would be enhanced with a proper PDF library)
        let metadata = PDFMetadata {
            title: Some(file_name.clone()),
            author: None,
            subject: None,
            keywords: None,
            creation_date: None,
            modification_date: None,
            producer: None,
            page_count: 1, // Default to 1, will be updated by PDF.js frontend
            file_size,
        };
        
        Ok(metadata)
    }
    
    /// Create a PDF document record
    pub fn create_document(file_path: &str) -> Result<PDFDocument> {
        let metadata = Self::extract_metadata(file_path)?;
        let path = Path::new(file_path);
        
        let file_name = path
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("unknown.pdf")
            .to_string();
        
        let title = metadata.title.clone().unwrap_or_else(|| {
            path.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Unknown Document")
                .to_string()
        });
        
        let document = PDFDocument {
            id: Uuid::new_v4().to_string(),
            title,
            file_path: file_path.to_string(),
            file_name,
            file_size: metadata.file_size,
            total_pages: metadata.page_count,
            metadata,
        };
        
        Ok(document)
    }
    
    /// Check if file is accessible and readable
    pub fn check_file_access(file_path: &str) -> Result<bool> {
        let path = Path::new(file_path);
        
        if !path.exists() {
            return Err(anyhow!("File does not exist"));
        }
        
        // Check if we can read the file
        match fs::File::open(path) {
            Ok(_) => Ok(true),
            Err(e) => Err(anyhow!("Cannot access file: {}", e)),
        }
    }
    
    /// Get file size in bytes
    pub fn get_file_size(file_path: &str) -> Result<u64> {
        let path = Path::new(file_path);
        let metadata = fs::metadata(path)?;
        Ok(metadata.len())
    }
    
    /// Sanitize file path for security
    pub fn sanitize_file_path(file_path: &str) -> Result<String> {
        let path = Path::new(file_path);
        
        // Convert to canonical path to resolve any .. or . components
        match path.canonicalize() {
            Ok(canonical_path) => {
                // Ensure it's still a PDF file
                if let Some(extension) = canonical_path.extension() {
                    if extension.to_str().unwrap_or("").to_lowercase() == "pdf" {
                        Ok(canonical_path.to_string_lossy().to_string())
                    } else {
                        Err(anyhow!("File is not a PDF"))
                    }
                } else {
                    Err(anyhow!("File has no extension"))
                }
            }
            Err(e) => Err(anyhow!("Invalid file path: {}", e)),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use std::io::Write;
    use tempfile::tempdir;
    
    #[test]
    fn test_pdf_validation() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test.pdf");
        
        // Create a fake PDF file with proper header
        let mut file = File::create(&file_path).unwrap();
        file.write_all(b"%PDF-1.4\n").unwrap();
        
        let result = PDFHandler::validate_pdf(file_path.to_str().unwrap());
        assert!(result.is_ok());
    }
    
    #[test]
    fn test_invalid_pdf() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test.txt");
        
        // Create a non-PDF file
        let mut file = File::create(&file_path).unwrap();
        file.write_all(b"This is not a PDF").unwrap();
        
        let result = PDFHandler::validate_pdf(file_path.to_str().unwrap());
        assert!(result.is_err());
    }
} 