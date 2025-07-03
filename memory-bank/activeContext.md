# Active Context: GeniusReads

**Status as of [Current Date]**

This document captures the current focus of development, recent decisions, and next steps. It is intended to be a "living document" that is updated frequently.

## 1. Current Development Focus

The primary focus is on stabilizing the core user workflow: **Read -> Chat -> Analyze -> Knowledge**. The foundational pieces are in place, but the connections between them need to be refined for a smoother user experience.

-   **UI/UX Polish:** Improving the visual feedback and flow of the three main tabs.
-   **Error Handling:** Implementing robust error handling for the AI processing pipeline.
-   **Performance Tuning:** Ensuring the UI remains responsive, especially during background analysis.

## 2. Recent Decisions & Changes

-   **Adopted "Database-First":** We have committed to using PostgreSQL as the single source of truth for all application state to simplify development and enhance data integrity.
-   **Finalized Core Shortcut:** The `CMD+K` shortcut is now implemented to transfer highlighted text from the `Library` to the active `Chat`. The `CMD+L` shortcut is implemented for toggling between the library and chat views.
-   **LangGraph for Concept Extraction:** The decision was made to use LangGraph for the AI pipeline due to its flexibility in defining stateful, multi-step AI workflows.

## 3. Next Steps & Priorities

### High Priority:
1.  **Implement Frontend for Analysis Status:** The UI needs to accurately reflect the state of a chat's analysis (`pending`, `processing`, `complete`, `failed`). This involves creating a polling mechanism from the frontend to a Rust command that checks the `langraph_processing` table.
2.  **Build the "Knowledge" Tab UI:** Create the initial UI for the `Knowledge` tab, displaying the extracted concepts as cards.
3.  **Refine Chat Context Management:** Ensure that adding multiple contexts to a single chat session is seamless and visually clear in the chat interface.

### Medium Priority:
4.  **User Preferences Page:** Build the UI for users to enter their OpenAI API key.
5.  **Error Handling in LangGraph:** What happens if the Python script fails? The error needs to be caught, logged to the database, and reflected in the UI.
6.  **Comprehensive Seeding Script:** Create a script to populate the database with sample documents and chats for easier testing.

### Low Priority:
7.  **Explore Concept Relationships:** Investigate how to use the `find_similar_concepts` function to show related concepts on a concept's detail page.
8.  **Add Theming:** Implement the light/dark/system theme toggle.

## 4. Open Questions

-   How should the system handle long-running analysis if the user quits the app? Should the process resume on next launch?
-   What is the best polling interval for checking analysis status without putting too much load on the database?
-   Should the first-time user experience include a tutorial or sample data? 