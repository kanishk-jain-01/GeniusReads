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
      currentPage: doc.last_page_viewed || 1,
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