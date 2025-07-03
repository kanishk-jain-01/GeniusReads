# Product Context: GeniusReads

## 1. Vision & Philosophy

The vision for GeniusReads is to create a "second brain" for technical reading. It's not just a reader; it's a learning companion that helps users build durable, interconnected knowledge from the documents they study.

The core philosophy is **"Learn, don't just read."** Every feature is designed to reduce friction in the learning process, from understanding a single sentence to connecting ideas across a vast library of documents.

## 2. User Experience Goals

-   **Seamless Flow:** The user should be able to move effortlessly between reading (`Library`), questioning (`Chat`), and reviewing (`Knowledge`) without ever feeling like they are using three separate tools. The `CMD+K` (read to chat) and `CMD+L` (toggle read/chat) shortcuts are central to this goal.
-   **Zero Cognitive Overhead for Saving:** The application uses a "database-first" approach where every action is saved automatically and immediately. The user should never have to think about saving their work, be it a chat message or their reading position.
-   **Focus on the Content:** The UI should be clean, minimal, and unobtrusive, keeping the user's focus on the document and the AI-generated insights.
-   **Empowerment through Knowledge:** The ultimate goal is for the user to feel empowered by the knowledge base they build. The `Knowledge` tab should feel like a personal, explorable wiki of everything the user has learned.

## 3. Core User Journeys

### Journey 1: Clarifying a Difficult Concept
1.  **User:** Reading a complex paper in the `Library` tab.
2.  **User:** Encounters a paragraph they don't understand. They highlight it.
3.  **User:** Presses `CMD+K`.
4.  **System:** Instantly navigates to the `Chat` tab, creating a new chat session with the highlighted text as the first message.
5.  **User:** Asks the AI, "Can you explain this like I'm a beginner?"
6.  **System:** Streams a clear, simplified explanation.
7.  **User:** Feels confident, presses `CMD+L` to return to their exact reading spot in the `Library`.

### Journey 2: Building the Knowledge Base
1.  **User:** Has an insightful chat with the AI, exploring a core concept from a document.
2.  **User:** Clicks the "Analyze" button at the end of the chat.
3.  **System:** Shows a progress indicator as it processes the conversation in the background.
4.  **System:** Navigates the user to the `Knowledge` tab upon completion.
5.  **User:** Sees a new "Concept Card" for the topic they just discussed. They can click "Details" to navigate to a dedicated page for that concept.

### Journey 3: Revisiting and Connecting Knowledge
1.  **User:** Weeks later, is reading a different document on a related topic.
2.  **User:** Opens the `Knowledge` tab to see what they've already learned.
3.  **System:** The knowledge base contains concepts from all previous reading sessions, which can be searched and filtered.
4.  **User:** Clicks on a concept card's "Details" button.
5.  **System:** Navigates to the Concept Detail page, showing the concept's description, tags, and a list of all source conversations it was extracted from.
6.  **User:** Clicks "View Chat" on one of the sources to jump back to the original conversation for full context. 