# Product Requirements Document (PRD): GeniusReads

## Introduction/Overview

GeniusReads is a MacOS-native desktop application that helps curious learners deeply understand technical reading material through AI-powered conversations. Users can load PDFs, highlight confusing passages, press CMD+K to start AI conversations, and build a persistent local knowledge corpus of learned concepts through automated analysis.

**Problem it solves**: Technical reading often involves encountering unfamiliar terms, complex concepts, and dense explanations that create comprehension barriers. GeniusReads bridges this gap by providing instant, contextual AI conversations while building a personal knowledge base through automated concept extraction.

## Goals

1. **Reduce comprehension barriers** when reading technical material by providing instant AI conversations about highlighted text
2. **Build persistent knowledge** through automated concept extraction from chat conversations using LangGraph
3. **Enhance retention** by creating a searchable knowledge base of concepts with source traceability
4. **Streamline the learning process** with a three-tab interface that integrates PDF reading, AI conversations, and knowledge management

## User Stories

**As a curious learner, I want to:**
- Load PDF documents in the Library tab so I can read technical material within the app
- Highlight confusing text passages and press CMD+K to start an AI conversation about that content
- Have natural conversations with AI about highlighted text, with the ability to add more highlighted contexts from any document
- Use CMD+L to toggle between my current reading position and active chat without losing either context
- Have my conversations automatically saved as I chat without needing to manually save
- Choose to "End" my conversation (making it read-only) or "Analyze" it (ending + extracting concepts + navigating to Knowledge tab)
- Browse my accumulated knowledge in the Knowledge tab to see concepts learned across all documents
- Click on concepts to see the source conversations and book sections where I learned them
- See real-time progress when my chats are being analyzed for concept extraction

**As a researcher, I want to:**
- Navigate seamlessly between reading, discussing, and reviewing learned concepts
- Have my conversations automatically organized and searchable
- Build a comprehensive knowledge base that connects ideas across multiple documents

## Functional Requirements

### Three-Tab Interface
1. The system must provide three main navigation tabs: Library, Chat, and Knowledge
2. The system must maintain user's exact reading position when navigating between tabs
3. The system must support CMD+K to navigate from Library to Chat with highlighted text context
4. The system must support CMD+L to toggle between Library and Chat without ending active conversations

### Document Management (Library Tab)
5. The system must allow users to open PDF files from their local filesystem
6. The system must display PDF content page by page with clear navigation controls
7. The system must support PDF files up to 20MB in size
8. The system must remember the last opened document and exact reading position (page, zoom, scroll)

### Text Selection and Context Transfer
9. The system must allow users to select text passages using click-and-drag highlighting
10. The system must transfer selected text to Chat tab when CMD+K is pressed
11. The system must support adding multiple highlighted text contexts to the same active chat
12. The system must allow highlighted text contexts from different documents in the same chat
13. The system must display highlighted text contexts with clear visual distinction in chat interface

### AI Chat System (Chat Tab and Individual Chat Interface)
14. The Chat tab must display a chat list/history page with paginated cards showing previous conversations
15. The system must show chat previews, source document information, and analysis status on chat cards
16. The system must allow users to click on chat cards to open individual chat conversations
17. The individual chat interface must provide a ChatGPT-style interface with message bubbles and streaming responses
18. The system must display highlighted text contexts as the first message with visual highlighting
19. The system must support only one active chat at a time that accumulates highlighted contexts
20. CMD+K with selected text must navigate DIRECTLY to the active chat interface (bypassing chat list)
21. CMD+L must toggle between the active chat interface and current reading position

### Chat Management and Auto-Save
22. The system must automatically save all chat messages as they are sent (no manual save required)
23. The system must provide two actions when managing a chat: "End" or "Analyze"
24. The system must store chat conversations in local PostgreSQL database with real-time persistence
25. "End" must make the chat inactive and read-only, returning users to chat list or reading position
26. "Analyze" must end the chat session, trigger LangGraph concept extraction, and navigate to Knowledge tab
27. The system must track active chat state and navigation history in the database
28. The system must preserve all conversation history with proper analysis status tracking

### Knowledge Extraction and Analysis (Knowledge Tab)
29. The system must use LangGraph to extract concepts from chat conversations when user chooses "Analyze"
30. The system must show real-time progress indicators during concept extraction process
31. The system must store extracted concepts with vector embeddings using pgvector extension
32. The system must display concepts as categorized cards in the Knowledge tab
33. The system must make concept cards clickable, leading to detailed pages showing source chats and book sections
34. The system must link concepts back to their source conversations and document locations
35. The system must automatically navigate to Knowledge tab after successful analysis completion

### Data Persistence and Performance
36. The system must use PostgreSQL for all data storage (no caching layer)
37. The system must maintain user session state across app restarts
38. The system must provide fast navigation between views without data loss
39. The system must handle LangGraph processing in background without blocking UI
40. The system must paginate chat lists and concept displays for performance
41. The system must persist active chat state, reading position, and navigation history in database

## Non-Goals (Out of Scope for MVP)

- **Multiple active chats** - Only one active chat session at a time
- **Real-time collaboration** - Single-user application only
- **Cloud synchronization** - All data remains local
- **Advanced chat organization** - Simple chronological ordering initially
- **Complex keyboard shortcuts** - Only CMD+K and CMD+L for MVP
- **Chat export functionality** - Focus on in-app knowledge building
- **Voice input** - Text-based interactions only
- **PDF editing capabilities** - Read-only PDF interaction
- **Web search integration** - Pure AI conversation initially (future enhancement)
- **Manual save operations** - All saving happens automatically

## Design Considerations

### Three-Tab Interface Design
- **Library Tab**: PDF viewer with text selection and highlighting capabilities
- **Chat Tab**: Two-state interface (chat list page and active chat interface)
- **Knowledge Tab**: Concept cards with detailed concept pages
- **Navigation**: Seamless tab switching with preserved state

### Chat Interface Design
- **ChatGPT-style**: Message bubbles with streaming response animation
- **Context Display**: Highlighted text shown with visual distinction and source metadata
- **Auto-Save**: All messages automatically persisted as they're sent
- **Action Buttons**: Clear "End" (read-only) and "Analyze" (extract + navigate) options
- **Progress Indicators**: Real-time feedback during LangGraph processing

### Knowledge Base Design
- **Card Layout**: Concept cards showing name, description, and source count
- **Detailed Views**: Concept pages with source conversations and document references
- **Loading States**: Progress indicators for background concept extraction
- **Automatic Navigation**: Seamless transition from analysis to knowledge viewing

## Technical Considerations

### Architecture
- **Frontend**: React with three-tab navigation using existing sidebar pattern
- **Backend**: Rust with Tauri framework and embedded Python via pyo3
- **AI Processing**: LangGraph for concept extraction, OpenAI GPT-4 for conversations
- **Database**: PostgreSQL with pgvector extension for semantic search
- **PDF Rendering**: Existing PDF.js integration

### Database-First Approach
- **State Management**: All application state stored in PostgreSQL
- **Session Persistence**: User navigation state and active chats survive app restarts
- **Performance**: Rely on PostgreSQL performance with proper indexing
- **Simplicity**: Single source of truth, no cache invalidation complexity
- **Real-time Persistence**: Messages saved immediately as they're sent

### Key Dependencies
- `pyo3` for Python-Rust interoperability
- `tauri` for desktop app framework
- `sqlx` for PostgreSQL integration with pgvector support
- LangGraph and LangChain for AI orchestration and concept extraction
- OpenAI API for conversational AI
- Existing PDF.js and shadcn/ui components

## Success Metrics

Success will be determined by personal satisfaction and usability during development and testing, focusing on:
- Smooth navigation between reading, chatting, and knowledge review
- Effective concept extraction and knowledge base building
- Intuitive user experience with minimal learning curve
- Seamless auto-save functionality without user intervention
- Clear and predictable behavior of End and Analyze actions

## Open Questions

1. **Concept Similarity Threshold**: What vector similarity score should determine related concepts?
2. **Processing Queue**: Should concept extraction be immediate or batched for multiple chats?
3. **Knowledge Organization**: Should concepts be auto-categorized or user-organized?
4. **Chat History Limits**: Should there be limits on chat history storage or processing?
5. **Error Recovery**: How should the system handle LangGraph processing failures?
6. **Future Enhancements**: How should the architecture support planned web search integration?

---

**Document Status**: Updated for current auto-save workflow with End/Analyze actions  
**Target Audience**: Junior developers  
**Implementation Priority**: MVP features with database-first architecture 