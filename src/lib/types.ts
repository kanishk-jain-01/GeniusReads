// Core application types for GeniusReads
// Based on data model from PRD and system architecture

// ============================================================================
// Document Management Types
// ============================================================================

export interface Document {
  id: string;
  title: string;
  author?: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  totalPages: number;
  currentPage: number;
  zoomLevel: number;
  lastAccessed: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    subject?: string;
    keywords?: string[];
    creationDate?: Date;
    modificationDate?: Date;
    producer?: string;
  };
}

export interface DocumentSession {
  documentId: string;
  currentPage: number;
  zoomLevel: number;
  scrollPosition: number;
  readingProgress: number; // Percentage 0-100
  timeSpent: number; // Seconds
  lastActivity: Date;
}

// ============================================================================
// Text Selection and Interaction Types
// ============================================================================

export interface TextSelection {
  id: string;
  documentId: string;
  pageNumber: number;
  selectedText: string;
  startCoordinate: {
    x: number;
    y: number;
  };
  endCoordinate: {
    x: number;
    y: number;
  };
  boundingBoxes: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  createdAt: Date;
}

export interface Question {
  id: string;
  documentId: string;
  selectionId: string;
  questionText: string;
  context: string; // The selected text that prompted the question
  pageNumber: number;
  askedAt: Date;
  status: 'pending' | 'answered' | 'failed';
}

// ============================================================================
// AI Processing and Response Types
// ============================================================================

export interface AIResponse {
  id: string;
  questionId: string;
  responseText: string;
  explanation: string;
  definitions: Definition[];
  relatedConcepts: string[];
  confidence: number; // 0-1 confidence score
  processingTime: number; // Milliseconds
  model: string; // AI model used (e.g., "gpt-4")
  tone: 'explain-like-im-5'; // MVP only supports one tone
  createdAt: Date;
  status: 'streaming' | 'complete' | 'error';
}

export interface Definition {
  term: string;
  definition: string;
  context: string;
  source: 'ai-generated' | 'user-provided';
}

export interface StreamingChunk {
  responseId: string;
  chunkIndex: number;
  content: string;
  isComplete: boolean;
  timestamp: Date;
}

// ============================================================================
// Knowledge Management Types
// ============================================================================

export interface KnowledgeEntry {
  id: string;
  documentId: string;
  concept: string;
  definition: string;
  explanation: string;
  context: string; // Where this was learned (page, section)
  pageNumber: number;
  tags: string[];
  relatedConcepts: string[];
  source: 'ai-explanation' | 'user-note' | 'definition-extraction';
  confidence: number; // How well understood (0-1)
  reviewCount: number;
  lastReviewed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Concept extracted by LangGraph from chat conversations
export interface Concept {
  id: string;
  name: string;
  description: string;
  tags: string[];
  confidenceScore: number; // 0.0-1.0
  sourceChatCount: number;
  createdAt: Date;
  updatedAt: Date;
  // Optional fields for detailed view
  sourceChatTitles?: string[];
  linkedChatCount?: number;
  avgRelevanceScore?: number;
}

export interface ConceptSourceChat {
  id: string;
  title: string;
  relevanceScore: number;
  createdAt: Date;
}

export interface ConceptDetail extends Concept {
  sourceChats: ConceptSourceChat[];
}

export interface UserNote {
  id: string;
  documentId: string;
  selectionId?: string; // Optional link to text selection
  pageNumber: number;
  noteText: string;
  noteType: 'personal-insight' | 'summary' | 'question' | 'highlight';
  position?: {
    x: number;
    y: number;
  };
  tags: string[];
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Search and Discovery Types
// ============================================================================

export interface SearchIndex {
  id: string;
  entityType: 'knowledge-entry' | 'user-note' | 'ai-response' | 'document';
  entityId: string;
  searchableText: string;
  keywords: string[];
  documentId: string;
  pageNumber?: number;
  weight: number; // Search relevance weight
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchQuery {
  query: string;
  filters?: {
    documentId?: string;
    entityType?: SearchIndex['entityType'];
    tags?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  sortBy?: 'relevance' | 'date' | 'confidence';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  id: string;
  entityType: SearchIndex['entityType'];
  entityId: string;
  title: string;
  snippet: string;
  relevanceScore: number;
  documentTitle: string;
  pageNumber?: number;
  tags: string[];
  createdAt: Date;
  highlightedText?: string;
}

// ============================================================================
// Application State Types
// ============================================================================

export interface AppState {
  currentDocument?: Document;
  currentSession?: DocumentSession;
  activeSelection?: TextSelection;
  pendingQuestion?: Question;
  streamingResponse?: AIResponse;
  sidebarOpen: boolean;
  sidebarTab: 'knowledge' | 'notes' | 'search';
  theme: 'light' | 'dark' | 'system';
}

export interface UserPreferences {
  defaultZoomLevel: number;
  autoSaveNotes: boolean;
  aiResponseTone: 'explain-like-im-5'; // MVP only
  sidebarDefaultTab: 'knowledge' | 'notes' | 'search';
  rememberLastDocument: boolean;
  enableNotifications: boolean;
  maxRecentDocuments: number;
}

// ============================================================================
// API and Communication Types
// ============================================================================

export interface TauriCommand<T = Record<string, unknown>> {
  command: string;
  payload?: T;
}

export interface TauriResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

// PDF-related commands
export interface OpenPDFCommand {
  filePath: string;
}

export interface ExtractTextCommand {
  documentId: string;
  pageNumber: number;
  selection: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  };
}

// AI processing commands
export interface ProcessQuestionCommand {
  questionId: string;
  questionText: string;
  context: string;
  documentContext?: {
    title: string;
    author?: string;
    pageNumber: number;
  };
}

// Database operation types
export interface DatabaseQuery<T = Record<string, unknown>> {
  query: string;
  params?: unknown[];
  returning?: T;
}

// ============================================================================
// Error Handling Types
// ============================================================================

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: Date;
  context?: {
    component: string;
    action: string;
    documentId?: string;
  };
}

export type ErrorCode = 
  | 'PDF_LOAD_FAILED'
  | 'PDF_PARSE_ERROR'
  | 'TEXT_SELECTION_FAILED'
  | 'AI_SERVICE_UNAVAILABLE'
  | 'AI_PROCESSING_FAILED'
  | 'DATABASE_CONNECTION_FAILED'
  | 'DATABASE_QUERY_FAILED'
  | 'FILE_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR';

// ============================================================================
// Event Types for Real-time Updates
// ============================================================================

export interface AppEvent {
  type: string;
  payload: unknown;
  timestamp: Date;
}

export interface DocumentEvent extends AppEvent {
  type: 'document-opened' | 'document-closed' | 'page-changed' | 'zoom-changed';
  documentId: string;
}

export interface AIEvent extends AppEvent {
  type: 'ai-response-started' | 'ai-response-chunk' | 'ai-response-completed' | 'ai-response-failed';
  responseId: string;
}

export interface KnowledgeEvent extends AppEvent {
  type: 'knowledge-added' | 'knowledge-updated' | 'note-created' | 'note-updated';
  entityId: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type UUID = string;
export type Timestamp = Date;
export type FilePath = string;
export type Base64String = string;

// Generic pagination type
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Generic API response wrapper
export interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: AppError;
  meta?: {
    timestamp: Date;
    version: string;
    requestId: string;
  };
}

// Form validation types
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

export interface FormField<T = unknown> {
  value: T;
  error?: string;
  touched: boolean;
  required: boolean;
}

// ============================================================================
// Chat System Types (New for Phase 3)
// ============================================================================

export interface HighlightedContext {
  id: string;
  documentId: string;
  documentTitle: string;
  pageNumber: number;
  selectedText: string;
  textCoordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  chatSessionId: string;
  content: string;
  senderType: 'user' | 'assistant' | 'system';
  createdAt: Date;
  metadata?: {
    isStreaming?: boolean;
    isComplete?: boolean;
    chunkIndex?: number;
  };
}

export interface ActiveChatSession {
  id: string;
  title: string;
  highlightedContexts: HighlightedContext[];
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  previewText: string;
  sourceDocumentCount: number;
  analysisStatus: 'none' | 'pending' | 'processing' | 'complete' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

// ============================================================================
// Navigation State Types (New for Phase 3)
// ============================================================================

export interface UserSessionState {
  id: string;
  currentDocumentId?: string;
  currentPage: number;
  zoomLevel: number;
  scrollPosition: number;
  activeTab: 'library' | 'reader' | 'chat' | 'knowledge';
  lastReadingPosition?: {
    documentId: string;
    page: number;
    zoom: number;
    scroll: number;
  };
  updatedAt: Date;
}

export interface NavigationState {
  currentTab: 'library' | 'reader' | 'chat' | 'knowledge';
  previousTab?: 'library' | 'reader' | 'chat' | 'knowledge';
  readingPosition?: {
    documentId: string;
    page: number;
    zoom: number;
    scroll: number;
  };
  activeChatId?: string;
  pendingTextSelection?: TextSelection;
} 