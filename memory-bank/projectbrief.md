# Project Brief: GeniusReads

## 1. Overview

GeniusReads is a local-first, AI-powered PDF reader for macOS designed to help users deeply understand technical documents. It provides a seamless workflow for reading, questioning, and building a persistent, personal knowledge base from the material.

## 2. Problem Statement

Technical reading is often challenging due to dense information, complex concepts, and unfamiliar terminology. Readers lack an integrated tool to immediately clarify confusion and consolidate their learnings without breaking their focus. Existing solutions require switching between a PDF reader, a web browser for research, and a separate note-taking app, leading to a fragmented and inefficient learning process.

## 3. Core Objectives

1.  **Enhance Comprehension:** Provide instant, contextual AI-driven explanations for highlighted text within a PDF.
2.  **Build a Knowledge Corpus:** Automatically extract and store key concepts from AI conversations to create a personal, long-term knowledge base.
3.  **Improve Learning Workflow:** Integrate reading, AI-assisted learning, and knowledge review into a single, unified application.
4.  **Ensure Privacy and Ownership:** Keep all user data (documents, chats, knowledge) stored locally on the user's machine.

## 4. Target Audience

-   **Students & Academics:** Researchers and students dealing with scientific papers and textbooks.
-   **Software Engineers & Professionals:** Individuals reading technical documentation, whitepapers, and books to stay current in their field.
-   **Curious Learners:** Anyone looking to deeply engage with and understand complex subjects presented in PDF format.

## 5. High-Level Scope

The application will consist of three primary views:

1.  **Library:** For opening and reading PDF documents.
2.  **Chat:** For having AI conversations about highlighted text.
3.  **Knowledge:** For browsing the automatically generated knowledge base of learned concepts.

### Key Features:
-   PDF viewer with text highlighting.
-   `CMD+K` shortcut to initiate a chat from selected text.
-   A single, "active" chat session that can accumulate context from multiple highlights (and even multiple documents).
-   "Analyze" feature to process a completed chat, extract concepts using a LangGraph pipeline, and populate the knowledge base.
-   A searchable knowledge base that links concepts back to their source documents and conversations.
-   All state persisted in a local PostgreSQL database. 