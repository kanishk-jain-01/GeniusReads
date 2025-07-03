import { ChatHeader, ActiveChat, useChatSession, useChatActions, useAnalysisTimer } from "@/components/chat";
import type { TextSelection, Document } from "@/lib/types";

interface ChatInterfacePageProps {
  textSelection?: TextSelection;
  document?: Document;
  onBack: () => void;
  onEndChat: () => void;
  onAnalyze: () => void;
  onTextSelectionProcessed?: () => void;
  readOnly?: boolean;
  chatSessionId?: string; // For viewing specific ended chats
}

export const ChatInterfacePage = ({
  textSelection,
  document,
  onBack,
  onEndChat,
  onAnalyze,
  onTextSelectionProcessed,
  readOnly,
  chatSessionId
}: ChatInterfacePageProps) => {
  // Chat session management
  const {
    messages,
    setMessages,
    highlightedContexts,
    chatTitle,
    currentChatSessionId,
    initialMessage,
    setInitialMessage
  } = useChatSession({
    textSelection,
    document,
    readOnly,
    chatSessionId,
    onTextSelectionProcessed
  });

  // Chat actions (send message, end chat, analyze)
  const {
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
  } = useChatActions({
    currentChatSessionId,
    messages,
    setMessages,
    highlightedContexts,
    setInitialMessage,
    onEndChat,
    onAnalyze
  });

  // Analysis timer for real-time updates
  useAnalysisTimer({
    isAnalyzing,
    analysisStartTime,
    setAnalysisStartTime: () => {} // This is handled internally by useChatActions
  });

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Chat Header */}
      <ChatHeader
        chatTitle={chatTitle}
        document={document}
        textSelection={textSelection}
        readOnly={readOnly}
        isAnalyzing={isAnalyzing}
        analysisProgress={analysisProgress}
        analysisStage={analysisStage}
        analysisStartTime={analysisStartTime}
        onBack={onBack}
        onEndChat={handleEndChat}
        onAnalyze={handleAnalyze}
      />

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