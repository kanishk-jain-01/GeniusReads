# Task List: GeniusReads

## Relevant Files

### Backend Files (Rust/Tauri)
- `src-tauri/src/main.rs` - Main Tauri application entry point and window configuration (✅ Created)
- `src-tauri/src/lib.rs` - Tauri command handlers including chat session management and user preferences (✅ Created, ✅ Updated with preferences commands)
- `src-tauri/src/database.rs` - PostgreSQL database connection and query handling with user preferences support (✅ Created, ✅ Updated with preferences methods)
- `src-tauri/src/pdf_handler.rs` - PDF file operations and metadata extraction (✅ Created)
- `src-tauri/src/chat_manager.rs` - Chat session management, active chat state, and message handling
- `src-tauri/src/langraph_bridge.rs` - Python-Rust interoperability layer using pyo3 for LangGraph concept extraction (✅ Created)
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

### Pages (✅ Four-View Structure)
- `src/pages/Dashboard.tsx` - Main application with Library tab (PDF reading) and Chat tab (chat list) (✅ Created, ✅ Updated with ChatList component, ✅ Updated with Preferences navigation)
- `src/pages/ChatInterface.tsx` - Individual chat conversation interface (separate from chat list) (✅ Created, ✅ Updated with ActiveChat)
- `src/pages/KnowledgeBase.tsx` - Knowledge tab with concept cards and detailed concept pages (✅ Created, needs updates)
- `src/pages/Preferences.tsx` - User preferences page with OpenAI API key management and theme selection (✅ Created)

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
- `src/lib/api.ts` - Tauri command invocations with chat session and user preferences commands (✅ Created, ✅ Updated with preferences API)
- `src/lib/types.ts` - TypeScript type definitions for chat sessions, concepts, and navigation state (✅ Created, needs updates)

### Feature Components (✅ PDF Ready, needs chat components)
- `src/components/PDFViewer.tsx` - PDF display component with text selection and CMD+K integration (✅ Created, needs CMD+K)
- `src/components/ChatList.tsx` - Paginated list of chat sessions with preview cards (✅ Created)
- `src/components/ActiveChat.tsx` - ChatGPT-style conversation interface with streaming responses (✅ Created)
- `src/components/HighlightedContext.tsx` - Display component for highlighted text contexts in chat (✅ Integrated into ActiveChat)
- `src/components/ConceptCard.tsx` - Concept display cards for Knowledge tab
- `src/components/ConceptDetail.tsx` - Detailed concept page showing source chats and book sections
- `src/components/ProcessingIndicator.tsx` - LangGraph processing status and progress display

### Python/AI Files (To Be Created)
- `src-tauri/python/concept_extractor.py` - LangGraph workflow for automated concept extraction from chat sessions (✅ Created)
- `src-tauri/python/vector_embeddings.py` - Vector embedding generation and similarity calculation (✅ Created)
- `src-tauri/python/concept_similarity.py` - Concept similarity matching and merging logic (✅ Created)
- `src-tauri/python/requirements.txt` - Python dependencies for embedded environment (LangGraph, OpenAI, sentence-transformers) (✅ Created)

### Database Files (✅ Created, needs schema updates)
- `migrations/001_initial_schema.sql` - PostgreSQL database schema setup (✅ Created, ✅ Updated with user_preferences table)
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

- **Four-View Architecture**: Library (PDF reading) → Chat List (chat history) → Individual Chat (active conversation) → Knowledge (concept browsing)
- **Database-First**: All application state stored in PostgreSQL, no caching layer for simplicity
- **CMD+K Integration**: Text selection in Library tab triggers navigation DIRECTLY to active chat interface (not chat list)
- **CMD+L Toggle**: Switch between active chat interface and current reading position while preserving state
- **Single Active Chat**: One active chat accumulates highlighted contexts from multiple documents
- **Chat Management**: Save/Save+Analyze/Delete buttons make chat inactive and return to appropriate view
- **LangGraph Processing**: Background concept extraction triggered by "Save + Analyze" choice
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

- [x] 3.0 Build Text Selection and Chat Navigation System ✅ **COMPLETE**
  - [x] 3.1 Implement text selection overlay system for PDF content
  - [x] 3.2 Add CMD+K keyboard shortcut for text selection → Chat navigation
  - [x] 3.3 Create navigation state management for seamless tab switching
  - [x] 3.4 Implement CMD+L toggle between Library and Chat tabs
  - [x] 3.5 Add highlighted text context transfer to Chat tab
  - [x] 3.6 Create user session state persistence in database ✅ **JUST COMPLETED**
  - [x] 3.7 Implement reading position preservation across navigation ✅ **JUST COMPLETED**

- [x] 4.0 Develop Chat Interface and Session Management ✅ **COMPLETE**
  - [x] 4.1 Update Chat tab to show chat list/history page (not active chat)
  - [x] 4.2 Create separate ChatInterface page/component for individual conversations
  - [x] 4.3 Implement ChatList component with paginated conversation cards
  - [x] 4.4 Build ActiveChat component with ChatGPT-style message bubbles
  - [x] 4.5 Add streaming AI response system with real-time updates
  - [x] 4.6 Create HighlightedContext component for displaying selected text
  - [x] 4.7 Implement active chat session management (single active chat)
  - [x] 4.8 Add chat session storage and retrieval from database
  - [x] 4.9 Create chat action buttons (Save/Save+Analyze/Delete)
  - [x] 4.10 Update CMD+K to navigate directly to active chat interface
  - [x] 4.11 Update CMD+L to toggle between active chat and reading position
  - [x] 4.12 Implement database tracking for active chat and navigation state

- [x] 5.0 Integrate AI Processing and OpenAI Chat ✅ **COMPLETE**
  - [x] 5.1 Set up OpenAI API integration for chat conversations
  - [x] 5.2 Implement streaming chat responses with proper error handling
  - [x] 5.3 Create chat message storage and retrieval system
  - [x] 5.4 Add highlighted text context integration with AI conversations
  - [x] 5.5 Implement conversation history and message threading
  - [x] 5.6 Add support for multiple highlighted contexts in single chat
  - [x] 5.7 Create chat session completion and action handling
  - [x] 5.8 Test complete chat workflow from text selection to conversation

- [x] 6.0 Implement LangGraph Concept Extraction System
  - [x] 6.1 Set up Python environment with pyo3 bridge for LangGraph
  - [x] 6.2 Install pgvector extension for PostgreSQL vector storage
  - [x] 6.3 Create concept_extractor.py with LangGraph workflow implementation
  - [x] 6.4 Implement vector embedding generation for concepts
  - [x] 6.5 Build concept similarity matching and merging logic
  - [x] 6.6 Create background processing system for concept extraction
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

