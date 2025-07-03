import { useState, useEffect } from "react";
import type { TextSelection, Document, ChatMessage, HighlightedContext } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { 
  createChatSession, 
  addHighlightedContext, 
  getActiveChatSession,
  getChatSessionById,
  setActiveChatSession,
  updateUserSessionState
} from "@/lib/api";

interface UseChatSessionProps {
  textSelection?: TextSelection;
  document?: Document;
  readOnly?: boolean;
  chatSessionId?: string;
  onTextSelectionProcessed?: () => void;
}

export const useChatSession = ({
  textSelection,
  document,
  readOnly,
  chatSessionId,
  onTextSelectionProcessed
}: UseChatSessionProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [highlightedContexts, setHighlightedContexts] = useState<HighlightedContext[]>([]);
  const [chatTitle, setChatTitle] = useState("");
  const [currentChatSessionId, setCurrentChatSessionId] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState<string>("");
  const { toast } = useToast();

  // Initialize chat session
  useEffect(() => {
    if (readOnly && chatSessionId) {
      loadChatSession(chatSessionId);
    } else {
      initializeChatSession();
    }
  }, [textSelection, readOnly, chatSessionId]);

  const loadChatSession = async (sessionId: string) => {
    try {
      const chatSession = await getChatSessionById(sessionId);
      if (!chatSession) {
        toast({
          title: "Error",
          description: "Chat session not found.",
          variant: "destructive",
        });
        return;
      }
      
      setCurrentChatSessionId(chatSession.id);
      setChatTitle(chatSession.title);
      setMessages(chatSession.messages || []);
      setHighlightedContexts(chatSession.highlightedContexts || []);
      
      toast({
        title: "Chat Loaded",
        description: "Viewing chat session.",
      });
    } catch (error) {
      console.error('Failed to load chat session:', error);
      toast({
        title: "Error",
        description: "Failed to load chat session.",
        variant: "destructive",
      });
    }
  };

  const initializeChatSession = async () => {
    try {
      // First try to get existing active chat session
      const activeSession = await getActiveChatSession();
      
      if (activeSession) {
        // Use existing session
        setCurrentChatSessionId(activeSession.id);
        setChatTitle(activeSession.title);
        setMessages(activeSession.messages || []);
        
        // Ensure highlighted contexts have unique IDs for React rendering
        const existingContexts = (activeSession.highlightedContexts || []).map((context: HighlightedContext) => ({
          ...context,
          id: context.id || crypto.randomUUID() // Ensure unique ID
        }));
        
        setHighlightedContexts(existingContexts);
        
        // If we have a new text selection, check if it's already in the contexts
        if (textSelection && document) {
          const isDuplicate = existingContexts.some((context: HighlightedContext) => 
            context.selectedText === textSelection.selectedText &&
            context.pageNumber === textSelection.pageNumber &&
            context.documentId === textSelection.documentId
          );
          
          if (!isDuplicate) {
            // Add highlighted context to existing session only if it's not a duplicate
            await addHighlightedContext(
              activeSession.id,
              textSelection.documentId,
              document.title,
              textSelection.pageNumber,
              textSelection.selectedText,
              textSelection.boundingBoxes.map(box => ({
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height
              }))
            );
            
            // Add to local highlighted contexts state with unique ID
            const newHighlightedContext: HighlightedContext = {
              id: crypto.randomUUID(), // Generate new unique ID
              documentId: textSelection.documentId,
              documentTitle: document.title,
              pageNumber: textSelection.pageNumber,
              selectedText: textSelection.selectedText,
              textCoordinates: textSelection.boundingBoxes.map(box => ({
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height
              })),
              createdAt: new Date()
            };
            
            setHighlightedContexts(prev => [...prev, newHighlightedContext]);
            
            // Set initial message for input field
            setInitialMessage(`I'd also like to understand this text: "${textSelection.selectedText}"`);
          }
          
          // Clear the text selection state in parent component
          onTextSelectionProcessed?.();
        }
      } else if (textSelection && document) {
        // Create new session with text selection
        const title = textSelection.selectedText.length > 50 
          ? `Discussion about: ${textSelection.selectedText.substring(0, 50)}...`
          : `Discussion about: ${textSelection.selectedText}`;
        
        const sessionId = await createChatSession(title);
        setCurrentChatSessionId(sessionId);
        setChatTitle(title);
        
        // Add highlighted context
        await addHighlightedContext(
          sessionId,
          textSelection.documentId,
          document.title,
          textSelection.pageNumber,
          textSelection.selectedText,
          textSelection.boundingBoxes.map(box => ({
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height
          }))
        );
        
        // Set initial highlighted context in state with unique ID
        const initialHighlightedContext: HighlightedContext = {
          id: crypto.randomUUID(), // Generate unique ID
          documentId: textSelection.documentId,
          documentTitle: document.title,
          pageNumber: textSelection.pageNumber,
          selectedText: textSelection.selectedText,
          textCoordinates: textSelection.boundingBoxes.map(box => ({
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height
          })),
          createdAt: new Date()
        };
        
        setHighlightedContexts([initialHighlightedContext]);
        
        // Set as active session
        await setActiveChatSession(sessionId);
        
        // Update user session state
        await updateUserSessionState({
          activeTab: 'chat',
          activeChatId: sessionId
        });
        
        // Set initial message for input field
        setInitialMessage(`I'd also like to understand this text: "${textSelection.selectedText}"`);
        
        // Clear the text selection state in parent component
        onTextSelectionProcessed?.();
      }
    } catch (error) {
      console.error('Failed to initialize chat session:', error);
      toast({
        title: "Error",
        description: "Failed to initialize chat session.",
        variant: "destructive",
      });
    }
  };

  return {
    messages,
    setMessages,
    highlightedContexts,
    setHighlightedContexts,
    chatTitle,
    setChatTitle,
    currentChatSessionId,
    setCurrentChatSessionId,
    initialMessage,
    setInitialMessage
  };
}; 