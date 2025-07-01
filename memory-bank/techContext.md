# Technical Context: GeniusReads

## Development Environment

### Required Tools ✅
- **Rust**: Latest stable (1.70+) with cargo ✅ Installed and validated
- **Node.js**: v18+ with npm for frontend dependencies ✅ Installed and validated  
- **Python**: 3.9+ for AI processing (embedded via pyo3) ✅ Ready for integration
- **PostgreSQL**: 14+ for local knowledge storage (Pending installation)
- **macOS**: Primary target platform (Tauri supports others) ✅ Configured

### Development Setup Status ✅
1. ✅ **Rust toolchain**: Installed with Tauri CLI and all required crates
2. ✅ **Node.js dependencies**: All frontend packages installed and validated
3. ✅ **Development tooling**: ESLint, Prettier, rustfmt, clippy all working
4. ✅ **VS Code workspace**: Configured for consistent development experience
5. ✅ **Build systems**: Both frontend (Vite) and backend (Cargo) validated
6. ✅ **TailwindCSS v4**: Fully integrated with design system
7. 🚧 **PostgreSQL**: Local setup pending (Task 5.1)
8. 🚧 **Python environment**: pyo3 integration pending (Task 4.1)
9. 🚧 **OpenAI API**: Configuration pending (Task 4.0 series)

## Technology Stack Details

### Frontend Stack ✅ Fully Configured
```json
{
  "framework": "React 18 with TypeScript",
  "styling": "TailwindCSS v4 with design system",
  "bundler": "Vite with PostCSS pipeline",
  "pdf": "PDF.js (pending integration)",
  "state": "React hooks + Context API",
  "components": "shadcn/ui (pending integration)"
}
```

### Backend Stack ✅ Dependencies Configured
```toml
[dependencies]
# Core Tauri framework
tauri = { version = "2", features = ["macos-private-api"] }
tauri-plugin-opener = "2"
tauri-plugin-fs = "2" 
tauri-plugin-dialog = "2"

# Python integration for AI processing
pyo3 = { version = "0.22", features = ["auto-initialize"] }

# Database integration
sqlx = { version = "0.8", features = ["postgres", "runtime-tokio-rustls", "uuid", "chrono", "json"] }

# Async runtime and utilities
tokio = { version = "1.0", features = ["full"] }
uuid = { version = "1.0", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }

# Data handling and error management
serde = { version = "1", features = ["derive"] }
serde_json = "1"
anyhow = "1.0"
thiserror = "1.0"

# Logging and debugging
tracing = "0.1"
tracing-subscriber = "0.3"
```

### Python Dependencies (Pending Integration)
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
- **Primary target**: macOS 10.15+ ✅ Configured in tauri.conf.json
- **File system**: Local file access configured ✅
- **Database**: PostgreSQL must be installed locally (Pending)
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

## Integration Status

### ✅ Completed Integrations
- **Tauri + React**: Core desktop framework working
- **TypeScript**: Full type safety configured
- **TailwindCSS v4**: Design system with CSS variables
- **ESLint + Prettier**: Code quality enforcement
- **Rust tooling**: Clippy and rustfmt working
- **Build pipeline**: Development and production builds validated

### 🚧 Pending Integrations
- **pyo3 Python-Rust Bridge**: Dependency configured, implementation pending
- **PDF.js Text Extraction**: React integration pending
- **PostgreSQL**: Local setup and connection pending
- **shadcn/ui**: Component library integration next

## Development Dependencies Status

### ✅ Rust Crates (All Installed & Validated)
- `tauri`: Desktop app framework with macOS private API
- `serde`: JSON serialization for IPC
- `pyo3`: Python interop with auto-initialization
- `sqlx`: Async PostgreSQL with compile-time query checking
- `tokio`: Async runtime for concurrent operations
- `anyhow` & `thiserror`: Comprehensive error handling
- `uuid`: Unique identifiers for knowledge entries
- `chrono`: Date/time handling with serialization
- `tracing`: Application logging and debugging

### ✅ Frontend Packages (All Installed & Validated)
- `react` & `react-dom`: UI framework
- `@tauri-apps/api`: Tauri frontend bindings
- `typescript`: Type checking and compilation
- `vite`: Build tool and dev server
- `tailwindcss`: Utility-first CSS with v4 features
- `@tailwindcss/postcss`: PostCSS integration
- `@tailwindcss/typography`: Enhanced text styling
- `eslint` & `prettier`: Code quality and formatting
- `postcss` & `autoprefixer`: CSS processing pipeline

### 🚧 Pending Packages
- `pdf-lib` or `react-pdf`: PDF.js React integration
- `@radix-ui/react-*`: Accessible UI primitives (via shadcn/ui)
- `lucide-react`: Icon library
- Python packages for AI processing

## Configuration Management

### ✅ Completed Configurations
- **Tauri Configuration**: macOS-specific settings, window properties, security policies
- **TailwindCSS**: Design system with CSS variables and component classes
- **PostCSS**: TailwindCSS processing pipeline
- **TypeScript**: Strict type checking with proper paths
- **ESLint**: React best practices and TypeScript rules
- **Prettier**: Consistent code formatting
- **Rust**: Clippy linting and rustfmt formatting

### Environment Variables (Pending)
```bash
OPENAI_API_KEY=sk-...          # Required for AI processing
DATABASE_URL=postgresql://...  # PostgreSQL connection
TAVILY_API_KEY=tvly-...       # Optional: web search
LOG_LEVEL=info                # Application logging
```

### Database Configuration (Pending)
- Connection pooling settings
- Migration directory structure
- Index optimization for search
- Backup and maintenance procedures

## Build System Status

### ✅ Frontend Build (Vite + TailwindCSS)
- **Development**: Hot reload with TailwindCSS processing ✅
- **Production**: Optimized bundles with CSS purging ✅
- **Type checking**: TypeScript compilation without errors ✅
- **Linting**: ESLint with zero warnings ✅
- **Formatting**: Prettier with consistent style ✅

### ✅ Backend Build (Cargo + Tauri)
- **Development**: Fast incremental compilation ✅
- **Dependencies**: All crates compile successfully ✅
- **Linting**: Clippy with zero warnings ✅
- **Formatting**: Rustfmt with consistent style ✅
- **Integration**: Tauri plugins properly configured ✅

### Quality Metrics ✅
- **Build time**: Fast incremental builds for development
- **Bundle size**: Optimized production outputs
- **Type safety**: Full TypeScript coverage
- **Code quality**: Comprehensive linting rules enforced
- **Consistency**: Automated formatting across codebase

## Next Technical Milestones

### Immediate (Tasks 1.5-1.8)
1. **shadcn/ui Integration**: Component library setup
2. **UI Layout**: Basic window structure with sidebar
3. **Type Definitions**: Core data structure types
4. **IPC Testing**: Tauri-React communication validation

### Short-term (Tasks 2.0-3.0)
1. **PDF.js Integration**: Document rendering and navigation
2. **Text Selection**: Coordinate-based overlay system
3. **File System**: PDF loading and metadata extraction

### Medium-term (Tasks 4.0-5.0)
1. **Python Environment**: pyo3 integration and LangGraph setup
2. **Database Setup**: PostgreSQL installation and schema creation
3. **AI Pipeline**: Streaming response implementation

**Current Status**: Excellent foundation with all core development infrastructure validated and ready for feature implementation. 