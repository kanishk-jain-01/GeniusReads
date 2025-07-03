# GeniusReads

> Transform technical reading from a struggle into an interactive learning experience

GeniusReads is a macOS-native desktop application that revolutionizes technical reading by combining PDF viewing with AI-powered explanations and persistent knowledge management. Every confusing passage becomes an opportunity to build lasting knowledge.

## 🎯 Project Vision

**The Problem**: Technical reading presents fundamental barriers—unfamiliar terms, complex concepts, and dense explanations that disrupt comprehension and learning flow.

**Our Solution**: A unified application where users can:
- Load PDFs and read naturally
- Highlight confusing text for instant AI explanations
- Build a searchable knowledge corpus automatically
- Take personal notes linked to specific passages
- Review and connect concepts across documents

## 🚀 Key Features

### Core Functionality
- **PDF Viewing**: Native PDF rendering with smooth navigation
- **AI Explanations**: Highlight text → get instant "Explain like I'm 5" responses
- **Knowledge Building**: Automatic extraction and storage of concepts and definitions
- **Note-Taking**: Personal annotations linked to document locations
- **Smart Search**: Full-text search across accumulated knowledge

### Technical Highlights
- **Local-First**: All data remains on your machine
- **Offline Capable**: Knowledge corpus accessible without internet
- **Streaming Responses**: Real-time AI feedback for immediate value
- **Cross-Platform Ready**: Built with Tauri for future expansion

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern component architecture with hooks
- **TypeScript** - Type safety for complex interactions
- **Vite** - Lightning-fast build tool and dev server
- **TailwindCSS** - Utility-first styling *(planned)*
- **shadcn/ui** - Accessible component library *(planned)*
- **PDF.js** - Robust PDF rendering *(planned)*

### Backend
- **Tauri** - Rust-based desktop framework
- **Rust** - Systems programming for performance and safety
- **pyo3** - Python-Rust bridge for AI integration *(planned)*
- **PostgreSQL** - Local database for knowledge persistence *(planned)*

### AI & Processing
- **LangGraph** - AI workflow orchestration *(planned)*
- **LangChain** - Agent framework and tool integration *(planned)*
- **OpenAI GPT-4** - Primary language model *(planned)*

### Development Tools
- **ESLint** - Code quality and React best practices
- **Prettier** - Consistent code formatting
- **rustfmt** - Rust code formatting
- **clippy** - Advanced Rust linting
- **VS Code** - Optimized workspace configuration

## 📁 Project Structure

```
genius-reads/
├── src/                          # React frontend source
│   ├── Dashboard/               # Main application architecture
│   │   ├── index.tsx           # Central Dashboard orchestrator
│   │   ├── types.ts            # Dashboard-specific types
│   │   ├── hooks/              # Specialized modular hooks
│   │   │   ├── useDashboardState.ts     # State management
│   │   │   ├── useDashboardData.ts      # Data operations
│   │   │   ├── useDocumentHandlers.ts   # Document workflow
│   │   │   ├── useChatHandlers.ts       # Chat workflow
│   │   │   ├── useConceptHandlers.ts    # Knowledge workflow
│   │   │   └── useKeyboardShortcuts.ts  # Keyboard shortcuts
│   │   └── pages/              # Page components
│   │       ├── LibraryPage.tsx         # Document library
│   │       ├── ReaderPage.tsx          # PDF reading
│   │       ├── ChatPage.tsx            # Chat history
│   │       ├── ChatInterfacePage.tsx   # Active chat
│   │       ├── KnowledgePage.tsx       # Knowledge base
│   │       └── PreferencesPage.tsx     # User settings
│   ├── components/              # Reusable React components
│   │   ├── ui/                 # shadcn/ui component library
│   │   ├── chat/               # Chat-specific components
│   │   ├── PDFViewer.tsx       # PDF viewing component
│   │   └── Sidebar.tsx         # Navigation sidebar
│   ├── hooks/                   # Global custom React hooks
│   ├── lib/                     # Utilities and API clients
│   └── App.tsx                  # Minimal app wrapper with providers
├── src-tauri/                   # Rust backend
│   ├── src/                     # Rust source code
│   ├── icons/                   # Application icons
│   ├── capabilities/            # Tauri security capabilities
│   └── Cargo.toml              # Rust dependencies
├── memory-bank/                 # Project documentation
│   ├── projectbrief.md         # Core project identity
│   ├── productContext.md       # Why this exists
│   ├── systemPatterns.md       # Architecture decisions
│   ├── techContext.md          # Technology details
│   ├── activeContext.md        # Current work focus
│   └── progress.md             # Development status
├── tasks/                       # Implementation roadmap
│   ├── prd-genius-reads.md     # Product requirements
│   ├── tasks-prd-genius-reads.md # Detailed task breakdown
│   └── architecture-diagrams.md # System diagrams
├── .vscode/                     # VS Code workspace settings
├── eslint.config.js            # ESLint configuration
├── .prettierrc                 # Prettier formatting rules
└── package.json                # Frontend dependencies
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ with npm
- **Rust** 1.70+ with cargo
- **macOS** 10.15+ (primary target platform)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/genius-reads.git
   cd genius-reads
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run tauri dev
   ```

### Available Scripts

#### Frontend Development
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

#### Code Quality
```bash
npm run lint         # Check for linting errors
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format all code with Prettier
npm run format:check # Check if code is formatted
npm run type-check   # TypeScript type checking
```

#### Rust Development
```bash
npm run rust:fmt     # Format Rust code
npm run rust:lint    # Run clippy linting
npm run rust:check   # Check Rust compilation
```

#### Tauri Commands
```bash
npm run tauri dev    # Run development app
npm run tauri build  # Build production app
```

## 🔧 Development Workflow

### Code Quality Standards
We maintain high code quality through automated tooling:

- **ESLint** enforces React best practices and catches potential bugs
- **Prettier** ensures consistent formatting across all files
- **TypeScript** provides compile-time type safety
- **rustfmt** maintains consistent Rust code style
- **clippy** catches Rust performance issues and suggests improvements

### Before Committing
```bash
# Run all quality checks
npm run lint && npm run format:check && npm run type-check
npm run rust:lint && npm run rust:fmt

# Or run individual checks as needed
npm run lint:fix     # Auto-fix linting issues
npm run format       # Auto-format code
```

### VS Code Integration
The workspace is configured for optimal development experience:
- Format on save enabled
- Auto-fix ESLint issues on save
- Rust analyzer with clippy integration
- Proper file associations and exclusions

## 📋 Development Status

**Current Phase**: Foundation Setup  
**Tasks Completed**: 3/54 (5.6%)  
**Estimated Timeline**: 2-3 months for MVP

### ✅ Completed
- Tauri + React + TypeScript foundation
- Comprehensive development tooling setup
- Project documentation and task planning
- Git repository with proper commit standards

### 🚧 In Progress
- Rust dependency configuration
- macOS-specific Tauri settings
- PDF viewing system implementation

### 📅 Upcoming
- AI integration with LangGraph
- PostgreSQL knowledge storage
- Text selection and highlighting system

## 🤝 Contributing

This is currently a personal learning project, but the foundation is being built with best practices for future collaboration:

1. Follow the established code quality standards
2. Use conventional commit messages
3. Update documentation as you work
4. Test thoroughly before committing

## 📖 Documentation

- **Memory Bank**: Comprehensive project documentation in `/memory-bank/`
- **Task Planning**: Detailed implementation roadmap in `/tasks/`
- **Architecture**: System diagrams and technical decisions documented
- **Progress Tracking**: Regular updates on development milestones

## 🎯 Goals

**Short-term**: Complete foundation setup and basic PDF viewing  
**Medium-term**: Implement AI integration and knowledge storage  
**Long-term**: Polish UI/UX and prepare for user testing

---

**Built with** ❤️ **and modern development practices**

*"Strong foundations, great applications they create. Quality from the beginning, wisdom it shows."*
