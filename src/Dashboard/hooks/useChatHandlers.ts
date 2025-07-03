import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { getExtractionConcepts } from "@/lib/api";
import type { TextSelection, Concept } from "@/lib/types";
import type { ViewMode } from "../types";

interface UseChatHandlersProps {
  setViewingChatId: (id: string | undefined) => void;
  setViewMode: (mode: ViewMode) => void;
  setCurrentTextSelection: (selection: TextSelection | undefined) => void;
  setChatListRefreshTrigger: (trigger: number | ((prev: number) => number)) => void;
  setConcepts: (concepts: Concept[]) => void;
  setConceptsLoading: (loading: boolean) => void;
}

export const useChatHandlers = ({
  setViewingChatId,
  setViewMode,
  setCurrentTextSelection,
  setChatListRefreshTrigger,
  setConcepts,
  setConceptsLoading
}: UseChatHandlersProps) => {
  const { toast } = useToast();

  const handleChatSelect = useCallback((chatId: string) => {
    setViewingChatId(chatId);
    setViewMode('chat-interface');
  }, [setViewingChatId, setViewMode]);

  const handleStartNewChat = useCallback(() => {
    setViewingChatId(undefined);
    setViewMode('chat-interface');
  }, [setViewingChatId, setViewMode]);

  const handleChatBack = useCallback(() => {
    setViewingChatId(undefined);
    setViewMode('chat');
  }, [setViewingChatId, setViewMode]);

  const handleChatEnd = useCallback(() => {
    setCurrentTextSelection(undefined);
    setChatListRefreshTrigger(prev => prev + 1);
    setViewMode('chat');
    toast({
      title: "Chat Ended",
      description: "Your conversation has been moved to chat history.",
    });
  }, [setCurrentTextSelection, setChatListRefreshTrigger, setViewMode, toast]);

  const handleChatAnalyze = useCallback(async () => {
    setCurrentTextSelection(undefined);
    setChatListRefreshTrigger(prev => prev + 1);
    
    // Load concepts after analysis
    try {
      setConceptsLoading(true);
      const extractedConcepts = await getExtractionConcepts();
      setConcepts(extractedConcepts);
    } catch (error) {
      console.error('Failed to load concepts after analysis:', error);
    } finally {
      setConceptsLoading(false);
    }
    
    setViewMode('knowledge');
    toast({
      title: "Analysis Started",
      description: "Your conversation is being analyzed for concepts. Check the Knowledge tab for results.",
    });
  }, [setCurrentTextSelection, setChatListRefreshTrigger, setConcepts, setConceptsLoading, setViewMode, toast]);

  const handleTextSelectionProcessed = useCallback(() => {
    setCurrentTextSelection(undefined);
  }, [setCurrentTextSelection]);

  const refreshChatList = useCallback(() => {
    setChatListRefreshTrigger(prev => prev + 1);
  }, [setChatListRefreshTrigger]);

  return {
    handleChatSelect,
    handleStartNewChat,
    handleChatBack,
    handleChatEnd,
    handleChatAnalyze,
    handleTextSelectionProcessed,
    refreshChatList
  };
}; 