import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft,
  Brain,
  Square,
  Loader2
} from "lucide-react";
import ActiveChat from "@/components/ActiveChat";
import type { TextSelection, Document, ChatMessage, HighlightedContext } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { 
  createChatSession, 
  addChatMessage, 
  addHighlightedContext, 
  getActiveChatSession,
  getChatSessionById,
  setActiveChatSession,
  endChatSession,
  updateUserSessionState,
  sendChatMessage,
  analyzeChatSession
} from "@/lib/api";

interface ChatInterfaceProps {
  textSelection?: TextSelection;
  document?: Document;
  onBack: () => void;
  onEndChat: () => void;
  onAnalyze: () => void;
  onTextSelectionProcessed?: () => void;
  readOnly?: boolean;
  chatSessionId?: string; // For viewing specific ended chats
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  textSelection,
  document,
  onBack,
  onEndChat,
  onAnalyze,
  onTextSelectionProcessed,
  readOnly,
  chatSessionId
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [highlightedContexts, setHighlightedContexts] = useState<HighlightedContext[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [chatTitle, setChatTitle] = useState("");
  const [currentChatSessionId, setCurrentChatSessionId] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState<string>(""); // Track initial message for input
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<string>("");
  const [analysisStartTime, setAnalysisStartTime] = useState<number | null>(null);
  const { toast } = useToast();

  // Initialize chat session
  useEffect(() => {
    if (readOnly && chatSessionId) {
      loadChatSession(chatSessionId);
    } else {
      initializeChatSession();
    }
  }, [textSelection, readOnly, chatSessionId]);

  // Real-time timer update for analysis progress
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isAnalyzing && analysisStartTime) {
      interval = setInterval(() => {
        // Force re-render to update the timer display
        setAnalysisStartTime(prev => prev);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAnalyzing, analysisStartTime]);

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

  const handleSendMessage = async (message: string) => {
    if (!currentChatSessionId) {
      toast({
        title: "Error",
        description: "No active chat session.",
        variant: "destructive",
      });
      return;
    }

    // Clear initial message since user is now sending their own message
    setInitialMessage("");

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

  const handleEndChat = async () => {
    if (!currentChatSessionId) return;
    
    try {
      await endChatSession(currentChatSessionId);
      await updateUserSessionState({
        activeTab: 'library',
        activeChatId: null
      });
      
      toast({
        title: "Chat Ended",
        description: "Your conversation has been ended.",
        variant: "destructive",
      });
      onEndChat();
    } catch (error) {
      console.error('Failed to end chat:', error);
      toast({
        title: "Error",
        description: "Failed to end chat.",
        variant: "destructive",
      });
    }
  };

  const handleAnalyze = async () => {
    if (!currentChatSessionId) return;
    
    try {
      setIsAnalyzing(true);
      setAnalysisProgress(0);
      setAnalysisStartTime(Date.now());
      
      // Stage 1: Initializing
      setAnalysisStage("Initializing analysis...");
      setAnalysisProgress(10);
      
      toast({
        title: "Analysis Starting",
        description: "Preparing your conversation for AI analysis...",
      });

      // Simulate brief delay for initialization
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Stage 2: Processing
      setAnalysisStage("Processing conversation data...");
      setAnalysisProgress(30);
      
      // Update toast with progress
      toast({
        title: "Processing Data",
        description: "Analyzing conversation content and highlighted text...",
      });

      // Trigger LangGraph concept extraction
      const result = await analyzeChatSession(currentChatSessionId);
      
      // Stage 3: Extracting concepts
      setAnalysisStage("Extracting key concepts...");
      setAnalysisProgress(60);
      
      toast({
        title: "Extracting Concepts",
        description: "AI is identifying important concepts from your conversation...",
      });

      // Simulate processing time for concept extraction
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Stage 4: Finalizing
      setAnalysisStage("Finalizing results...");
      setAnalysisProgress(90);
      
      if (result.success) {
        // Stage 5: Complete
        setAnalysisStage("Analysis complete!");
        setAnalysisProgress(100);
        
        const processingTime = analysisStartTime ? Date.now() - analysisStartTime : 0;
        
        toast({
          title: "Analysis Complete",
          description: `Successfully extracted ${result.conceptsExtracted || 0} concepts in ${Math.round(processingTime / 1000)}s`,
        });
        
        // Navigate to knowledge tab after a brief delay
        setTimeout(async () => {
          await updateUserSessionState({
            activeTab: 'knowledge'
          });
          onAnalyze();
        }, 1000);
        
      } else {
        throw new Error(result.error || "Analysis failed");
      }
    } catch (error) {
      console.error('Failed to analyze chat:', error);
      setAnalysisStage("Analysis failed");
      setAnalysisProgress(0);
      
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze your conversation. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Reset analysis state after completion or error
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisProgress(0);
        setAnalysisStage("");
        setAnalysisStartTime(null);
      }, 2000);
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
              Chat List
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
            {!readOnly ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEndChat}
                  className="text-red-600 hover:text-red-700"
                  disabled={isAnalyzing}
                >
                  <Square className="h-4 w-4 mr-2" />
                  End
                </Button>
                <Button
                  size="sm"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="h-4 w-4 mr-2" />
                  )}
                  {isAnalyzing ? "Analyzing..." : "Analyze"}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                {isAnalyzing ? "Analyzing..." : "Analyze"}
              </Button>
            )}
          </div>
        </div>
        
        {/* Analysis Progress Display */}
        {isAnalyzing && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {analysisStage}
                </span>
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {analysisProgress}%
              </span>
            </div>
            <Progress value={analysisProgress} className="w-full" />
            {analysisStartTime && (
              <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Processing for {Math.round((Date.now() - analysisStartTime) / 1000)}s
              </div>
            )}
          </div>
        )}
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
          placeholder={readOnly ? "This chat has ended and is read-only" : "Ask a question about the selected text..."}
          showTypingIndicator={isLoading && !isStreaming}
          maxHeight="100%"
          disabled={readOnly}
          initialMessage={initialMessage}
        />
      </div>
    </div>
  );
};

export default ChatInterface; 