# Technical Context: GeniusReads

## Technology Stack ✅ Complete Implementation

### Frontend Technologies (Fully Operational)
- **React 18.2.0**: Component-based UI with concurrent features ✅
- **TypeScript 5.2.2**: Static typing with strict mode enabled ✅
- **Vite 5.0.8**: Build tool with SWC plugin for performance ✅
- **TailwindCSS 3.4.11**: Utility-first CSS framework ✅
- **shadcn/ui**: Complete component library (40+ components) ✅
- **React Hook Form 7.48.2**: Form management with validation ✅
- **Zod 3.22.4**: Schema validation and type inference ✅
- **React Query 4.36.1**: Server state management ✅
- **React Router 6.20.1**: Client-side routing ✅
- **Lucide React**: Modern icon library ✅
- **date-fns**: Date manipulation utilities ✅

### Backend Technologies (Fully Configured)
- **Rust 1.70+**: Systems programming language ✅
- **Tauri 2.0**: Desktop application framework ✅
- **sqlx 0.8**: Async PostgreSQL driver with compile-time verification ✅
- **tokio 1.0**: Async runtime with full features ✅
- **serde 1.0**: Serialization framework ✅
- **pyo3 0.22**: Python-Rust interoperability ✅
- **anyhow 1.0**: Error handling ✅
- **thiserror 1.0**: Custom error types ✅
- **tracing**: Structured logging ✅
- **uuid 1.0**: UUID generation and handling ✅
- **chrono 0.4**: Date and time handling ✅
- **bigdecimal 0.4**: Decimal precision for PostgreSQL ✅

### Database Technology (Complete Infrastructure with Chat System)
- **PostgreSQL 14+**: Primary database with full-text search ✅
- **Database Schema**: 12 core tables with relationships ✅
- **Chat System Tables**: 4 new tables for chat sessions and navigation state ✅
- **Migrations**: Initial schema with comprehensive chat support ✅
- **Indexes**: Performance optimization for all queries ✅
- **Full-text Search**: Native PostgreSQL search capabilities ✅
- **Database Views**: Efficient aggregations for chat summaries ✅

### AI/ML Technologies (Infrastructure Ready)
- **Python 3.11+**: AI processing environment 🚧
- **OpenAI GPT-4**: Primary language model (ready for integration) 🚧
- **LangGraph**: AI workflow orchestration 🚧
- **LangChain**: AI agent framework 🚧
- **pyo3**: Python-Rust bridge (configured) ✅

### Development Tools (Fully Configured)
- **ESLint**: Frontend linting with React rules ✅
- **Prettier**: Code formatting ✅
- **rustfmt**: Rust code formatting ✅
- **clippy**: Rust linting ✅
- **TypeScript Compiler**: Type checking ✅
- **SQLx Query Cache**: Compile-time SQL verification ✅

## Development Environment ✅ Complete Setup

### System Requirements
- **macOS**: Primary target platform ✅
- **Node.js 18+**: Frontend development ✅
- **Rust 1.70+**: Backend development ✅
- **PostgreSQL 14+**: Database server ✅
- **Python 3.11+**: AI processing 🚧

### Build Configuration (Fully Operational)

#### Frontend Build (Vite)
```javascript
// vite.config.ts - Optimized for performance
export default defineConfig({
  plugins: [react({ plugins: [["@swc/plugin-styled-components", {}]] })],
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  envPrefix: ["VITE_", "TAURI_"],
  build: { target: "esnext", minify: !process.env.TAURI_DEBUG }
});
```

#### Backend Build (Cargo)
```toml
# Cargo.toml - Complete dependency configuration
[dependencies]
tauri = { version = "2.0", features = ["macos-private-api"] }
sqlx = { version = "0.8", features = ["runtime-tokio-rustls", "postgres", "uuid", "chrono", "json"] }
tokio = { version = "1.0", features = ["full"] }
pyo3 = { version = "0.22", features = ["auto-initialize"] }
# ... additional dependencies configured
```

### Database Configuration (Complete Schema with Chat System)
```sql
-- PostgreSQL schema with 12 core tables including chat system
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat system tables
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    preview_text TEXT,
    source_document_count INTEGER NOT NULL DEFAULT 0,
    analysis_status VARCHAR(20) NOT NULL DEFAULT 'none',
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sender_type VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE highlighted_contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    document_title VARCHAR(500) NOT NULL,
    page_number INTEGER NOT NULL,
    selected_text TEXT NOT NULL,
    text_coordinates JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE user_session_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    current_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    current_page INTEGER NOT NULL DEFAULT 1,
    zoom_level INTEGER NOT NULL DEFAULT 100,
    scroll_position INTEGER NOT NULL DEFAULT 0,
    active_tab VARCHAR(20) NOT NULL DEFAULT 'library',
    active_chat_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    last_reading_position JSONB,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
-- ... 8 additional tables with relationships and indexes
```

## Technical Constraints ✅ Addressed

### Platform Constraints
- **macOS Focus**: Tauri configured for macOS-specific features ✅
- **Desktop Only**: No web deployment considerations ✅
- **Local Storage**: PostgreSQL for offline-first experience ✅

### Performance Constraints
- **Memory Usage**: Efficient PDF rendering with lazy loading ✅
- **Startup Time**: Optimized builds with tree shaking ✅
- **Database Performance**: Proper indexing and connection pooling ✅
- **Response Time**: Infrastructure ready for AI streaming 🚧

### Security Constraints
- **File System Access**: Tauri permissions for PDF files ✅
- **Database Security**: Local PostgreSQL with proper permissions ✅
- **AI API Keys**: Secure storage and transmission (ready for implementation) 🚧

## Dependencies ✅ Complete Management

### Frontend Dependencies (package.json)
```json
{
  "dependencies": {
    "@hookform/resolvers": "^3.3.2",
    "@radix-ui/react-*": "Latest stable versions",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.48.2",
    "react-query": "^4.36.1",
    "react-router-dom": "^6.20.1",
    "tailwindcss": "^3.4.11",
    "typescript": "^5.2.2",
    "zod": "^3.22.4"
  }
}
```

### Backend Dependencies (Cargo.toml)
```toml
[dependencies]
anyhow = "1.0"
bigdecimal = "0.4"
chrono = { version = "0.4", features = ["serde"] }
pyo3 = { version = "0.22", features = ["auto-initialize"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
sqlx = { version = "0.8", features = ["runtime-tokio-rustls", "postgres", "uuid", "chrono", "json"] }
tauri = { version = "2.0", features = ["macos-private-api"] }
thiserror = "1.0"
tokio = { version = "1.0", features = ["full"] }
tracing = "0.1"
tracing-subscriber = "0.3"
uuid = { version = "1.0", features = ["v4", "serde"] }
```

## Integration Points ✅ Comprehensive Implementation

### Tauri-React Communication (24 Commands)
- **Commands**: Rust functions exposed to frontend ✅
- **Events**: Bidirectional communication ✅
- **Type Safety**: Shared type definitions ✅
- **Error Handling**: Proper error propagation ✅
- **Testing**: Verified with comprehensive command set ✅
- **Chat Operations**: 12 new commands for chat and navigation management ✅

### Database Integration (Complete Chat System)
- **Connection Pooling**: sqlx with async connections ✅
- **Query Safety**: Compile-time SQL verification ✅
- **Type Mapping**: Rust types to PostgreSQL ✅
- **Migrations**: Schema versioning and updates ✅
- **Performance**: Indexed queries and full-text search ✅
- **Chat Persistence**: All chat sessions and messages stored ✅
- **Navigation State**: User session tracking and restoration ✅

### Component Integration (Complete Chat Interface)
- **shadcn/ui**: Complete component library ✅
- **React Hook Form**: Form validation with Zod ✅
- **React Query**: Server state management ✅
- **React Router**: Client-side navigation ✅
- **TailwindCSS**: Utility classes and design system ✅
- **Chat Components**: ChatGPT-style interface with real-time updates ✅

## Development Workflow ✅ Optimized

### Build Process
1. **Frontend**: Vite + SWC for fast compilation ✅
2. **Backend**: Cargo with optimized builds ✅
3. **Database**: Migration scripts for schema updates ✅
4. **Type Safety**: End-to-end TypeScript coverage ✅
5. **SQLx Cache**: Compile-time query verification ✅

### Code Quality (Maintained Through Major Development)
1. **Linting**: ESLint for frontend, Clippy for backend ✅
2. **Formatting**: Prettier for frontend, rustfmt for backend ✅
3. **Type Checking**: TypeScript strict mode ✅
4. **Testing**: Comprehensive validation with real user interactions ✅
5. **Database Testing**: All chat operations tested with real data ✅

### Development Server
1. **Hot Reload**: Vite dev server with fast refresh ✅
2. **Auto Rebuild**: Cargo watch for backend changes ✅
3. **Database**: Local PostgreSQL with comprehensive chat data ✅
4. **IPC Testing**: Verified communication layer with 24 commands ✅

## Future Technical Considerations

### Scalability (Enhanced with Chat System)
- **Database Growth**: PostgreSQL handles large chat history and knowledge corpus
- **Chat Performance**: Efficient queries with proper indexing for message history
- **Navigation State**: Optimized user session tracking across app restarts
- **AI Processing**: Python environment scaling with usage (next phase)
- **File Handling**: Efficient PDF processing for large documents

### Maintenance (Production Ready)
- **Dependency Updates**: Regular updates for security and features
- **Database Migrations**: Schema evolution as features expand
- **Performance Monitoring**: Metrics for optimization opportunities
- **Chat Data Management**: Efficient storage and retrieval of conversation history
- **Error Handling**: Comprehensive error management throughout the system

### Extension Points (Ready for AI Integration)
- **OpenAI API**: Infrastructure ready for GPT-4 integration
- **Streaming Responses**: Database and UI components ready for real-time AI
- **Plugin System**: Tauri plugin architecture for new features
- **AI Models**: Swappable AI backends for different use cases
- **Export Formats**: Chat and knowledge export in various formats

**Current Status**: Complete technical foundation with comprehensive chat interface system implemented. Database-first architecture provides reliable state management with 24 Tauri commands for full CRUD operations. Ready for OpenAI API integration with enterprise-grade infrastructure and professional-quality user experience. 