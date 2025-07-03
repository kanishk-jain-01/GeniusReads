# Active Context: GeniusReads

**Status as of [Current Date]**

This document captures the current focus of development, recent decisions, and next steps. It is intended to be a "living document" that is updated frequently.

## 1. Current Development Focus

The primary focus has shifted from feature implementation to stabilization and testing. The core workflow (**Read -> Chat -> Analyze -> Knowledge**) is now feature-complete. The immediate goal is to ensure this entire pipeline is robust, performant, and bug-free before shipping.

-   **End-to-End Testing:** Manually testing the full user journey to identify bugs and usability issues.
-   **Performance Tuning:** Monitoring for and resolving any performance bottlenecks, especially in search and data loading.
-   **Bug Fixing:** Addressing any issues discovered during the testing phase.

## 2. Recent Decisions & Changes

-   **Adopted "Database-First":** We have committed to using PostgreSQL as the single source of truth for all application state.
-   **Finalized Core Shortcut:** The `CMD+K` and `CMD+L` shortcuts are implemented for seamless navigation between reading and chatting.
-   **LangGraph for Concept Extraction:** The decision was made to use LangGraph for the AI pipeline.
-   **Implemented Knowledge Base:** The Knowledge tab is fully functional, including a concept list, a detail view, and debounced, API-driven search. Navigation from concepts back to their source chats is implemented.

## 3. Next Steps & Priorities

### High Priority:
1.  **Thorough Manual Testing:** Conduct comprehensive end-to-end testing of the entire application workflow. This includes:
    -   Uploading and reading various PDFs.
    -   Initiating chats from text selections.
    -   Running the "Analyze" process on chats.
    -   Searching and browsing concepts in the Knowledge Base.
    -   Navigating from a concept to its detail page and back to the source chat.
2.  **Implement Frontend for Analysis Status:** The UI needs to accurately reflect the state of a chat's analysis (`pending`, `processing`, `complete`, `failed`).

### Medium Priority:
3.  **Error Handling in LangGraph:** Solidify the error handling for the Python-based AI pipeline. Errors should be caught, logged, and reflected in the UI.
4.  **User Preferences Page:** Build the UI for users to enter their OpenAI API key.

### Low Priority:
5.  **Comprehensive Seeding Script:** Create a script to populate the database with sample data for easier testing.
6.  **Explore Concept Relationships:** Investigate using vector search to show related concepts on a concept's detail page.

## 4. Open Questions

-   How should the system handle long-running analysis if the user quits the app? Should the process resume on next launch?
-   What is the best polling interval for checking analysis status without putting too much load on the database?
-   Should the first-time user experience include a tutorial or sample data? 