import { useState, useCallback, useRef, useEffect } from 'react';
import type { TextSelection, Document } from '@/lib/types';

interface UseTextSelectionProps {
  document?: Document;
  currentPage: number;
  onTextSelected?: (selection: TextSelection) => void;
  enabled?: boolean;
}

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const useTextSelection = ({
  document,
  currentPage,
  onTextSelected,
  enabled = true
}: UseTextSelectionProps) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<TextSelection | null>(null);
  const [selectionRects, setSelectionRects] = useState<SelectionRect[]>([]);
  
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Clear selection when document or page changes
  useEffect(() => {
    setCurrentSelection(null);
    setSelectionRects([]);
    setIsSelecting(false);
  }, [document?.id, currentPage]);

  const startSelection = useCallback((event: MouseEvent) => {
    if (!enabled || !document) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    selectionStartRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    
    setIsSelecting(true);
    setSelectionRects([]);
    
    // Prevent default text selection
    event.preventDefault();
  }, [enabled, document]);

  const updateSelection = useCallback((event: MouseEvent) => {
    if (!isSelecting || !selectionStartRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;
    
    const startX = Math.min(selectionStartRef.current.x, currentX);
    const startY = Math.min(selectionStartRef.current.y, currentY);
    const width = Math.abs(currentX - selectionStartRef.current.x);
    const height = Math.abs(currentY - selectionStartRef.current.y);

    setSelectionRects([{
      x: startX,
      y: startY,
      width,
      height
    }]);
  }, [isSelecting]);

  const endSelection = useCallback(async (event: MouseEvent) => {
    if (!isSelecting || !selectionStartRef.current || !document) return;

    setIsSelecting(false);

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const endX = event.clientX - rect.left;
    const endY = event.clientY - rect.top;
    
    // Create selection object
    const selection: TextSelection = {
      id: crypto.randomUUID(),
      documentId: document.id,
      pageNumber: currentPage,
      selectedText: await extractTextFromSelection(selectionStartRef.current, { x: endX, y: endY }),
      startCoordinate: selectionStartRef.current,
      endCoordinate: { x: endX, y: endY },
      boundingBoxes: selectionRects,
      createdAt: new Date()
    };

    // Only proceed if we have actual text
    if (selection.selectedText.trim()) {
      setCurrentSelection(selection);
      onTextSelected?.(selection);
    } else {
      // Clear selection if no text was selected
      setSelectionRects([]);
    }

    selectionStartRef.current = null;
  }, [isSelecting, document, currentPage, selectionRects, onTextSelected]);

  const extractTextFromSelection = async (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ): Promise<string> => {
    // This is a simplified implementation
    // In a real implementation, we would interact with PDF.js text layer
    // to extract the actual text content within the selection bounds
    
    try {
      // Get the text layer element
      const textLayer = containerRef.current?.querySelector('.textLayer');
      if (!textLayer) return '';

      // Get all text spans within the selection area
      const textSpans = textLayer.querySelectorAll('span');
      const selectedTexts: string[] = [];

      textSpans.forEach((span) => {
        const spanRect = span.getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect();
        
        if (!containerRect) return;

        // Convert to relative coordinates
        const spanX = spanRect.left - containerRect.left;
        const spanY = spanRect.top - containerRect.top;
        
        // Check if span intersects with selection
        const selectionLeft = Math.min(start.x, end.x);
        const selectionTop = Math.min(start.y, end.y);
        const selectionRight = Math.max(start.x, end.x);
        const selectionBottom = Math.max(start.y, end.y);
        
        if (spanX < selectionRight && 
            spanX + spanRect.width > selectionLeft &&
            spanY < selectionBottom && 
            spanY + spanRect.height > selectionTop) {
          selectedTexts.push(span.textContent || '');
        }
      });

      return selectedTexts.join(' ').trim();
    } catch (error) {
      console.error('Failed to extract text from selection:', error);
      return '';
    }
  };

  const clearSelection = useCallback(() => {
    setCurrentSelection(null);
    setSelectionRects([]);
    setIsSelecting(false);
    selectionStartRef.current = null;
  }, []);

  // Event handlers for mouse events
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    startSelection(event.nativeEvent);
  }, [startSelection]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    updateSelection(event.nativeEvent);
  }, [updateSelection]);

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    endSelection(event.nativeEvent);
  }, [endSelection]);

  return {
    // State
    isSelecting,
    currentSelection,
    selectionRects,
    
    // Refs
    containerRef,
    
    // Event handlers
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    
    // Actions
    clearSelection,
    
    // Utilities
    hasSelection: !!currentSelection,
    selectedText: currentSelection?.selectedText || ''
  };
}; 