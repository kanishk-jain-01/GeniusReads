# Technical Context: GeniusReads

## Development Environment

### Required Tools
- **Rust**: Latest stable (1.70+) with cargo
- **Node.js**: v18+ with npm/yarn for frontend dependencies
- **Python**: 3.9+ for AI processing (embedded via pyo3)
- **PostgreSQL**: 14+ for local knowledge storage
- **macOS**: Primary target platform (Tauri supports others)

### Development Setup Sequence
1. Install Rust toolchain with Tauri CLI
2. Install Node.js and frontend dependencies
3. Set up PostgreSQL locally
4. Configure Python environment for pyo3 integration
5. Set up OpenAI API key for AI processing

## Technology Stack Details

### Frontend Stack
```json
{
  "framework": "React 18 with TypeScript",
  "styling": "TailwindCSS + shadcn/ui",
  "bundler": "Vite",
  "pdf": "PDF.js",
  "state": "React hooks + Context API"
}
```

### Backend Stack
```toml
[dependencies]
tauri = "1.4"
pyo3 = "0.19"
sqlx = { version = "0.7", features = ["postgres", "runtime-tokio-rustls"] }
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
```

### Python Dependencies
```txt
langgraph>=0.1.0
langchain>=0.1.0
openai>=1.0.0
tavily-python>=0.3.0
pydantic>=2.0.0
```

## Technical Constraints

### Performance Requirements
- **Text selection**: <100ms response time
- **AI streaming**: First token within 2 seconds
- **PDF rendering**: Page load <500ms
- **Knowledge search**: Results <200ms

### Memory Constraints
- **PDF files**: Support up to 20MB
- **Knowledge storage**: Unlimited local growth
- **AI context**: 32k token limit per conversation
- **Embedded Python**: Minimize memory footprint

### Platform Constraints
- **Primary target**: macOS 10.15+
- **File system**: Local file access required
- **Database**: PostgreSQL must be installed locally
- **Network**: Internet required for AI processing only

## Architecture Constraints

### Single PDF Limitation (MVP)
- Only one document open at a time
- Simplifies state management
- Reduces UI complexity
- Clear upgrade path for multi-document support

### Local-First Design
- All user data stored locally
- No cloud synchronization
- Privacy-preserving approach
- Offline knowledge access

### AI Processing Constraints
- OpenAI API dependency for explanations
- "Explain like I'm 5" tone only (MVP)
- English language only (initial)
- Context window limitations

## Integration Challenges

### pyo3 Python-Rust Bridge
**Challenge**: Embedding Python interpreter in Rust
**Considerations**:
- Python version compatibility
- Package dependency management
- Error handling across language boundaries
- Performance overhead of FFI calls

### PDF.js Text Extraction
**Challenge**: Coordinate-based text selection
**Considerations**:
- Browser compatibility
- Text coordinate accuracy
- Selection across page boundaries
- Performance with large documents

### PostgreSQL Local Setup
**Challenge**: Database installation and management
**Considerations**:
- Cross-platform installation differences
- Database migration handling
- Connection pooling and performance
- Data backup and recovery

## Development Dependencies

### Rust Crates
- `tauri`: Desktop app framework
- `pyo3`: Python interop with precompiled bindings
- `sqlx`: Async PostgreSQL with compile-time query checking
- `tokio`: Async runtime for concurrent operations
- `serde`: JSON serialization for IPC
- `anyhow`: Error handling
- `uuid`: Unique identifiers for knowledge entries

### Frontend Packages
- `react`: UI framework
- `@tauri-apps/api`: Tauri frontend bindings
- `pdf-lib` or `react-pdf`: PDF.js React integration
- `tailwindcss`: Utility-first CSS
- `@radix-ui/react-*`: Accessible UI primitives (via shadcn/ui)
- `lucide-react`: Icon library

### Python Packages
- `langgraph`: AI workflow orchestration
- `langchain`: Agent framework
- `openai`: GPT-4 API client
- `pydantic`: Data validation
- `asyncio`: Async support for streaming

## Configuration Management

### Environment Variables
```bash
OPENAI_API_KEY=sk-...          # Required for AI processing
DATABASE_URL=postgresql://...  # PostgreSQL connection
TAVILY_API_KEY=tvly-...       # Optional: web search
LOG_LEVEL=info                # Application logging
```

### Tauri Configuration
- File system permissions for PDF access
- Window configuration for macOS
- IPC command registration
- Security CSP for PDF.js

### Database Configuration
- Connection pooling settings
- Migration directory structure
- Index optimization for search
- Backup and maintenance procedures 