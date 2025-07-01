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

### 1. Embedded AI Processing
**Pattern**: Python-in-Rust via pyo3
**Rationale**: 
- LangGraph ecosystem requires Python
- Embedded approach avoids separate service complexity
- Single binary distribution for users

**Implementation**:
- Rust backend embeds Python interpreter
- AI processing happens in-process
- Streaming responses via async channels

### 2. Local-First Data Architecture
**Pattern**: PostgreSQL + Local Storage
**Rationale**:
- Rich querying for knowledge search
- ACID compliance for data integrity
- Offline-first user experience

**Data Flow**:
```
PDF Text → AI Processing → Knowledge Extraction → PostgreSQL
                      ↓
User Questions → AI Responses → Q&A Storage → Search Index
```

### 3. Component-Based UI Architecture
**Pattern**: React + Custom Hooks + Tauri Commands
**Structure**:
- Components handle UI state and rendering
- Custom hooks manage complex state (text selection, AI streaming)
- Tauri commands bridge to Rust backend

### 4. Text Selection Overlay System
**Pattern**: Coordinate-based selection with visual feedback
**Implementation**:
- PDF.js provides text coordinates
- React overlay captures mouse events
- Selection state managed via custom hook
- Visual highlighting via CSS positioning

## Technical Decisions

### Frontend Technology Stack
- **React 18**: Component architecture with hooks (✅ Setup)
- **TypeScript**: Type safety for complex interactions (✅ Setup)
- **ESLint**: Code quality and React best practices (✅ Configured)
- **Prettier**: Consistent code formatting (✅ Configured)
- **Vite**: Fast build tool and dev server (✅ Setup)
- **TailwindCSS**: Utility-first styling for rapid development (Pending)
- **shadcn/ui**: Consistent component library (Pending)
- **PDF.js**: Proven PDF rendering in browsers (Pending)

### Backend Technology Stack
- **Tauri**: Rust-based desktop framework (✅ Setup)
- **rustfmt**: Consistent Rust code formatting (✅ Configured)
- **clippy**: Advanced Rust linting and optimization (✅ Configured)
- **serde**: Serialization for data exchange (✅ Installed)
- **pyo3**: Python-Rust interoperability (Pending)
- **sqlx**: Async PostgreSQL driver (Pending)
- **tokio**: Async runtime for concurrent operations (Pending)

### AI Technology Stack
- **LangGraph**: Workflow orchestration for complex AI tasks
- **LangChain**: AI agent framework and tool integration
- **OpenAI GPT-4**: Primary language model
- **Tavily**: Web search for enhanced context (future)

## Component Relationships

### Core Components
1. **PDFViewer**: Renders PDF content, handles navigation
2. **TextSelection**: Manages text highlighting and selection state
3. **QuestionInput**: Captures user questions about selected text
4. **ResponseStream**: Displays streaming AI responses
5. **KnowledgeSidebar**: Shows accumulated knowledge and search
6. **NotesPanel**: Personal note-taking interface

### Data Flow Patterns
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

### Streaming Response Pattern
- AI responses stream token-by-token
- Frontend receives chunks via Tauri events
- Progressive UI updates for perceived performance

### Lazy Loading Pattern
- PDF pages load on-demand
- Knowledge sidebar loads incrementally
- Search results paginated for large datasets

### Caching Strategy
- PDF rendering cached per page
- AI responses cached by text + question hash
- Knowledge search results cached temporarily

## Error Handling Patterns

### Graceful Degradation
- AI service failures → cached responses or user notification
- PDF loading errors → clear error messages with retry options
- Database errors → local storage fallback where possible

### User Experience Continuity
- Network issues don't break local functionality
- Partial AI responses still provide value
- Text selection works even if AI is unavailable 