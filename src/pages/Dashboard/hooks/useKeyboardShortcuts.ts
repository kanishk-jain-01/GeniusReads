import { useCallback } from "react";
import { useKeyboardShortcuts as useBaseKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { getActiveChatSession } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Document, TextSelection } from "@/lib/types";
import type { ViewMode } from "../types";

interface UseKeyboardShortcutsProps {
  currentTextSelection?: TextSelection;
  setCurrentTextSelection: (selection: TextSelection | undefined) => void;
  setClearSelectionTrigger: (trigger: number | ((prev: number) => number)) => void;
  setViewMode: (mode: ViewMode) => void;
  currentDocument?: Document;
  recentDocuments: Document[];
  setCurrentDocument: (doc: Document | undefined) => void;
  viewMode: ViewMode;
}

export const useKeyboardShortcuts = ({
  currentTextSelection,
  setCurrentTextSelection,
  setClearSelectionTrigger,
  setViewMode,
  currentDocument,
  recentDocuments,
  setCurrentDocument,
  viewMode
}: UseKeyboardShortcutsProps) => {
  const { toast } = useToast();

  const handleCmdK = useCallback((textSelection?: TextSelection) => {
    const hasTextSelection = textSelection || currentTextSelection;
    if (!hasTextSelection) {
      toast({
        title: "No Text Selected",
        description: "Please select some text first, then press CMD+K to start a conversation.",
        variant: "destructive",
      });
      return;
    }

    if (textSelection) {
      setCurrentTextSelection(textSelection);
      toast({
        title: "Text Selected",
        description: `Selected: "${textSelection.selectedText.substring(0, 50)}${textSelection.selectedText.length > 50 ? '...' : ''}"`,
      });
    }
    
    setViewMode('chat-interface');
  }, [currentTextSelection, setCurrentTextSelection, setViewMode, toast]);

  const handleCmdL = useCallback(async () => {
    try {
      if (viewMode === 'chat-interface') {
        if (currentDocument) {
          setViewMode('reader');
        } else if (recentDocuments.length > 0) {
          const mostRecentDoc = recentDocuments[0];
          setCurrentDocument(mostRecentDoc);
          setViewMode('reader');
        } else {
          setViewMode('library');
        }
      } else if (viewMode === 'reader') {
        const activeChat = await getActiveChatSession();
        if (activeChat) {
          setViewMode('chat-interface');
        } else {
          toast({
            title: "No Active Chat",
            description: "To switch to chat, highlight some text and press CMD+K to start a conversation.",
          });
        }
      } else {
        if (currentDocument) {
          setViewMode('reader');
        } else if (recentDocuments.length > 0) {
          const mostRecentDoc = recentDocuments[0];
          setCurrentDocument(mostRecentDoc);
          setViewMode('reader');
        } else {
          setViewMode('library');
        }
      }
    } catch (error) {
      console.error('Failed to handle CMD+L:', error);
      if (currentDocument) {
        setViewMode('reader');
      } else {
        setViewMode('library');
      }
    }
  }, [viewMode, currentDocument, recentDocuments, setCurrentDocument, setViewMode, toast]);

  const handleEscape = useCallback(() => {
    if (currentTextSelection) {
      setCurrentTextSelection(undefined);
      setClearSelectionTrigger(prev => prev + 1);
      toast({
        title: "Selection Cleared",
        description: "Text selection has been cleared.",
      });
    }
  }, [currentTextSelection, setCurrentTextSelection, setClearSelectionTrigger, toast]);

  // Set up keyboard shortcuts using the base hook
  useBaseKeyboardShortcuts({
    onCmdK: handleCmdK,
    onCmdL: handleCmdL,
    onEscape: handleEscape,
    currentTextSelection,
    enabled: true
  });

  return {
    handleCmdK,
    handleCmdL,
    handleEscape
  };
}; 