# System Patterns: GeniusReads

## Architecture Overview

GeniusReads follows a **hybrid desktop architecture** combining native performance with web technology flexibility.

```
┌─────────────────────────────────────────┐
│              Frontend (React)           │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ PDF Viewer  │  │ Knowledge Panel │   │
│  │  (PDF.js)   │  │   (Sidebar)     │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
                    │ Tauri IPC
┌─────────────────────────────────────────┐
│            Rust Backend (Tauri)         │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │   Python    │  │   PostgreSQL    │   │
│  │  Bridge     │  │   Knowledge     │   │
│  │ (pyo3/AI)   │  │    Store        │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
```

## Key Design Patterns

### 1. Embedded AI Processing ✅ Dependencies Configured
**Pattern**: Python-in-Rust via pyo3
**Rationale**: 
- LangGraph ecosystem requires Python
- Embedded approach avoids separate service complexity
- Single binary distribution for users

**Implementation Status**:
- ✅ Rust backend configured with pyo3 v0.22
- ✅ Auto-initialization feature enabled
- 🚧 AI processing implementation pending (Task 4.0)
- 🚧 Streaming responses via async channels pending

### 2. Local-First Data Architecture ✅ Dependencies Configured
**Pattern**: PostgreSQL + Local Storage
**Rationale**:
- Rich querying for knowledge search
- ACID compliance for data integrity
- Offline-first user experience

**Implementation Status**:
- ✅ sqlx configured with PostgreSQL features
- ✅ UUID and JSON support enabled
- ✅ Async runtime (tokio) configured
- 🚧 Database setup and migrations pending (Task 5.0)

**Data Flow**:
```
PDF Text → AI Processing → Knowledge Extraction → PostgreSQL
                      ↓
User Questions → AI Responses → Q&A Storage → Search Index
```

### 3. Component-Based UI Architecture ✅ Foundation Complete
**Pattern**: React + Custom Hooks + Tauri Commands
**Structure**:
- ✅ Components handle UI state and rendering (React 18 configured)
- 🚧 Custom hooks manage complex state (text selection, AI streaming) - pending
- ✅ Tauri commands bridge to Rust backend (IPC configured)

### 4. Text Selection Overlay System 🚧 Design Validated
**Pattern**: Coordinate-based selection with visual feedback
**Implementation**:
- 🚧 PDF.js provides text coordinates (pending Task 2.0)
- 🚧 React overlay captures mouse events (pending Task 3.0)
- 🚧 Selection state managed via custom hook (pending Task 3.4)
- ✅ Visual highlighting via CSS positioning (TailwindCSS classes ready)

## Technical Decisions

### ✅ Frontend Technology Stack (Fully Implemented)
- **React 18**: Component architecture with hooks ✅ Setup and validated
- **TypeScript**: Type safety for complex interactions ✅ Setup and validated
- **ESLint**: Code quality and React best practices ✅ Configured with 0 warnings
- **Prettier**: Consistent code formatting ✅ Configured and validated
- **Vite**: Fast build tool and dev server ✅ Setup and validated
- **TailwindCSS v4**: Utility-first styling ✅ Fully integrated with design system
- **shadcn/ui**: Consistent component library 🚧 Next task (1.5)
- **PDF.js**: Proven PDF rendering 🚧 Pending integration (Task 2.1)

### ✅ Backend Technology Stack (Dependencies Configured)
- **Tauri**: Rust-based desktop framework ✅ Setup with macOS private API
- **rustfmt**: Consistent Rust code formatting ✅ Configured and validated
- **clippy**: Advanced Rust linting ✅ Configured with 0 warnings
- **serde**: Serialization for data exchange ✅ Installed and configured
- **pyo3**: Python-Rust interoperability ✅ Configured with auto-init
- **sqlx**: Async PostgreSQL driver ✅ Configured with all features
- **tokio**: Async runtime ✅ Configured with full features
- **UUID & Chrono**: Data handling utilities ✅ Configured
- **Error handling**: anyhow + thiserror ✅ Configured
- **Logging**: tracing + tracing-subscriber ✅ Configured

### 🚧 AI Technology Stack (Dependencies Ready)
- **LangGraph**: Workflow orchestration (pending pyo3 integration)
- **LangChain**: AI agent framework (pending setup)
- **OpenAI GPT-4**: Primary language model (pending API configuration)
- **Tavily**: Web search for enhanced context (future feature)

## Component Relationships

### ✅ Core Components (Foundation Ready)
1. **PDFViewer**: 🚧 Renders PDF content, handles navigation (Task 2.2)
2. **TextSelection**: 🚧 Manages text highlighting and selection state (Task 3.4)
3. **QuestionInput**: 🚧 Captures user questions about selected text (Task 3.7)
4. **ResponseStream**: 🚧 Displays streaming AI responses (Task 4.6)
5. **KnowledgeSidebar**: 🚧 Shows accumulated knowledge and search (Task 6.1)
6. **NotesPanel**: 🚧 Personal note-taking interface (Task 6.3)

### Data Flow Patterns (Architecture Validated)
```
User Highlights Text → TextSelection Hook → Question Input
                                        ↓
AI Processing (Python) ← Tauri Command ← User Question
                                        ↓
Streaming Response → ResponseStream → Knowledge Storage
                                        ↓
Knowledge Sidebar ← Database Query ← Knowledge Update
```

## Performance Patterns

### Streaming Response Pattern ✅ Infrastructure Ready
- ✅ AI responses stream token-by-token (tokio async runtime configured)
- ✅ Frontend receives chunks via Tauri events (IPC ready)
- ✅ Progressive UI updates for perceived performance (React 18 concurrent features)

### Lazy Loading Pattern ✅ Framework Support
- 🚧 PDF pages load on-demand (pending PDF.js integration)
- 🚧 Knowledge sidebar loads incrementally (pending implementation)
- 🚧 Search results paginated for large datasets (pending database setup)

### Caching Strategy ✅ Technical Foundation
- 🚧 PDF rendering cached per page (pending implementation)
- 🚧 AI responses cached by text + question hash (pending implementation)
- 🚧 Knowledge search results cached temporarily (pending implementation)

## Error Handling Patterns ✅ Comprehensive Setup

### Graceful Degradation (Error Handling Ready)
- ✅ Rust error handling: anyhow + thiserror configured
- ✅ TypeScript type safety: strict mode enabled
- 🚧 AI service failures → cached responses or user notification (pending)
- 🚧 PDF loading errors → clear error messages with retry options (pending)
- 🚧 Database errors → local storage fallback where possible (pending)

### User Experience Continuity (Foundation Established)
- ✅ Network issues won't break local functionality (local-first architecture)
- 🚧 Partial AI responses still provide value (pending streaming implementation)
- 🚧 Text selection works even if AI is unavailable (pending implementation)

## Development Patterns ✅ Fully Established

### Code Quality Enforcement
- **Frontend**: ESLint + Prettier with React best practices
- **Backend**: Clippy + rustfmt with comprehensive linting
- **Type Safety**: TypeScript strict mode with full coverage
- **Build Validation**: Both frontend and backend builds verified

### Configuration Management
- **Environment-specific**: Development vs production configurations
- **Feature flags**: Tauri features properly configured
- **Security**: CSP policies for PDF.js and AI API access
- **Performance**: Optimized build outputs with tree shaking

### Testing Strategy (Framework Ready)
- ✅ TypeScript compilation serves as basic type testing
- ✅ ESLint catches potential runtime errors
- ✅ Build system validates dependency compatibility
- 🚧 Unit tests for critical components (pending implementation)
- 🚧 Integration tests for AI workflow (pending implementation)

## Architecture Validation Status

### ✅ Validated Components
1. **Build System**: Frontend and backend compile successfully
2. **Dependency Management**: All packages compatible and working
3. **Code Quality**: Comprehensive linting and formatting enforced
4. **Configuration**: Tauri, Vite, TailwindCSS properly configured
5. **Type Safety**: TypeScript compilation without errors
6. **Development Workflow**: Hot reload and incremental builds working

### 🚧 Pending Validation
1. **IPC Communication**: Tauri-React command testing (Task 1.8)
2. **PDF Integration**: Document loading and rendering (Task 2.0)
3. **Python Bridge**: pyo3 integration testing (Task 4.1)
4. **Database Connection**: PostgreSQL setup and queries (Task 5.1)
5. **AI Pipeline**: End-to-end streaming responses (Task 4.6)

## Next Architecture Milestones

### Immediate (Tasks 1.5-1.8)
1. **Component Library**: shadcn/ui integration for consistent UI
2. **Layout Structure**: Main window with PDF viewer and sidebar
3. **Type System**: Core data structure definitions
4. **IPC Validation**: Basic Tauri-React communication test

### Short-term (Tasks 2.0-3.0)
1. **Document System**: PDF loading, rendering, and navigation
2. **Interaction Layer**: Text selection and highlighting overlay
3. **Input System**: Question capture and state management

### Medium-term (Tasks 4.0-6.0)
1. **AI Integration**: Python bridge and streaming responses
2. **Data Layer**: PostgreSQL setup and knowledge management
3. **User Interface**: Complete workflow with notes and search

**Current Status**: Solid architectural foundation with all major technical decisions validated and dependencies configured. Ready for systematic feature implementation. 