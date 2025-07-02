import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  Save,
  Brain,
  Trash2
} from "lucide-react";
import ActiveChat from "@/components/ActiveChat";
import type { TextSelection, Document, ChatMessage, HighlightedContext } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { 
  createChatSession, 
  addChatMessage, 
  addHighlightedContext, 
  getActiveChatSession,
  setActiveChatSession,
  deleteChatSession,
  updateUserSessionState,
  sendChatMessage
} from "@/lib/api";

interface ChatInterfaceProps {
  textSelection?: TextSelection;
  document?: Document;
  onBack: () => void;
  onSave: () => void;
  onSaveAndAnalyze: () => void;
  onDelete: () => void;
  onTextSelectionProcessed?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  textSelection,
  document,
  onBack,
  onSave,
  onSaveAndAnalyze,
  onDelete,
  onTextSelectionProcessed
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [highlightedContexts, setHighlightedContexts] = useState<HighlightedContext[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [chatTitle, setChatTitle] = useState("");
  const [currentChatSessionId, setCurrentChatSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  // Initialize chat session
  useEffect(() => {
    initializeChatSession();
  }, [textSelection]);

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
            
            // Add a new context message to the conversation
            const messageId = await addChatMessage(
              activeSession.id,
              `I'd also like to understand this text: "${textSelection.selectedText}"`,
              'user'
            );
            
            const contextMessage: ChatMessage = {
              id: messageId,
              chatSessionId: activeSession.id,
              content: `I'd also like to understand this text: "${textSelection.selectedText}"`,
              senderType: 'user',
              createdAt: new Date()
            };
            
            setMessages(prev => [...prev, contextMessage]);
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
        
        // Add initial context message
        const messageId = await addChatMessage(
          sessionId,
          `I'd like to understand this text better: "${textSelection.selectedText}"`,
          'user'
        );
        
        const contextMessage: ChatMessage = {
          id: messageId,
          chatSessionId: sessionId,
          content: `I'd like to understand this text better: "${textSelection.selectedText}"`,
          senderType: 'user',
          createdAt: new Date()
        };
        
        setMessages([contextMessage]);
        
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

  const handleSendMessage = async (message: string) => {
    if (!currentChatSessionId) {
      toast({
        title: "Error",
        description: "No active chat session.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Save user message to database
      const userMessageId = await addChatMessage(currentChatSessionId, message, 'user');
      const userMessage: ChatMessage = {
        id: userMessageId,
        chatSessionId: currentChatSessionId,
        content: message,
        senderType: 'user',
        createdAt: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      // Create AI response message immediately for streaming simulation
      const aiResponseId = crypto.randomUUID();
      const aiResponse: ChatMessage = {
        id: aiResponseId,
        chatSessionId: currentChatSessionId,
        content: "", // Will be filled by streaming
        senderType: 'assistant',
        createdAt: new Date(),
        metadata: {
          isStreaming: true
        }
      };

      setMessages(prev => [...prev, aiResponse]);

      // Prepare conversation history for OpenAI
      const conversationHistory: Array<{role: 'user' | 'assistant' | 'system', content: string}> = messages.map(msg => ({
        role: msg.senderType === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));
      
      // Add the current user message
      conversationHistory.push({
        role: 'user' as const,
        content: message
      });

      // Add system context if we have highlighted text
      if (highlightedContexts.length > 0) {
        const contextDescriptions = highlightedContexts.map(context => 
          `From "${context.documentTitle}" (page ${context.pageNumber}): "${context.selectedText}"`
        ).join('\n\n');
        
        conversationHistory.unshift({
          role: 'system' as const,
          content: `You are helping the user understand text selections from their document(s). The selected texts are:\n\n${contextDescriptions}\n\nPlease provide helpful explanations and answer questions about this content.`
        });
      }

      setIsStreaming(true);
      setStreamingContent("");

      // Get streaming response from OpenAI
      const fullResponse = await sendChatMessage(
        conversationHistory,
        (chunk: string) => {
          setStreamingContent(prev => prev + chunk);
        }
      );

      // Save AI response to database
      const savedAiMessageId = await addChatMessage(currentChatSessionId, fullResponse, 'assistant');

      // Complete the streaming
      setIsStreaming(false);
      setStreamingContent("");
      setMessages(prev => prev.map(msg => 
        msg.id === aiResponseId 
          ? { ...msg, id: savedAiMessageId, content: fullResponse, metadata: { isComplete: true } }
          : msg
      ));
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleSaveChat = async () => {
    if (!currentChatSessionId) return;
    
    try {
      // Chat is already saved to database, just update UI state
      await updateUserSessionState({
        activeTab: 'library' // Navigate back to library
      });
      
      toast({
        title: "Chat Saved",
        description: "Your conversation has been saved to chat history.",
      });
      onSave();
    } catch (error) {
      console.error('Failed to save chat:', error);
      toast({
        title: "Error",
        description: "Failed to save chat.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAndAnalyze = async () => {
    if (!currentChatSessionId) return;
    
    try {
      // TODO: In Phase 6, trigger knowledge extraction from chat messages
      await updateUserSessionState({
        activeTab: 'knowledge' // Navigate to knowledge tab
      });
      
      toast({
        title: "Chat Saved & Analysis Started",
        description: "Your conversation has been saved and will be analyzed for concepts.",
      });
      onSaveAndAnalyze();
    } catch (error) {
      console.error('Failed to save and analyze chat:', error);
      toast({
        title: "Error",
        description: "Failed to save and analyze chat.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteChat = async () => {
    if (!currentChatSessionId) return;
    
    try {
      await deleteChatSession(currentChatSessionId);
      await updateUserSessionState({
        activeTab: 'library',
        activeChatId: null
      });
      
      toast({
        title: "Chat Deleted",
        description: "Your conversation has been deleted.",
        variant: "destructive",
      });
      onDelete();
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Chat Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {chatTitle || "AI Conversation"}
              </h1>
              {document && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  From: {document.title} • Page {textSelection?.pageNumber}
                </p>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteChat}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveChat}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAndAnalyze}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Brain className="h-4 w-4 mr-2" />
              Save + Analyze
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-hidden">
        <ActiveChat
          messages={messages}
          onSendMessage={handleSendMessage}
          highlightedContexts={highlightedContexts}
          isLoading={isLoading}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          placeholder="Ask a question about the selected text..."
          showTypingIndicator={isLoading && !isStreaming}
          maxHeight="100%"
        />
      </div>
    </div>
  );
};

export default ChatInterface; 