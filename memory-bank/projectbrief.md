# Project Brief: GeniusReads

## Core Project Identity

**GeniusReads** is a macOS-native desktop application that revolutionizes technical reading by combining PDF viewing with AI-powered explanations and persistent knowledge management.

## Primary Goals

1. **Eliminate comprehension barriers** in technical reading through instant AI explanations
2. **Build persistent knowledge** via automatic concept tracking and glossary creation
3. **Enhance long-term retention** through integrated note-taking and knowledge review
4. **Streamline learning workflow** in a single, cohesive application

## Core Value Proposition

Transform technical reading from a struggle with unfamiliar concepts into an interactive learning experience where every confusing passage becomes an opportunity to build lasting knowledge.

## Technical Foundation

- **Platform**: macOS desktop application using Tauri framework
- **Frontend**: React with TypeScript, TailwindCSS, and shadcn/ui
- **Backend**: Rust with embedded Python via pyo3
- **AI Engine**: LangGraph with OpenAI GPT-4 for explanations
- **Storage**: Local PostgreSQL for knowledge persistence
- **PDF Engine**: PDF.js for document rendering and text extraction

## Key Constraints

- **MVP Scope**: Single PDF at a time, "Explain like I'm 5" tone only
- **Local-First**: All data remains on user's machine
- **Offline Capable**: Knowledge corpus accessible without internet
- **Performance**: Streaming AI responses, efficient text selection

## Success Definition

A functional macOS app where users can load PDFs, highlight confusing text, receive AI explanations, and build a searchable knowledge base of learned concepts.

## Project Status

**Phase**: Initial Development Planning
**Current Focus**: Task list generation and architecture planning
**Next Milestone**: Tauri application foundation setup 