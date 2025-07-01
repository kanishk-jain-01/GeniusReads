// Tauri API functions for GeniusReads
// Handles communication between React frontend and Rust backend

import { invoke } from '@tauri-apps/api/core';
import type { 
  TauriResponse,
  OpenPDFCommand,
  ExtractTextCommand,
  ProcessQuestionCommand,
  AppError
} from './types';

// ============================================================================
// Test Commands (for validating Tauri-React communication)
// ============================================================================

/**
 * Simple greeting command to test basic Tauri communication
 */
export async function greet(name: string): Promise<string> {
  try {
    return await invoke<string>('greet', { name });
  } catch (error) {
    console.error('Failed to call greet command:', error);
    throw new Error(`Tauri communication failed: ${error}`);
  }
}

/**
 * Get application information from Rust backend
 */
export async function getAppInfo(): Promise<any> {
  try {
    return await invoke('get_app_info');
  } catch (error) {
    console.error('Failed to get app info:', error);
    throw new Error(`Failed to get app info: ${error}`);
  }
}

/**
 * Get system information from Rust backend
 */
export async function getSystemInfo(): Promise<any> {
  try {
    return await invoke('get_system_info');
  } catch (error) {
    console.error('Failed to get system info:', error);
    throw new Error(`Failed to get system info: ${error}`);
  }
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<any> {
  try {
    return await invoke('test_database_connection');
  } catch (error) {
    console.error('Failed to test database connection:', error);
    throw new Error(`Failed to test database connection: ${error}`);
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<any> {
  try {
    return await invoke('get_database_stats');
  } catch (error) {
    console.error('Failed to get database stats:', error);
    throw new Error(`Failed to get database stats: ${error}`);
  }
}

/**
 * Get all documents from database
 */
export async function getDocuments(): Promise<any> {
  try {
    return await invoke('get_documents');
  } catch (error) {
    console.error('Failed to get documents:', error);
    throw new Error(`Failed to get documents: ${error}`);
  }
}

// ============================================================================
// PDF Management Commands (Future Implementation)
// ============================================================================

/**
 * Open and load a PDF file
 * @param filePath - Path to the PDF file
 */
export async function openPDF(filePath: string): Promise<TauriResponse> {
  try {
    const command: OpenPDFCommand = { filePath };
    return await invoke<TauriResponse>('open_pdf', command);
  } catch (error) {
    console.error('Failed to open PDF:', error);
    throw new Error(`Failed to open PDF: ${error}`);
  }
}

/**
 * Extract text from PDF selection coordinates
 */
export async function extractText(command: ExtractTextCommand): Promise<TauriResponse<string>> {
  try {
    return await invoke<TauriResponse<string>>('extract_text', command);
  } catch (error) {
    console.error('Failed to extract text:', error);
    throw new Error(`Failed to extract text: ${error}`);
  }
}

// ============================================================================
// AI Processing Commands (Future Implementation)
// ============================================================================

/**
 * Process a question with AI and get streaming response
 */
export async function processQuestion(command: ProcessQuestionCommand): Promise<TauriResponse> {
  try {
    return await invoke<TauriResponse>('process_question', command);
  } catch (error) {
    console.error('Failed to process question:', error);
    throw new Error(`Failed to process question: ${error}`);
  }
}

// ============================================================================
// Database Commands (Future Implementation)
// ============================================================================

/**
 * Save knowledge entry to local database
 */
export async function saveKnowledgeEntry(entry: any): Promise<TauriResponse> {
  try {
    return await invoke<TauriResponse>('save_knowledge_entry', { entry });
  } catch (error) {
    console.error('Failed to save knowledge entry:', error);
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
    console.error('Failed to search knowledge:', error);
    throw new Error(`Failed to search knowledge: ${error}`);
  }
}

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Create a standardized app error from Tauri invoke errors
 */
export function createAppError(error: any, context: string): AppError {
  return {
    code: 'TAURI_INVOKE_FAILED',
    message: `Tauri command failed in ${context}`,
    details: error,
    timestamp: new Date(),
    context: {
      component: 'TauriAPI',
      action: context
    }
  };
}

/**
 * Wrapper for invoke calls with standardized error handling
 */
export async function safeInvoke<T>(
  command: string, 
  args?: any, 
  context?: string
): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    const appError = createAppError(error, context || command);
    console.error('Tauri invoke failed:', appError);
    throw appError;
  }
}

// ============================================================================
// Development and Testing Utilities
// ============================================================================

/**
 * Test all basic Tauri commands to verify communication
 */
export async function testTauriCommunication(): Promise<{
  success: boolean;
  results: Record<string, any>;
  errors: string[];
}> {
  const results: Record<string, any> = {};
  const errors: string[] = [];

  // Test greet command
  try {
    results.greet = await greet('Developer');
  } catch (error) {
    errors.push(`Greet command failed: ${error}`);
  }

  // Test app info command
  try {
    results.appInfo = await getAppInfo();
  } catch (error) {
    errors.push(`App info command failed: ${error}`);
  }

  // Test system info command
  try {
    results.systemInfo = await getSystemInfo();
  } catch (error) {
    errors.push(`System info command failed: ${error}`);
  }

  // Test database connection
  try {
    results.databaseConnection = await testDatabaseConnection();
  } catch (error) {
    errors.push(`Database connection test failed: ${error}`);
  }

  // Test database stats
  try {
    results.databaseStats = await getDatabaseStats();
  } catch (error) {
    errors.push(`Database stats test failed: ${error}`);
  }

  // Test documents query
  try {
    results.documents = await getDocuments();
  } catch (error) {
    errors.push(`Documents query failed: ${error}`);
  }

  return {
    success: errors.length === 0,
    results,
    errors
  };
} 