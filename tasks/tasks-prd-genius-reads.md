# Task List: GeniusReads

## Relevant Files

### Backend Files (Rust/Tauri)
- `src-tauri/src/main.rs` - Main Tauri application entry point and window configuration (✅ Created)
- `src-tauri/src/lib.rs` - Tauri command handlers including chat session management and LangGraph integration (✅ Created, needs updates)
- `src-tauri/src/database.rs` - PostgreSQL database connection and query handling with pgvector support (✅ Created, needs schema updates)
- `src-tauri/src/pdf_handler.rs` - PDF file operations and metadata extraction (✅ Created)
- `src-tauri/src/chat_manager.rs` - Chat session management, active chat state, and message handling
- `src-tauri/src/langraph_bridge.rs` - Python-Rust interoperability layer using pyo3 for LangGraph concept extraction
- `src-tauri/src/concept_extractor.rs` - Concept extraction workflow and vector embedding management
- `src-tauri/Cargo.toml` - Rust dependencies including pyo3, tauri, sqlx, tokio, and pgvector support (✅ Configured, needs pgvector)
- `src-tauri/tauri.conf.json` - Tauri configuration for macOS app settings and file system permissions (✅ Configured)
- `src-tauri/rustfmt.toml` - Rust code formatting configuration (✅ Created)

### Frontend Core Files (✅ Three-Tab Architecture Ready)
- `src/App.tsx` - Main React application with three-tab navigation (Library, Chat, Knowledge) (✅ Created, needs chat tab)
- `src/main.tsx` - React application entry point (✅ Created)
- `src/index.css` - Global styles with TailwindCSS directives (✅ Updated)
- `src/App.css` - Additional component styles (✅ Updated)
- `src/vite-env.d.ts` - Vite TypeScript environment definitions (✅ Created)

### Pages (✅ Three-Tab Structure)
- `src/pages/Dashboard.tsx` - Main application with Library tab (PDF reading) (✅ Created, needs CMD+K integration)
- `src/pages/ChatInterface.tsx` - Chat tab with conversation list and active chat interface
- `src/pages/KnowledgeBase.tsx` - Knowledge tab with concept cards and detailed concept pages (✅ Created, needs updates)

### shadcn/ui Components (✅ Complete Library Integrated)
- `src/components/ui/` - Complete shadcn/ui component library (40+ components)

### Custom Hooks (✅ Partially Created, needs chat-specific hooks)
- `src/hooks/use-mobile.tsx` - Mobile device detection hook (✅ Created)
- `src/hooks/use-toast.ts` - Toast notification management hook (✅ Created)
- `src/hooks/use-chat-session.ts` - Active chat session management hook
- `src/hooks/use-navigation-state.ts` - Tab navigation and reading position state management
- `src/hooks/use-keyboard-shortcuts.ts` - CMD+K and CMD+L keyboard shortcut handling

### Utilities and Libraries (✅ Created, needs chat API functions)
- `src/lib/utils.ts` - Utility functions for className merging and common operations (✅ Created)
- `src/lib/api.ts` - Tauri command invocations with chat session and concept extraction commands (✅ Created, needs updates)
- `src/lib/types.ts` - TypeScript type definitions for chat sessions, concepts, and navigation state (✅ Created, needs updates)

### Feature Components (✅ PDF Ready, needs chat components)
- `src/components/PDFViewer.tsx` - PDF display component with text selection and CMD+K integration (✅ Created, needs CMD+K)
- `src/components/ChatList.tsx` - Paginated list of chat sessions with preview cards
- `src/components/ActiveChat.tsx` - ChatGPT-style conversation interface with streaming responses
- `src/components/HighlightedContext.tsx` - Display component for highlighted text contexts in chat
- `src/components/ConceptCard.tsx` - Concept display cards for Knowledge tab
- `src/components/ConceptDetail.tsx` - Detailed concept page showing source chats and book sections
- `src/components/ProcessingIndicator.tsx` - LangGraph processing status and progress display

### Python/AI Files (To Be Created)
- `src-tauri/python/concept_extractor.py` - LangGraph workflow for automated concept extraction from chat sessions
- `src-tauri/python/vector_embeddings.py` - Vector embedding generation and similarity calculation
- `src-tauri/python/requirements.txt` - Python dependencies for embedded environment (LangGraph, OpenAI, sentence-transformers)

### Database Files (✅ Created, needs schema updates)
- `migrations/001_initial_schema.sql` - PostgreSQL database schema setup (✅ Created, needs chat-focused updates)
- `migrations/002_chat_system.sql` - Chat sessions, messages, and active chat schema
- `migrations/003_concepts_vector.sql` - Concepts table with pgvector extension and vector embeddings

### Configuration Files (✅ Fully Configured)
- `package.json` - Frontend dependencies with React 18, shadcn/ui components (✅ Updated)
- `vite.config.ts` - Vite configuration with SWC plugin for performance (✅ Created)
- `tailwind.config.js` - TailwindCSS v3 configuration with shadcn/ui design system (✅ Created)
- `postcss.config.js` - PostCSS configuration for TailwindCSS processing (✅ Created)
- `index.html` - Main HTML entry point for the React application (✅ Created)
- `tsconfig.json` - TypeScript configuration for the project (✅ Created)
- `tsconfig.node.json` - TypeScript configuration for Node.js tools (✅ Created)
- `eslint.config.js` - ESLint configuration for code quality rules (✅ Created)

### Notes

- **Three-Tab Architecture**: Library (PDF reading) → Chat (AI conversations) → Knowledge (concept browsing)
- **Database-First**: All application state stored in PostgreSQL, no caching layer for simplicity
- **CMD+K Integration**: Text selection in Library tab triggers navigation to Chat tab with context
- **CMD+L Toggle**: Switch between Library and Chat tabs while preserving state
- **Single Active Chat**: One active chat accumulates highlighted contexts from multiple documents
- **LangGraph Processing**: Background concept extraction triggered by user choice, not automatic
- **Vector Search**: pgvector extension for semantic concept similarity and search

## Tasks

- [x] 1.0 Set up Tauri Desktop Application Foundation ✅ **COMPLETE**
  - [x] 1.1 Initialize new Tauri project with React frontend template
  - [x] 1.2 Configure Cargo.toml with required dependencies (pyo3, sqlx, serde, tokio)
  - [x] 1.3 Set up tauri.conf.json for macOS-specific settings and file system permissions
  - [x] 1.4 Configure Vite build system with React, TypeScript, and TailwindCSS
  - [x] 1.5 Install and configure shadcn/ui component library (Complete library with 40+ components)
  - [x] 1.6 Set up basic three-tab layout with Library, Chat, and Knowledge sections
  - [x] 1.7 Create initial TypeScript type definitions for chat sessions, concepts, and navigation state
  - [x] 1.8 Test basic Tauri-React communication with simple commands
  - [x] 1.9 Set up local PostgreSQL database connection and initial schema
  - [x] 1.10 Set up ESLint and Prettier for code quality and formatting
  - [x] 1.11 Set up Rust formatting and linting (rustfmt, clippy)

- [x] 2.0 Implement PDF Viewing and Navigation System ✅ **COMPLETE**
  - [x] 2.1 Install and configure PDF.js for React integration
  - [x] 2.2 Create PDFViewer component with document display and navigation
  - [x] 2.3 Implement file picker dialog for opening PDF files (Native macOS dialog)
  - [x] 2.4 Add PDF navigation controls (previous/next page, page input, zoom)
  - [x] 2.5 Create Tauri command for PDF file reading and metadata extraction
  - [x] 2.6 Implement document state management with database persistence
  - [x] 2.7 Add comprehensive error handling for PDF operations
  - [x] 2.8 Implement document state persistence across app sessions

- [ ] 3.0 Build Text Selection and Chat Navigation System
  - [ ] 3.1 Implement text selection overlay system for PDF content
  - [ ] 3.2 Add CMD+K keyboard shortcut for text selection → Chat navigation
  - [ ] 3.3 Create navigation state management for seamless tab switching
  - [ ] 3.4 Implement CMD+L toggle between Library and Chat tabs
  - [ ] 3.5 Add highlighted text context transfer to Chat tab
  - [ ] 3.6 Create user session state persistence in database
  - [ ] 3.7 Add visual indicators for active chat state in Library tab
  - [ ] 3.8 Implement reading position preservation across navigation

- [ ] 4.0 Develop Chat Interface and Session Management
  - [ ] 4.1 Create ChatInterface page with two-state design (list and active chat)
  - [ ] 4.2 Implement ChatList component with paginated conversation cards
  - [ ] 4.3 Build ActiveChat component with ChatGPT-style message bubbles
  - [ ] 4.4 Add streaming AI response system with real-time updates
  - [ ] 4.5 Create HighlightedContext component for displaying selected text
  - [ ] 4.6 Implement active chat session management (single active chat)
  - [ ] 4.7 Add chat session storage and retrieval from database
  - [ ] 4.8 Create chat action buttons (Save/Save+Analyze/Delete)
  - [ ] 4.9 Implement auto-save for active chat drafts

- [ ] 5.0 Integrate AI Processing and OpenAI Chat
  - [ ] 5.1 Set up OpenAI API integration for chat conversations
  - [ ] 5.2 Implement streaming chat responses with proper error handling
  - [ ] 5.3 Create chat message storage and retrieval system
  - [ ] 5.4 Add highlighted text context integration with AI conversations
  - [ ] 5.5 Implement conversation history and message threading
  - [ ] 5.6 Add support for multiple highlighted contexts in single chat
  - [ ] 5.7 Create chat session completion and action handling
  - [ ] 5.8 Test complete chat workflow from text selection to conversation

- [ ] 6.0 Implement LangGraph Concept Extraction System
  - [ ] 6.1 Set up Python environment with pyo3 bridge for LangGraph
  - [ ] 6.2 Install pgvector extension for PostgreSQL vector storage
  - [ ] 6.3 Create concept_extractor.py with LangGraph workflow implementation
  - [ ] 6.4 Implement vector embedding generation for concepts
  - [ ] 6.5 Build concept similarity matching and merging logic
  - [ ] 6.6 Create background processing system for concept extraction
  - [ ] 6.7 Add processing status tracking and progress indicators
  - [ ] 6.8 Implement concept storage with vector embeddings
  - [ ] 6.9 Create concept-chat linking system with relevance scores

- [ ] 7.0 Build Knowledge Base Interface and Concept Management
  - [ ] 7.1 Update KnowledgeBase page with concept card display
  - [ ] 7.2 Create ConceptCard component with concept preview information
  - [ ] 7.3 Implement ConceptDetail page showing source chats and book sections
  - [ ] 7.4 Add concept search and filtering functionality
  - [ ] 7.5 Create processing status indicators for LangGraph analysis
  - [ ] 7.6 Implement concept categorization and organization
  - [ ] 7.7 Add navigation from concepts back to source conversations
  - [ ] 7.8 Create concept relationship visualization (future enhancement)
  - [ ] 7.9 Test complete knowledge extraction and browsing workflow

## Phase Summary

### Phase 1: Foundation ✅ **COMPLETE** 
- Tauri + React + TypeScript application with three-tab architecture
- PDF viewing system with navigation and state persistence
- Database setup with PostgreSQL and initial schema
- Dark mode system and UI component library

### Phase 2: Text Selection & Navigation (Tasks 3.0)
- Text selection with CMD+K → Chat navigation
- CMD+L toggle between Library and Chat tabs
- Navigation state management and session persistence
- Reading position preservation across tab switches

### Phase 3: Chat Interface (Tasks 4.0)
- ChatGPT-style conversation interface
- Active chat session management (one active chat)
- Chat list with pagination and preview cards
- Highlighted text context display in conversations

### Phase 4: AI Integration (Tasks 5.0)
- OpenAI API integration for chat conversations
- Streaming response system with real-time updates
- Chat message storage and conversation history
- Multiple highlighted context support in single chat

### Phase 5: LangGraph & Concepts (Tasks 6.0)
- Python environment with pyo3 bridge
- LangGraph workflow for concept extraction
- Vector embeddings with pgvector extension
- Background processing with status tracking

### Phase 6: Knowledge Base (Tasks 7.0)
- Concept card display and detailed concept pages
- Source chat and book section navigation
- Concept search and categorization
- Complete learning workflow integration

## Architecture Principles

### Database-First Design
- **Single Source of Truth**: All state in PostgreSQL
- **Session Persistence**: Survives app restarts
- **No Caching**: Simplified architecture with database performance
- **Vector Search**: pgvector for semantic concept matching

### Three-Tab Navigation
- **Library**: PDF reading with text selection
- **Chat**: AI conversations with context accumulation
- **Knowledge**: Concept browsing and detailed exploration
- **Seamless Switching**: CMD+K and CMD+L shortcuts

### Chat-Centric Learning
- **One Active Chat**: Accumulates contexts from multiple documents
- **User Control**: Explicit choice for knowledge base integration
- **Background Processing**: Non-blocking concept extraction
- **Source Traceability**: Concepts link back to source conversations

This updated task structure reflects the three-tab chat-based architecture with database-first design principles and simplified engineering approach. 