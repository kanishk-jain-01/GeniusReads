# Product Requirements Document (PRD): GeniusReads

## Introduction/Overview

GeniusReads is a MacOS-native desktop application that helps curious learners deeply understand technical reading material through AI-powered explanations. Users can load PDFs (papers, textbooks, blogs, books), highlight confusing passages, ask questions, and receive contextual explanations. The app builds a persistent local knowledge corpus of learned concepts, definitions, and notes to enhance long-term retention and understanding.

**Problem it solves**: Technical reading often involves encountering unfamiliar terms, complex concepts, and dense explanations that can overwhelm readers. GeniusReads bridges this gap by providing instant, contextual AI explanations while building a personal knowledge base for future reference.

## Goals

1. **Reduce comprehension barriers** when reading technical material by providing instant AI explanations
2. **Build persistent knowledge** through automatic glossary creation and concept tracking
3. **Enhance retention** by allowing users to take notes and review previously learned concepts
4. **Streamline the learning process** with a single application that combines PDF viewing, AI assistance, and knowledge management

## User Stories

**As a curious learner, I want to:**
- Load a PDF document so that I can read technical material within the app
- Highlight confusing text passages so that I can get AI explanations for difficult concepts
- Ask follow-up questions about explanations so that I can deepen my understanding
- View my accumulated knowledge in a sidebar so that I can quickly reference previously learned concepts
- Take notes on passages so that I can capture my own insights and thoughts
- Access my knowledge corpus offline so that I can review learned concepts anytime
- See definitions of technical terms so that I can build my vocabulary over time

**As a researcher, I want to:**
- Navigate through PDF pages easily so that I can focus on reading rather than UI complexity
- Have my questions and answers automatically saved so that I can build a searchable knowledge base
- Stream AI responses so that I don't have to wait for complete processing before seeing results

## Functional Requirements

### Document Management
1. The system must allow users to open PDF files from their local filesystem
2. The system must display PDF content page by page with clear navigation controls
3. The system must support PDF files up to 20MB in size
4. The system must allow only one PDF to be open at a time (MVP constraint)
5. The system must remember the last opened document and page position

### Text Interaction
6. The system must allow users to select text passages using click-and-drag highlighting
7. The system must visually indicate selected text with highlighting
8. The system must provide a text input box for users to ask questions about selected passages
9. The system must support follow-up questions without requiring text re-selection
10. The system must clear selections when opening a new document or navigating pages

### AI-Powered Explanations
11. The system must send selected text and user questions to an AI agent for processing
12. The system must stream AI responses to provide immediate feedback
13. The system must format AI responses with clear sections: explanation, definitions, and related information
14. The system must use "Explain like I'm 5" tone for all explanations (MVP default)
15. The system must handle AI service errors gracefully with user-friendly error messages

### Knowledge Corpus
16. The system must automatically save every question-answer pair to local storage
17. The system must extract and store technical term definitions from AI responses
18. The system must display accumulated knowledge in a collapsible sidebar
19. The system must allow users to search through their saved knowledge
20. The system must organize knowledge by document, date, and concept tags
21. The system must provide a detailed knowledge view in a separate tab/panel

### Note-Taking
22. The system must allow users to add personal notes to any selected text passage
23. The system must save notes locally and associate them with specific document locations
24. The system must display note indicators on passages that have associated notes
25. The system must allow editing and deletion of existing notes

### Data Persistence
26. The system must use PostgreSQL for local data storage
27. The system must maintain data integrity across app sessions
28. The system must store document metadata (title, author, file path, access date)
29. The system must preserve user data even when documents are moved or renamed

## Non-Goals (Out of Scope for MVP)

- **PDF editing capabilities** - Users cannot modify PDF content
- **Voice input** - Users will rely on typing or third-party speech-to-text tools
- **Multiple document support** - Only one PDF open at a time
- **Cloud synchronization** - All data remains local
- **Citation management** - Not a reference manager
- **Advanced note formatting** - Basic text notes only
- **Document annotation tools** - No drawing, shapes, or markup tools beyond highlighting
- **Multiple AI tone options** - Only "Explain like I'm 5" for MVP
- **Document sharing** - No collaboration features
- **Export functionality** - Cannot export knowledge corpus or notes

## Design Considerations

### User Interface
- **Main Layout**: PDF viewer takes center stage with collapsible knowledge sidebar
- **Responsive Design**: Sidebar can be hidden to maximize reading space
- **Question Interface**: Floating or bottom-panel text input that appears when text is selected
- **Visual Hierarchy**: Clear distinction between AI explanations, definitions, and user notes
- **Loading States**: Progress indicators for AI processing and streaming responses

### Component Architecture
- PDF viewer component using PDF.js
- Resizable sidebar component for knowledge panel
- Modal or expandable panel for detailed knowledge view
- Text selection overlay system
- Streaming response display component

## Technical Considerations

### Architecture
- **Frontend**: React with Vite, TailwindCSS, and shadcn/ui components
- **Backend**: Rust with Tauri framework
- **Python Integration**: Use `pyo3` crate to embed Python directly in Rust backend
- **AI Processing**: LangGraph embedded via Python, using OpenAI GPT-4
- **Database**: Local PostgreSQL instance
- **PDF Rendering**: PDF.js for cross-platform compatibility

### Key Dependencies
- `pyo3` for Python-Rust interoperability
- `tauri` for desktop app framework
- `sqlx` or `diesel` for PostgreSQL integration
- LangGraph and LangChain for AI orchestration
- OpenAI API for language model access
- Tavily API for web search capabilities

### Performance Considerations
- Lazy loading of PDF pages for large documents
- Efficient text selection handling
- Streaming AI responses to improve perceived performance
- Local database indexing for fast knowledge search

## Success Metrics

As requested, no specific success metrics are defined for the MVP. Success will be determined by personal satisfaction and usability during development and testing.

## Open Questions

1. **Python Environment Management**: How should the embedded Python environment handle package dependencies and updates?
2. **Database Setup**: Should PostgreSQL installation be automated, or require manual setup?
3. **AI Model Fallbacks**: What should happen when OpenAI API is unavailable?
4. **Knowledge Export**: While not in MVP scope, should the data schema support future export functionality?
5. **Text Selection Persistence**: Should highlighted text remain visible when returning to a page?
6. **Search Implementation**: Should knowledge search be full-text or keyword-based?
7. **Note Formatting**: Should notes support basic markdown formatting in future versions?

---

**Document Status**: Ready for development  
**Target Audience**: Junior developers  
**Implementation Priority**: MVP features only 