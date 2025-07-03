import { useState } from "react";
import type { ChatMessage, HighlightedContext } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { 
  addChatMessage, 
  endChatSession,
  updateUserSessionState,
  sendChatMessage,
  analyzeChatSession
} from "@/lib/api";

interface UseChatActionsProps {
  currentChatSessionId: string | null;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  highlightedContexts: HighlightedContext[];
  setInitialMessage: React.Dispatch<React.SetStateAction<string>>;
  onEndChat: () => void;
  onAnalyze: () => void;
}

export const useChatActions = ({
  currentChatSessionId,
  messages,
  setMessages,
  highlightedContexts,
  setInitialMessage,
  onEndChat,
  onAnalyze
}: UseChatActionsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<string>("");
  const [analysisStartTime, setAnalysisStartTime] = useState<number | null>(null);
  const { toast } = useToast();

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

  return {
    isLoading,
    isStreaming,
    streamingContent,
    analysisProgress,
    isAnalyzing,
    analysisStage,
    analysisStartTime,
    handleSendMessage,
    handleEndChat,
    handleAnalyze
  };
}; 