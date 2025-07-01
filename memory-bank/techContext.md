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
6. ✅ **TailwindCSS v3**: Fully integrated with shadcn/ui design system
7. ✅ **shadcn/ui Components**: Complete component library integrated
8. 🚧 **PostgreSQL**: Local setup pending (Task 5.1)
9. 🚧 **Python environment**: pyo3 integration pending (Task 4.1)
10. 🚧 **OpenAI API**: Configuration pending (Task 4.0 series)

## Technology Stack Details

### Frontend Stack ✅ Fully Modernized
```json
{
  "framework": "React 18 with TypeScript",
  "styling": "TailwindCSS v3 with shadcn/ui design system",
  "bundler": "Vite with SWC plugin for performance",
  "components": "shadcn/ui (complete library with 40+ components)",
  "forms": "React Hook Form + Zod validation",
  "state": "React hooks + Context API + React Query",
  "icons": "Lucide React",
  "animations": "TailwindCSS animations + Framer Motion ready",
  "pdf": "PDF.js (pending integration)"
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

### Frontend Dependencies ✅ Complete Modern Stack
```json
{
  "ui_primitives": "@radix-ui/react-* (complete set)",
  "forms": "@hookform/resolvers + react-hook-form + zod",
  "data_fetching": "@tanstack/react-query",
  "styling": "tailwindcss + tailwindcss-animate + class-variance-authority",
  "utilities": "clsx + tailwind-merge + cmdk",
  "components": "lucide-react + next-themes + sonner",
  "advanced": "embla-carousel-react + vaul + input-otp + date-fns"
}
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
- **Component rendering**: Optimized with SWC compilation

### Memory Constraints
- **PDF files**: Support up to 20MB
- **Knowledge storage**: Unlimited local growth
- **AI context**: 32k token limit per conversation
- **Embedded Python**: Minimize memory footprint
- **React components**: Lazy loading for large component trees

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
- **TailwindCSS v3**: Design system with animations and shadcn/ui
- **shadcn/ui**: Complete component library with all primitives
- **React Hook Form + Zod**: Form handling and validation ready
- **React Query**: Data fetching and caching configured
- **SWC**: Fast compilation and hot reload
- **ESLint + Prettier**: Code quality enforcement
- **Rust tooling**: Clippy and rustfmt working
- **Build pipeline**: Development and production builds optimized

### 🚧 Pending Integrations
- **pyo3 Python-Rust Bridge**: Dependency configured, implementation pending
- **PDF.js Text Extraction**: React integration pending
- **PostgreSQL**: Local setup and connection pending

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

### ✅ Frontend Packages (Complete Modern Stack)
**Core Framework:**
- `react` & `react-dom`: UI framework
- `typescript`: Type checking and compilation
- `@tauri-apps/api`: Tauri frontend bindings

**Build Tools:**
- `vite`: Build tool and dev server
- `@vitejs/plugin-react-swc`: SWC plugin for performance
- `eslint` & `prettier`: Code quality and formatting

**UI & Styling:**
- `tailwindcss`: Utility-first CSS framework
- `tailwindcss-animate`: Animation utilities
- `@tailwindcss/typography`: Enhanced text styling
- `postcss` & `autoprefixer`: CSS processing pipeline

**Component Library (shadcn/ui):**
- Complete set of `@radix-ui/react-*` primitives
- `class-variance-authority`: Component variants
- `clsx` & `tailwind-merge`: Utility functions
- `lucide-react`: Modern icon library

**Forms & Validation:**
- `react-hook-form`: Form state management
- `@hookform/resolvers`: Form validation resolvers
- `zod`: TypeScript-first schema validation

**Advanced Features:**
- `@tanstack/react-query`: Data fetching and caching
- `cmdk`: Command palette component
- `sonner`: Toast notifications
- `next-themes`: Theme management
- `date-fns`: Date manipulation utilities
- `embla-carousel-react`: Carousel component
- `vaul`: Drawer component
- `input-otp`: OTP input component
- `react-resizable-panels`: Resizable panel layouts
- `react-router-dom`: Client-side routing
- `recharts`: Chart components

### 🚧 Pending Packages
- `pdf-lib` or `react-pdf`: PDF.js React integration
- Python packages for AI processing

## Configuration Management

### ✅ Completed Configurations
- **Tauri Configuration**: macOS-specific settings, window properties, security policies
- **TailwindCSS**: shadcn/ui design system with animations and utilities
- **PostCSS**: Standard TailwindCSS v3 processing pipeline
- **TypeScript**: Strict type checking with path mapping (@/*)
- **Vite**: SWC plugin integration with path resolution
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

### ✅ Frontend Build (Vite + SWC + TailwindCSS)
- **Development**: Hot reload with SWC compilation ✅
- **Production**: Optimized bundles with CSS purging ✅
- **Type checking**: TypeScript compilation without errors ✅
- **Linting**: ESLint with minimal warnings ✅
- **Formatting**: Prettier with consistent style ✅
- **Component Library**: All shadcn/ui components available ✅

### ✅ Backend Build (Cargo + Tauri)
- **Development**: Fast incremental compilation ✅
- **Dependencies**: All crates compile successfully ✅
- **Linting**: Clippy with zero warnings ✅
- **Formatting**: Rustfmt with consistent style ✅
- **Integration**: Tauri plugins properly configured ✅

### Quality Metrics ✅
- **Build time**: Fast incremental builds with SWC
- **Bundle size**: Optimized production outputs
- **Type safety**: Full TypeScript coverage with strict mode
- **Code quality**: Comprehensive linting rules enforced
- **Consistency**: Automated formatting across codebase
- **Modern Standards**: Latest React patterns and best practices

## Next Technical Milestones

### Immediate (Tasks 1.5-1.8)
1. **Advanced UI Layout**: Leverage complete shadcn/ui component library
2. **Form Integration**: Implement React Hook Form + Zod patterns
3. **Type Definitions**: Core data structure types with Zod schemas
4. **IPC Testing**: Tauri-React communication validation

### Short-term (Tasks 2.0-3.0)
1. **PDF.js Integration**: Document rendering with enhanced components
2. **Text Selection**: Advanced overlay system with shadcn/ui
3. **File System**: PDF loading with better UX components

### Medium-term (Tasks 4.0-5.0)
1. **Python Environment**: pyo3 integration and LangGraph setup
2. **Database Setup**: PostgreSQL installation and schema creation
3. **AI Pipeline**: Streaming response with React Query integration

**Current Status**: Excellent modern foundation with complete component library, optimized build system, and production-ready frontend architecture. Ready for advanced feature development with best-in-class developer experience. 