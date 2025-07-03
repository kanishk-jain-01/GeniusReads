# Task List: GeniusReads

## Relevant Files

### Backend Files (Rust/Tauri)
- `src-tauri/src/main.rs` - Main Tauri application entry point and window configuration (✅ Created)
- `src-tauri/src/lib.rs` - Main Tauri application entry point with all command handlers (✅ Created, ✅ Updated with chat commands, ✅ Updated with LangGraph commands, ✅ Updated with vector similarity commands)
- `src-tauri/src/database.rs` - PostgreSQL database operations with sqlx (✅ Created, ✅ Updated with chat tables, ✅ Updated with concept extraction, ✅ Enhanced with vector embeddings)
- `src-tauri/src/pdf_handler.rs` - PDF processing and text extraction (✅ Created)
- `src-tauri/src/chat_manager.rs` - Chat session management, active chat state, and message handling
- `src-tauri/src/langraph_bridge.rs` - Python-Rust bridge for LangGraph concept extraction (✅ Created, ✅ Updated with vector embedding functions)
- `src-tauri/src/concept_extractor.rs` - Concept extraction workflow and vector embedding management
- `src-tauri/Cargo.toml` - Rust dependencies including pyo3, tauri, sqlx, tokio, and pgvector support (✅ Configured, needs pgvector)
- `src-tauri/tauri.conf.json` - Tauri configuration for macOS app settings and file system permissions (✅ Configured)
- `src-tauri/rustfmt.toml` - Rust code formatting configuration (✅ Created)

### Frontend Core Files (✅ Modular Dashboard Architecture Complete)
- `src/App.tsx` - Minimal app wrapper with providers (✅ Refactored to minimal wrapper)
- `src/main.tsx` - React application entry point (✅ Created)
- `src/index.css` - Global styles with TailwindCSS directives (✅ Updated)
- `src/App.css` - Additional component styles (✅ Updated)
- `src/vite-env.d.ts` - Vite TypeScript environment definitions (✅ Created)

### Dashboard Architecture (✅ Professional Modular Structure Complete)
- `src/Dashboard/index.tsx` - Central Dashboard orchestrator component (✅ Created, ✅ Refactored to modular architecture)
- `src/Dashboard/types.ts` - Dashboard-specific TypeScript type definitions (✅ Created)
- `src/Dashboard/hooks/useDashboardState.ts` - Centralized state management hook (✅ Created)
- `src/Dashboard/hooks/useDashboardData.ts` - Data fetching and statistics hook (✅ Created)
- `src/Dashboard/hooks/useDocumentHandlers.ts` - PDF and document operations hook (✅ Created)
- `src/Dashboard/hooks/useChatHandlers.ts` - Chat workflow management hook (✅ Created)
- `src/Dashboard/hooks/useConceptHandlers.ts` - Knowledge base operations hook (✅ Created)
- `src/Dashboard/hooks/useKeyboardShortcuts.ts` - Keyboard shortcut handling hook (✅ Created)

### Pages (✅ Clean Page-Based Architecture Complete)
- `src/Dashboard/pages/LibraryPage.tsx` - Document library with search and upload (✅ Created, ✅ Refactored to page component)
- `src/Dashboard/pages/ReaderPage.tsx` - PDF reading with text selection (✅ Created, ✅ Refactored to page component)
- `src/Dashboard/pages/ChatPage.tsx` - Chat history and session management (✅ Created, ✅ Refactored to page component)
- `src/Dashboard/pages/ChatInterfacePage.tsx` - Active chat conversation interface (✅ Created, ✅ Refactored to page component)
- `src/Dashboard/pages/KnowledgePage.tsx` - Knowledge base with concept browsing (✅ Created, ✅ Refactored to page component)
- `src/Dashboard/pages/PreferencesPage.tsx` - User preferences and API key management (✅ Created, ✅ Refactored to page component)

### shadcn/ui Components (✅ Complete Library Integrated)
- `src/components/ui/` - Complete shadcn/ui component library (40+ components)

### Custom Hooks (✅ Complete Modular Hook System)
- `src/hooks/use-mobile.tsx` - Mobile device detection hook (✅ Created)
- `src/hooks/use-toast.ts` - Toast notification management hook (✅ Created)
- `src/hooks/use-keyboard-shortcuts.ts` - Base keyboard shortcut handling (✅ Created)
- `src/Dashboard/hooks/useDashboardState.ts` - Centralized state management (✅ Created)
- `src/Dashboard/hooks/useDashboardData.ts` - Data fetching and statistics (✅ Created)
- `src/Dashboard/hooks/useDocumentHandlers.ts` - PDF and document operations (✅ Created)
- `src/Dashboard/hooks/useChatHandlers.ts` - Chat workflow management (✅ Created)
- `src/Dashboard/hooks/useConceptHandlers.ts` - Knowledge base operations (✅ Created)
- `src/Dashboard/hooks/useKeyboardShortcuts.ts` - Dashboard keyboard shortcuts (✅ Created)

### Utilities and Libraries (✅ Complete with Vector Search)
- `src/lib/utils.ts` - Utility functions for className merging and common operations (✅ Created)
- `src/lib/api.ts` - Tauri command invocations with chat session and user preferences commands (✅ Created, ✅ Updated with preferences API, ✅ Updated with concept extraction API, ✅ Enhanced with vector similarity search)
- `src/lib/types.ts` - TypeScript type definitions for chat sessions, concepts, and navigation state (✅ Created, ✅ Updated with Concept interface)

### Feature Components (✅ Complete Component System)
- `src/components/PDFViewer.tsx` - PDF display component with text selection and navigation (✅ Created, ✅ CMD+K integration)
- `src/components/chat/ChatList.tsx` - Paginated list of chat sessions with preview cards (✅ Created, ✅ Updated with processing indicators)
- `src/components/chat/ActiveChat.tsx` - ChatGPT-style conversation interface with streaming responses (✅ Created)
- `src/components/chat/ChatHeader.tsx` - Chat interface header component (✅ Created)
- `src/components/ProcessingIndicator.tsx` - LangGraph processing status and progress display (✅ Created)
- `src/components/Sidebar.tsx` - Navigation sidebar component (✅ Created)
- `src/components/TextSelectionOverlay.tsx` - Text selection overlay system (✅ Created)
- `src/components/theme-provider.tsx` - Theme management provider (✅ Created)
- `src/components/theme-toggle.tsx` - Theme toggle component (✅ Created)

### Python/AI Files (To Be Created)
- `src-tauri/python/concept_extractor.py` - LangGraph workflow for concept extraction (✅ Created)
- `src-tauri/python/vector_embeddings.py` - Vector embedding generation and similarity calculation (✅ Created)
- `src-tauri/python/concept_similarity.py` - Concept matching and deduplication (✅ Created)
- `src-tauri/python/requirements.txt` - Python dependencies (✅ Created)

### Database Files (✅ Created, needs schema updates)
- `migrations/001_initial_schema.sql` - Core database schema with documents, chat sessions, and user state (✅ Created)
- `migrations/002_chat_system.sql` - Chat sessions, messages, and active chat schema
- `migrations/003_concepts_vector.sql` - LangGraph concept extraction tables with pgvector support (✅ Created, includes vector similarity functions)

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

- **Dashboard-Centric Architecture**: Central Dashboard orchestrator with modular hook system and page-based views
- **Modular Hook System**: Specialized hooks for state management, data operations, document handling, chat workflow, concept management, and keyboard shortcuts
- **Page-Based Views**: Clean separation of Library, Reader, Chat, Chat Interface, Knowledge, and Preferences as dedicated page components
- **Professional Organization**: TypeScript types, clean interfaces, and consistent patterns throughout
- **Database-First**: All application state stored in PostgreSQL with modular frontend integration
- **CMD+K Integration**: Text selection triggers navigation to active chat interface through specialized keyboard shortcut hook
- **CMD+L Toggle**: Switch between views while preserving state through centralized state management
- **Single Active Chat**: One active chat accumulates highlighted contexts from multiple documents
- **Auto-Save**: All conversations automatically saved as messages are sent, no manual save required
- **Chat Management**: "End" (read-only) and "Analyze" (end + extract concepts + navigate to Knowledge) buttons
- **LangGraph Processing**: Background concept extraction triggered by "Analyze" button
- **Vector Search**: pgvector extension for semantic concept similarity and search
- **Scalable Foundation**: Ready for team development and feature expansion

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
  - [x] 4.9 Create chat action buttons (End/Analyze with auto-save)
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

- [ ] 6.0 Implement LangGraph-based Concept Extraction
  - [x] 6.1 Set up Python environment with LangGraph dependencies
  - [x] 6.2 Create concept_extractor.py with LangGraph workflow  
  - [x] 6.3 Design concept storage schema with vector embeddings
  - [x] 6.4 Build Rust-Python bridge for concept extraction
  - [x] 6.5 Create database methods for concept storage and retrieval
  - [x] 6.6 Integrate concept extraction into chat analysis workflow
  - [x] 6.7 Add processing status tracking and progress indicators
  - [x] 6.8 Implement concept storage with vector embeddings
  - [x] 6.9 Create concept-chat linking system with relevance scores
  - [ ] 6.10 Test complete concept extraction pipeline

- [ ] 7.0 Build Knowledge Base Interface and Concept Management
  - [x] 7.1 Update KnowledgeBase page with concept card display
  - [ ] 7.2 Create ConceptCard component with concept preview information
  - [ ] 7.3 Implement ConceptDetail page showing source chats and book sections
  - [ ] 7.4 Add concept search and filtering functionality
  - [ ] 7.5 Create processing status indicators for LangGraph analysis
  - [ ] 7.6 Implement concept categorization and organization
  - [ ] 7.7 Add navigation from concepts back to source conversations
  - [ ] 7.8 Create concept relationship visualization (future enhancement)
  - [ ] 7.9 Test complete knowledge extraction and browsing workflow

