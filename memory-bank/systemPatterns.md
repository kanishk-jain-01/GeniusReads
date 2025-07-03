# System Patterns: GeniusReads

## 1. Core Architecture

GeniusReads is a Tauri application, which combines a Rust backend with a web-based frontend (React). This hybrid architecture allows for native performance and system access via Rust, while leveraging the rich UI capabilities of the web ecosystem.

```mermaid
graph TD
    subgraph Frontend (React/Vite)
        A[UI Components]
        B[Dashboard Pages]
        C[State Management]
    end

    subgraph Backend (Rust/Tauri)
        D[Tauri Core]
        E[Rust Commands]
        F[Database Logic]
        G[Python Bridge]
    end

    subgraph Database (PostgreSQL)
        H[Schema & Tables]
        I[pgvector]
    end

    subgraph AI (Python)
        J[LangGraph Pipeline]
        K[Sentence Transformers]
    end

    A --> B
    B -- Tauri API --> E
    C -- Tauri API --> E
    E --> F
    F -- SQLx --> H
    H -- uses --> I
    E --> G
    G -- PyO3 --> J
    J -- uses --> K
```

## 2. The "Database-First" Pattern

The most critical architectural pattern in GeniusReads is the **"database-first"** approach.

-   **Single Source of Truth:** The PostgreSQL database is the undisputed source of truth for *all* application state. This includes user data (documents, chats) as well as UI state (current reading position, active chat ID, selected tab).
-   **No Application Cache:** There is no intermediate caching layer (like Redis) or complex frontend state synchronization. The application reads directly from and writes directly to the database.
-   **Benefits:**
    -   **Simplicity:** Eliminates a whole class of state management bugs related to cache invalidation and data consistency.
    -   **Resilience:** The application's state is durable and survives restarts by default. If the app is closed, it can restore the user's exact context by reading from the database.
    -   **Real-time Persistence:** Actions like sending a chat message are committed to the database immediately, preventing data loss.
-   **Implementation:**
    -   The Rust backend exposes Tauri commands that perform CRUD operations on the database.
    -   The React frontend uses these commands for all state interactions, often re-fetching data from the backend after a mutation. Tools like `@tanstack/react-query` help manage this data fetching lifecycle.

## 3. Asynchronous AI Processing via LangGraph

Concept extraction is a potentially long-running process that must not block the UI.

-   **Trigger:** The process is initiated when the user clicks "Analyze" on a chat session.
-   **Mechanism:**
    1.  The frontend calls a Tauri command in Rust.
    2.  The Rust command updates the chat's status to "processing" in the database.
    3.  Rust then calls a Python script via `PyO3`, passing the chat content.
    4.  The Python script runs the **LangGraph pipeline** to perform concept extraction and embedding generation. This happens in a separate thread/process.
    5.  As concepts are extracted, they are saved back to the database.
    6.  Once complete, the pipeline updates the chat's status to "complete".
-   **Frontend Polling:** The frontend can poll the database (via a dedicated Tauri command) to get the status of the analysis and update the UI accordingly (e.g., showing a loading spinner and then navigating to the `Knowledge` tab on completion).

## 4. Vector Search for Knowledge Retrieval

The `pgvector` extension is used to find related concepts.

-   **Embedding:** When concepts are extracted, a 384-dimensional vector embedding is generated for each one using a `sentence-transformers` model.
-   **Indexing:** The `concepts` table has an HNSW (Hierarchical Navigable Small World) index on the `embedding` column, which allows for extremely fast approximate nearest-neighbor searches.
-   **Querying:** The application can find concepts similar to a given text by:
    1.  Generating an embedding for the search query.
    2.  Using a SQL query with the cosine similarity operator (`<=>`) to find the closest vectors in the `concepts` table.
    3.  This is encapsulated in the `find_similar_concepts` PostgreSQL function for easy use. 