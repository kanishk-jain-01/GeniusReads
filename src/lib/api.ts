// Tauri API functions for GeniusReads
// Handles communication between React frontend and Rust backend

import { invoke } from '@tauri-apps/api/core';
import type { 
  TauriResponse,
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
    throw new Error(`Tauri communication failed: ${error}`);
  }
}

/**
 * Get application information from Rust backend
 */
export async function getAppInfo(): Promise<Record<string, unknown>> {
  try {
    return await invoke('get_app_info');
  } catch (error) {
    throw new Error(`Failed to get app info: ${error}`);
  }
}

/**
 * Get system information from Rust backend
 */
export async function getSystemInfo(): Promise<Record<string, unknown>> {
  try {
    return await invoke('get_system_info');
  } catch (error) {
    throw new Error(`Failed to get system info: ${error}`);
  }
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<Record<string, unknown>> {
  try {
    return await invoke('test_database_connection');
  } catch (error) {
    throw new Error(`Failed to test database connection: ${error}`);
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<Record<string, unknown>> {
  try {
    return await invoke('get_database_stats');
  } catch (error) {
    throw new Error(`Failed to get database stats: ${error}`);
  }
}

/**
 * Get all documents from database
 */
export async function getDocuments(): Promise<Record<string, unknown>> {
  try {
    return await invoke('get_documents');
  } catch (error) {
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
    const command = { filePath } as Record<string, unknown>;
    return await invoke<TauriResponse>('open_pdf', command);
  } catch (error) {
    throw new Error(`Failed to open PDF: ${error}`);
  }
}

/**
 * Extract text from PDF selection coordinates
 */
export async function extractText(command: ExtractTextCommand): Promise<TauriResponse<string>> {
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
 * Process a question with AI and get streaming response
 */
export async function processQuestion(command: ProcessQuestionCommand): Promise<TauriResponse> {
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
// Error Handling Utilities
// ============================================================================

/**
 * Create a standardized app error from Tauri invoke errors
 */
export function createAppError(error: unknown, context: string): AppError {
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
  args?: Record<string, unknown>, 
  context?: string
): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    const appError = createAppError(error, context || command);
    throw appError;
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
    const greetResult = await greet("GeniusReads");
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