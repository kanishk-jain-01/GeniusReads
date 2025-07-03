# Tech Context: GeniusReads

This document outlines the key technologies, libraries, and tools used to build and run the GeniusReads application.

## 1. Frontend

-   **Framework:** React 18
-   **Language:** TypeScript
-   **Build Tool:** Vite
-   **UI Components:** shadcn/ui
    -   A collection of beautifully designed, composable components built on Radix UI and Tailwind CSS. This provides the core building blocks for the entire user interface.
-   **Styling:** Tailwind CSS
    -   A utility-first CSS framework for rapid UI development.
-   **State Management:** Zustand
    -   A small, fast, and scalable state-management solution. Used for minimal global UI state that doesn't need to be persisted in the database (e.g., toggle states of UI elements).
-   **Data Fetching:** TanStack Query (React Query)
    -   Manages server state, handling data fetching, caching, and synchronization with the Rust backend. Essential for the "database-first" architecture.
-   **PDF Rendering:** PDF.js
    -   A library for parsing and rendering PDF files in the browser, used for the `Library` tab.

## 2. Backend

-   **Framework:** Tauri (v2)
    -   The core framework for creating the macOS desktop application, managing the webview, and providing the bridge between the frontend and the Rust core.
-   **Language:** Rust
-   **Async Runtime:** Tokio
    -   The foundation for all asynchronous operations in the Rust backend.
-   **Database ORM/Driver:** SQLx
    -   A modern, async-safe SQL toolkit for Rust. Used for all interactions with the PostgreSQL database.
-   **Python Interoperability:** PyO3
    -   Provides the Rust bindings to the Python interpreter, allowing the Rust backend to execute Python code (specifically, the LangGraph pipeline).

## 3. Database

-   **Engine:** PostgreSQL
    -   The relational database serving as the single source of truth for all application data.
-   **Vector Support:** pgvector
    -   A PostgreSQL extension that enables storing and querying vector embeddings for similarity search.
-   **Migrations:**
    -   Schema changes are managed through plain SQL files in the `/migrations` directory. These need to be applied manually or with a tool like `sqlx-cli`.

## 4. AI & Machine Learning

-   **AI Orchestration:** LangGraph
    -   A library for building stateful, multi-actor applications with Large Language Models (LLMs). It defines the flow for analyzing chat conversations to extract concepts.
-   **Conversational AI:** OpenAI GPT-4 (or similar)
    -   The LLM used for the chat functionality. Requires the user to provide their own API key.
-   **Embeddings Model:** `sentence-transformers`
    -   A Python library for generating sentence and text embeddings. A specific model that produces 384-dimensional vectors is used to create the embeddings for concepts.

## 5. Development & Tooling

-   **Package Manager:** npm
-   **Linting:** ESLint (frontend), `cargo clippy` (backend)
-   **Formatting:** Prettier (frontend), `cargo fmt` (backend)
-   **Version Control:** Git 