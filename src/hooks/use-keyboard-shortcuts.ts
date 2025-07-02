import { useEffect, useCallback } from 'react';
import type { TextSelection } from '@/lib/types';

interface UseKeyboardShortcutsProps {
  onCmdK: (textSelection?: TextSelection) => void;
  onCmdL: () => void;
  onEscape?: () => void;
  currentTextSelection?: TextSelection;
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({
  onCmdK,
  onCmdL,
  onEscape,
  currentTextSelection,
  enabled = true
}: UseKeyboardShortcutsProps) => {
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Handle Escape key (no modifier needed)
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onEscape?.();
      return;
    }
    
    // Check for CMD (macOS) or Ctrl (Windows/Linux)
    const isModifierPressed = event.metaKey || event.ctrlKey;
    
    if (isModifierPressed) {
      switch (event.key.toLowerCase()) {
        case 'k':
          event.preventDefault();
          event.stopPropagation();
          onCmdK(currentTextSelection);
          break;
        case 'l':
          event.preventDefault();
          event.stopPropagation();
          onCmdL();
          break;
      }
    }
  }, [enabled, onCmdK, onCmdL, onEscape, currentTextSelection]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, enabled]);

  return {
    // Utility functions for manual triggering
    triggerCmdK: () => onCmdK(currentTextSelection),
    triggerCmdL: () => onCmdL(),
    triggerEscape: () => onEscape?.(),
  };
}; 