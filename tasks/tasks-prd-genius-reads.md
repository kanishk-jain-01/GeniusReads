# Task List: GeniusReads

## Relevant Files

- `src-tauri/src/main.rs` - Main Tauri application entry point and window configuration
- `src-tauri/src/python_bridge.rs` - Python-Rust interoperability layer using pyo3 for LangGraph integration
- `src-tauri/src/database.rs` - PostgreSQL database connection and query handling
- `src-tauri/src/pdf_handler.rs` - PDF file operations and metadata extraction
- `src-tauri/src/knowledge_store.rs` - Knowledge corpus management and search functionality
- `src-tauri/Cargo.toml` - Rust dependencies including pyo3, tauri, sqlx/diesel
- `src-tauri/tauri.conf.json` - Tauri configuration for macOS app settings and capabilities
- `src/App.tsx` - Main React application component with layout structure
- `src/components/PDFViewer.tsx` - PDF display component using PDF.js
- `src/components/TextSelection.tsx` - Text selection and highlighting overlay system
- `src/components/QuestionInput.tsx` - AI question input interface component
- `src/components/KnowledgeSidebar.tsx` - Collapsible knowledge corpus display
- `src/components/ResponseStream.tsx` - Streaming AI response display component
- `src/components/NotesPanel.tsx` - Note-taking interface and management
- `src/hooks/useTextSelection.ts` - Custom hook for text selection state management
- `src/hooks/useAIStream.ts` - Custom hook for streaming AI responses
- `src/hooks/useKnowledgeStore.ts` - Custom hook for knowledge corpus operations
- `src/lib/api.ts` - Tauri command invocations from frontend
- `src/lib/types.ts` - TypeScript type definitions for the application
- `python/ai_agent.py` - LangGraph AI agent implementation with OpenAI integration
- `python/knowledge_processor.py` - Knowledge extraction and processing logic
- `python/requirements.txt` - Python dependencies for embedded environment
- `migrations/001_initial_schema.sql` - PostgreSQL database schema setup
- `package.json` - Frontend dependencies including React, Vite, TailwindCSS
- `vite.config.ts` - Vite configuration for React development

### Notes

- The embedded Python environment requires careful dependency management through pyo3
- PostgreSQL must be installed and configured locally before running the application
- PDF.js integration requires proper CORS and security configurations in Tauri
- Test files should be created alongside components following React testing best practices

## Tasks

- [ ] 1.0 Set up Tauri Desktop Application Foundation
  - [ ] 1.1 Initialize new Tauri project with React frontend template
  - [ ] 1.2 Configure Cargo.toml with required dependencies (pyo3, sqlx, serde, tokio)
  - [ ] 1.3 Set up tauri.conf.json for macOS-specific settings and file system permissions
  - [ ] 1.4 Configure Vite build system with React, TypeScript, and TailwindCSS
  - [ ] 1.5 Install and configure shadcn/ui component library
  - [ ] 1.6 Set up basic window layout with main content area and collapsible sidebar
  - [ ] 1.7 Create initial TypeScript type definitions for app-wide data structures
  - [ ] 1.8 Test basic Tauri-React communication with a simple command

- [ ] 2.0 Implement PDF Viewing and Navigation System
  - [ ] 2.1 Install and configure PDF.js for React integration
  - [ ] 2.2 Create PDFViewer component with basic document display
  - [ ] 2.3 Implement file picker dialog for opening PDF files from filesystem
  - [ ] 2.4 Add PDF navigation controls (previous/next page, page input, zoom)
  - [ ] 2.5 Create Tauri command to handle PDF file reading and metadata extraction
  - [ ] 2.6 Implement document state management (current page, zoom level, file path)
  - [ ] 2.7 Add error handling for invalid PDFs and file access issues
  - [ ] 2.8 Implement "remember last document" functionality with local storage

- [ ] 3.0 Build Text Selection and Highlighting System
  - [ ] 3.1 Create text selection overlay system for PDF content
  - [ ] 3.2 Implement click-and-drag text highlighting functionality
  - [ ] 3.3 Add visual feedback for selected text with highlighting styles
  - [ ] 3.4 Create TextSelection component to manage selection state
  - [ ] 3.5 Implement text extraction from PDF.js selection coordinates
  - [ ] 3.6 Add selection clearing when navigating pages or opening new documents
  - [ ] 3.7 Create QuestionInput component that appears when text is selected
  - [ ] 3.8 Handle edge cases for text selection across page boundaries

- [ ] 4.0 Integrate AI Processing with LangGraph and Python
  - [ ] 4.1 Set up Python environment with pyo3 bridge in Rust backend
  - [ ] 4.2 Create Python requirements.txt with LangGraph, LangChain, and OpenAI dependencies
  - [ ] 4.3 Implement ai_agent.py with LangGraph workflow for processing questions
  - [ ] 4.4 Create knowledge_processor.py for extracting definitions and concepts
  - [ ] 4.5 Build Rust-Python bridge functions for AI communication
  - [ ] 4.6 Implement streaming response system for real-time AI feedback
  - [ ] 4.7 Add error handling for AI service failures and API limits
  - [ ] 4.8 Configure "Explain like I'm 5" tone in AI agent prompts
  - [ ] 4.9 Test AI integration with sample PDF text and questions

- [ ] 5.0 Develop Knowledge Corpus and Local Storage
  - [ ] 5.1 Set up local PostgreSQL database connection with sqlx
  - [ ] 5.2 Create database migration for initial schema (documents, questions, answers, definitions)
  - [ ] 5.3 Implement database.rs with connection pooling and query functions
  - [ ] 5.4 Create knowledge_store.rs for managing Q&A pairs and definitions
  - [ ] 5.5 Build automatic knowledge extraction from AI responses
  - [ ] 5.6 Implement search functionality for saved knowledge
  - [ ] 5.7 Add data persistence for document metadata and user sessions
  - [ ] 5.8 Create knowledge organization by document, date, and concept tags
  - [ ] 5.9 Test database operations and data integrity

- [ ] 6.0 Create Note-Taking and Knowledge Management Interface
  - [ ] 6.1 Build KnowledgeSidebar component with collapsible design
  - [ ] 6.2 Create ResponseStream component for displaying AI answers
  - [ ] 6.3 Implement NotesPanel for personal note-taking on selected text
  - [ ] 6.4 Add note indicators on PDF passages with associated notes
  - [ ] 6.5 Build detailed knowledge view in expandable panel or separate tab
  - [ ] 6.6 Implement note editing and deletion functionality
  - [ ] 6.7 Create search interface for knowledge corpus
  - [ ] 6.8 Add visual hierarchy for AI explanations, definitions, and user notes
  - [ ] 6.9 Test complete user workflow from PDF reading to knowledge management 