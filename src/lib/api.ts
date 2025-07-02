// Tauri API functions for GeniusReads
// Handles communication between React frontend and Rust backend

import { invoke } from '@tauri-apps/api/core';
import type { 
  Document, 
  TauriResponse, 
  AppError 
} from './types';

// ============================================================================
// Test Commands (for foundation validation)
// ============================================================================

export const testGreet = async (name: string): Promise<string> => {
  try {
    return await invoke<string>('greet', { name });
  } catch (error) {
    console.error('Failed to greet:', error);
    throw error;
  }
};

export const getAppInfo = async (): Promise<any> => {
  try {
    return await invoke('get_app_info');
  } catch (error) {
    console.error('Failed to get app info:', error);
    throw error;
  }
};

export const getSystemInfo = async (): Promise<any> => {
  try {
    return await invoke('get_system_info');
  } catch (error) {
    console.error('Failed to get system info:', error);
    throw error;
  }
};

// ============================================================================
// PDF Operations
// ============================================================================

export const openPDFDialog = async (): Promise<string | null> => {
  try {
    const result = await invoke<string | null>('open_pdf_dialog');
    return result;
  } catch (error) {
    console.error('Failed to open PDF dialog:', error);
    throw new Error(`Failed to open file dialog: ${error}`);
  }
};

export const loadPDFDocument = async (filePath: string): Promise<Document> => {
  try {
    const result = await invoke<any>('load_pdf_document', { filePath });
    
    // Convert the response to our Document type
    const document: Document = {
      id: result.id,
      title: result.title,
      author: result.author,
      filePath: result.filePath,
      fileName: result.fileName,
      fileSize: result.fileSize,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      zoomLevel: result.zoomLevel,
      lastAccessed: new Date(result.lastAccessed),
      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt),
      metadata: result.metadata
    };
    
    return document;
  } catch (error) {
    console.error('Failed to load PDF document:', error);
    throw new Error(`Failed to load PDF: ${error}`);
  }
};

export const readPDFFile = async (filePath: string): Promise<string> => {
  try {
    const result = await invoke<string>('read_pdf_file', { filePath });
    return result;
  } catch (error) {
    console.error('Failed to read PDF file:', error);
    throw new Error(`Failed to read PDF file: ${error}`);
  }
};

export const updateDocumentState = async (
  documentId: string,
  currentPage: number,
  zoomLevel: number
): Promise<void> => {
  try {
    await invoke('update_document_state', {
      documentId,
      currentPage,
      zoomLevel: Math.round(zoomLevel)
    });
  } catch (error) {
    console.error('Failed to update document state:', error);
    throw new Error(`Failed to update document state: ${error}`);
  }
};

export const updateDocumentTotalPages = async (
  documentId: string,
  totalPages: number
): Promise<void> => {
  try {
    await invoke('update_document_total_pages', {
      documentId,
      totalPages
    });
  } catch (error) {
    console.error('Failed to update document total pages:', error);
    throw new Error(`Failed to update document total pages: ${error}`);
  }
};

export const getRecentDocuments = async (): Promise<Document[]> => {
  try {
    const result = await invoke<any[]>('get_recent_documents');
    
    // Convert the response to our Document type array
    const documents: Document[] = result.map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      author: doc.author,
      filePath: doc.file_path,
      fileName: doc.file_name || doc.title,
      fileSize: doc.file_size,
      totalPages: doc.total_pages,
      currentPage: doc.current_page || 1,
      zoomLevel: doc.zoom_level || 100,
      lastAccessed: new Date(doc.last_accessed),
      createdAt: new Date(doc.created_at),
      updatedAt: new Date(doc.created_at),
      metadata: doc.metadata || {}
    }));
    
    return documents;
  } catch (error) {
    console.error('Failed to get recent documents:', error);
    throw new Error(`Failed to get recent documents: ${error}`);
  }
};

export const getDashboardStats = async (): Promise<{
  documentCount: number;
  questionCount: number;
  responseCount: number;
  knowledgeCount: number;
  noteCount: number;
}> => {
  try {
    const result = await invoke<any>('get_database_stats');
    return {
      documentCount: result.document_count || 0,
      questionCount: result.question_count || 0,
      responseCount: result.response_count || 0,
      knowledgeCount: result.knowledge_count || 0,
      noteCount: result.note_count || 0
    };
  } catch (error) {
    console.error('Failed to get dashboard stats:', error);
    throw new Error(`Failed to get dashboard stats: ${error}`);
  }
};

// ============================================================================
// Database Test Commands
// ============================================================================

export const testDatabaseConnection = async (): Promise<TauriResponse> => {
  try {
    return await invoke<TauriResponse>('test_database_connection');
  } catch (error) {
    console.error('Failed to test database connection:', error);
    throw error;
  }
};

export const getDatabaseStats = async (): Promise<any> => {
  try {
    return await invoke('get_database_stats');
  } catch (error) {
    console.error('Failed to get database stats:', error);
    throw error;
  }
};

export const getDocuments = async (): Promise<any[]> => {
  try {
    return await invoke<any[]>('get_documents');
  } catch (error) {
    console.error('Failed to get documents:', error);
    throw error;
  }
};

// ============================================================================
// Error Handling Utilities
// ============================================================================

export const handleApiError = (error: unknown): AppError => {
  const timestamp = new Date();
  
  if (typeof error === 'string') {
    return {
      code: 'UNKNOWN_ERROR',
      message: error,
      timestamp,
      details: error
    };
  }
  
  if (error instanceof Error) {
    // Try to determine error type from message
    let code: AppError['code'] = 'UNKNOWN_ERROR';
    
    if (error.message.includes('PDF')) {
      code = 'PDF_LOAD_FAILED';
    } else if (error.message.includes('database') || error.message.includes('Database')) {
      code = 'DATABASE_CONNECTION_FAILED';
    } else if (error.message.includes('file') || error.message.includes('File')) {
      code = 'FILE_NOT_FOUND';
    } else if (error.message.includes('permission') || error.message.includes('Permission')) {
      code = 'PERMISSION_DENIED';
    }
    
    return {
      code,
      message: error.message,
      timestamp,
      details: error.stack
    };
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    timestamp,
    details: error
  };
};

// ============================================================================
// Utility Functions
// ============================================================================

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatLastAccessed = (date: Date): string => {
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)} hours ago`;
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
};

// ============================================================================
// PDF Management Commands (Future Implementation)
// ============================================================================

/**
 * Extract text from PDF selection coordinates (Future Implementation - Phase 3)
 */
export async function extractText(command: any): Promise<TauriResponse<string>> {
  try {
    const args = command as unknown as Record<string, unknown>;
    return await invoke<TauriResponse<string>>('extract_text', args);
  } catch (error) {
    throw new Error(`Failed to extract text: ${error}`);
  }
}

// ============================================================================
// AI Processing Commands (Future Implementation)
// ============================================================================

/**
 * Process a question with AI and get streaming response (Future Implementation - Phase 4)
 */
export async function processQuestion(command: any): Promise<TauriResponse> {
  try {
    const args = command as unknown as Record<string, unknown>;
    return await invoke<TauriResponse>('process_question', args);
  } catch (error) {
    throw new Error(`Failed to process question: ${error}`);
  }
}

// ============================================================================
// Chat Session Management
// ============================================================================

export const createChatSession = async (title: string, highlightedContexts: any[] = []): Promise<string> => {
  try {
    const result = await invoke<string>('create_chat_session', {
      title,
      highlightedContexts
    });
    return result;
  } catch (error) {
    console.error('Failed to create chat session:', error);
    throw new Error(`Failed to create chat session: ${error}`);
  }
};

export const getChatSessions = async (): Promise<any[]> => {
  try {
    const result = await invoke<any[]>('get_chat_sessions');
    return result.map((session: any) => ({
      id: session.id,
      title: session.title,
      previewText: session.preview_text,
      sourceDocumentCount: session.source_document_count,
      analysisStatus: session.analysis_status,
      createdAt: new Date(session.created_at),
      completedAt: session.completed_at ? new Date(session.completed_at) : undefined
    }));
  } catch (error) {
    console.error('Failed to get chat sessions:', error);
    throw new Error(`Failed to get chat sessions: ${error}`);
  }
};

export const getActiveChatSession = async (): Promise<any | null> => {
  try {
    const result = await invoke<any>('get_active_chat_session');
    if (!result) return null;
    
    return {
      id: result.id,
      title: result.title,
      highlightedContexts: (result.highlighted_contexts || []).map((context: any) => ({
        ...context,
        createdAt: new Date(context.created_at)
      })),
      messages: (result.messages || []).map((message: any) => ({
        ...message,
        createdAt: new Date(message.created_at)
      })),
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
      isActive: true
    };
  } catch (error) {
    console.error('Failed to get active chat session:', error);
    throw new Error(`Failed to get active chat session: ${error}`);
  }
};

export const setActiveChatSession = async (chatSessionId: string): Promise<void> => {
  try {
    await invoke('set_active_chat_session', { chatSessionId });
  } catch (error) {
    console.error('Failed to set active chat session:', error);
    throw new Error(`Failed to set active chat session: ${error}`);
  }
};

export const addChatMessage = async (
  chatSessionId: string,
  content: string,
  senderType: 'user' | 'assistant' | 'system',
  metadata?: Record<string, any>
): Promise<string> => {
  try {
    const result = await invoke<string>('add_chat_message', {
      chatSessionId,
      content,
      senderType,
      metadata: metadata || {}
    });
    return result;
  } catch (error) {
    console.error('Failed to add chat message:', error);
    throw new Error(`Failed to add chat message: ${error}`);
  }
};

export const addHighlightedContext = async (
  chatSessionId: string,
  documentId: string,
  documentTitle: string,
  pageNumber: number,
  selectedText: string,
  textCoordinates: Array<{x: number, y: number, width: number, height: number}>
): Promise<string> => {
  try {
    const result = await invoke<string>('add_highlighted_context', {
      chatSessionId,
      documentId,
      documentTitle,
      pageNumber,
      selectedText,
      textCoordinates
    });
    return result;
  } catch (error) {
    console.error('Failed to add highlighted context:', error);
    throw new Error(`Failed to add highlighted context: ${error}`);
  }
};

export const deleteChatSession = async (chatSessionId: string): Promise<void> => {
  try {
    await invoke('delete_chat_session', { chatSessionId });
  } catch (error) {
    console.error('Failed to delete chat session:', error);
    throw new Error(`Failed to delete chat session: ${error}`);
  }
};

export const updateChatSessionTitle = async (chatSessionId: string, title: string): Promise<void> => {
  try {
    await invoke('update_chat_session_title', { chatSessionId, title });
  } catch (error) {
    console.error('Failed to update chat session title:', error);
    throw new Error(`Failed to update chat session title: ${error}`);
  }
};

// ============================================================================
// Navigation State Management
// ============================================================================

export const getUserSessionState = async (): Promise<any> => {
  try {
    const result = await invoke<any>('get_user_session_state');
    if (!result) {
      // Return default state if none exists
      return {
        currentDocumentId: null,
        currentPage: 1,
        zoomLevel: 100,
        scrollPosition: 0,
        activeTab: 'library',
        activeChatId: null,
        lastReadingPosition: null,
        updatedAt: new Date()
      };
    }
    
    return {
      id: result.id,
      currentDocumentId: result.current_document_id,
      currentPage: result.current_page,
      zoomLevel: result.zoom_level,
      scrollPosition: result.scroll_position,
      activeTab: result.active_tab,
      activeChatId: result.active_chat_id,
      lastReadingPosition: result.last_reading_position,
      updatedAt: new Date(result.updated_at)
    };
  } catch (error) {
    console.error('Failed to get user session state:', error);
    throw new Error(`Failed to get user session state: ${error}`);
  }
};

export const updateUserSessionState = async (state: {
  currentDocumentId?: string | null;
  currentPage?: number;
  zoomLevel?: number;
  scrollPosition?: number;
  activeTab?: 'library' | 'reader' | 'chat' | 'knowledge';
  activeChatId?: string | null;
  lastReadingPosition?: {
    documentId: string;
    page: number;
    zoom: number;
    scroll: number;
  } | null;
}): Promise<void> => {
  try {
    await invoke('update_user_session_state', { state });
  } catch (error) {
    console.error('Failed to update user session state:', error);
    throw new Error(`Failed to update user session state: ${error}`);
  }
};

export const saveReadingPosition = async (
  documentId: string,
  page: number,
  zoom: number,
  scroll: number
): Promise<void> => {
  try {
    await invoke('save_reading_position', {
      documentId,
      page,
      zoom,
      scroll
    });
  } catch (error) {
    console.error('Failed to save reading position:', error);
    throw new Error(`Failed to save reading position: ${error}`);
  }
};

export const getLastReadingPosition = async (): Promise<{
  documentId: string;
  page: number;
  zoom: number;
  scroll: number;
} | null> => {
  try {
    const result = await invoke<any>('get_last_reading_position');
    return result;
  } catch (error) {
    console.error('Failed to get last reading position:', error);
    throw new Error(`Failed to get last reading position: ${error}`);
  }
};

// ============================================================================
// User Preferences Management
// ============================================================================

export const saveUserPreferences = async (preferences: {
  openaiApiKey?: string;
  theme?: 'light' | 'dark' | 'system';
}): Promise<void> => {
  try {
    await invoke('save_user_preferences', { preferences });
  } catch (error) {
    console.error('Failed to save user preferences:', error);
    throw new Error(`Failed to save user preferences: ${error}`);
  }
};

export const getUserPreferences = async (): Promise<{
  openaiApiKey?: string;
  theme: 'light' | 'dark' | 'system';
}> => {
  try {
    const result = await invoke<any>('get_user_preferences');
    return {
      openaiApiKey: result?.openai_api_key,
      theme: result?.theme || 'system'
    };
  } catch (error) {
    console.error('Failed to get user preferences:', error);
    // Return default preferences if none exist
    return {
      theme: 'system'
    };
  }
};

// ============================================================================
// Database Commands (Future Implementation)
// ============================================================================

/**
 * Save knowledge entry to local database
 */
export async function saveKnowledgeEntry(entry: Record<string, unknown>): Promise<TauriResponse> {
  try {
    return await invoke<TauriResponse>('save_knowledge_entry', { entry });
  } catch (error) {
    throw new Error(`Failed to save knowledge entry: ${error}`);
  }
}

/**
 * Search knowledge corpus
 */
export async function searchKnowledge(query: string): Promise<TauriResponse> {
  try {
    return await invoke<TauriResponse>('search_knowledge', { query });
  } catch (error) {
    throw new Error(`Failed to search knowledge: ${error}`);
  }
}

// ============================================================================
// OpenAI Chat Integration
// ============================================================================

export const sendChatMessage = async (
  messages: Array<{role: 'user' | 'assistant' | 'system', content: string}>,
  onStreamChunk?: (chunk: string) => void
): Promise<string> => {
  try {
    // Get the API key from preferences
    const preferences = await getUserPreferences();
    if (!preferences.openaiApiKey) {
      throw new Error('OpenAI API key not configured. Please set your API key in Preferences.');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${preferences.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using the cost-effective model
        messages: messages,
        stream: !!onStreamChunk,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    if (onStreamChunk && response.body) {
      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  onStreamChunk(content);
                }
              } catch {
                // Skip invalid JSON chunks
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return fullResponse;
    } else {
      // Handle non-streaming response
      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    }
  } catch (error) {
    console.error('Failed to send chat message:', error);
    throw error;
  }
};

// ============================================================================
// Communication Test Suite
// ============================================================================

/**
 * Comprehensive test of Tauri-React communication
 */
export async function testTauriCommunication(): Promise<{
  success: boolean;
  results: Record<string, unknown>;
  errors: string[];
}> {
  const results: Record<string, unknown> = {};
  const errors: string[] = [];

  // Test 1: Basic greeting
  try {
    const greetResult = await testGreet("GeniusReads");
    results.greet = { success: true, data: greetResult };
  } catch (error) {
    results.greet = { success: false, error: String(error) };
    errors.push(`Greet test failed: ${error}`);
  }

  // Test 2: App info
  try {
    const appInfo = await getAppInfo();
    results.appInfo = { success: true, data: appInfo };
  } catch (error) {
    results.appInfo = { success: false, error: String(error) };
    errors.push(`App info test failed: ${error}`);
  }

  // Test 3: System info
  try {
    const systemInfo = await getSystemInfo();
    results.systemInfo = { success: true, data: systemInfo };
  } catch (error) {
    results.systemInfo = { success: false, error: String(error) };
    errors.push(`System info test failed: ${error}`);
  }

  // Test 4: Database connection
  try {
    const dbTest = await testDatabaseConnection();
    results.database = { success: true, data: dbTest };
  } catch (error) {
    results.database = { success: false, error: String(error) };
    errors.push(`Database test failed: ${error}`);
  }

  // Test 5: Database stats
  try {
    const dbStats = await getDatabaseStats();
    results.databaseStats = { success: true, data: dbStats };
  } catch (error) {
    results.databaseStats = { success: false, error: String(error) };
    errors.push(`Database stats test failed: ${error}`);
  }

  // Test 6: Get documents
  try {
    const documents = await getDocuments();
    results.documents = { success: true, data: documents };
  } catch (error) {
    results.documents = { success: false, error: String(error) };
    errors.push(`Get documents test failed: ${error}`);
  }

  return {
    success: errors.length === 0,
    results,
    errors
  };
} 