import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Send,
  MessageSquare, 
  Clock,
  User,
  Bot,
  Loader2,
  MoreVertical
} from "lucide-react";
import type { ChatMessage, HighlightedContext } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface ActiveChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  highlightedContexts?: HighlightedContext[];
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingContent?: string;
  disabled?: boolean;
  placeholder?: string;
  showTypingIndicator?: boolean;
  maxHeight?: string;
  initialMessage?: string;
}

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  streamingContent?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isStreaming = false, 
  streamingContent = "" 
}) => {
  const isUser = message.senderType === 'user';
  const isSystem = message.senderType === 'system';
  
  // For streaming messages, show the streaming content if available
  const displayContent = isStreaming && streamingContent 
    ? streamingContent 
    : message.content;

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-3 py-2 rounded-full border border-slate-200 dark:border-slate-700">
          {displayContent}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`flex items-start space-x-3 max-w-[85%] ${
          isUser ? 'flex-row-reverse space-x-reverse' : ''
        }`}
      >
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-purple-600 text-white'
          }`}
        >
          {isUser ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </div>

        {/* Message Content */}
        <div className="flex flex-col space-y-1">
          {/* Message Bubble */}
          <div
            className={`rounded-lg px-4 py-3 relative ${
              isUser
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between">
              <p className="text-sm leading-relaxed whitespace-pre-wrap flex-1">
                {displayContent}
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-current opacity-75 animate-pulse ml-1" />
                )}
              </p>
              {!isUser && !isStreaming && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Message Metadata */}
          <div
            className={`text-xs px-1 ${
              isUser
                ? 'text-right text-slate-500 dark:text-slate-400'
                : 'text-left text-slate-500 dark:text-slate-400'
            }`}
          >
            <span>
              {(() => {
                const date = message.createdAt instanceof Date 
                  ? message.createdAt 
                  : new Date(message.createdAt);
                return date.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                });
              })()}
            </span>
            {message.metadata?.isStreaming && (
              <span className="ml-2 text-blue-500">
                • Streaming
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TypingIndicator: React.FC = () => (
  <div className="flex justify-start mb-4">
    <div className="flex items-start space-x-3 max-w-[85%]">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center">
        <Bot className="h-4 w-4" />
      </div>
      <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="text-sm text-slate-500">AI is thinking...</span>
        </div>
      </div>
    </div>
  </div>
);

const ActiveChat: React.FC<ActiveChatProps> = ({
  messages,
  onSendMessage,
  highlightedContexts = [],
  isLoading = false,
  isStreaming = false,
  streamingContent = "",
  disabled = false,
  placeholder = "Ask a question...",
  showTypingIndicator = false,
  maxHeight = "400px",
  initialMessage = ""
}) => {
  const [currentMessage, setCurrentMessage] = useState(initialMessage);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Update input field when initialMessage prop changes
  useEffect(() => {
    setCurrentMessage(initialMessage);
  }, [initialMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isStreaming, streamingContent]);

  const handleSendMessage = () => {
    if (!currentMessage.trim() || disabled || isLoading) return;

    const messageToSend = currentMessage.trim();
    setCurrentMessage("");
    onSendMessage(messageToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // Handle paste events for rich content in the future
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.length > 1000) {
      toast({
        title: "Message Too Long",
        description: "Please keep messages under 1000 characters.",
        variant: "destructive",
      });
      e.preventDefault();
    }
  };

  // Find the most recent streaming message
  const streamingMessageId = messages.find(m => m.metadata?.isStreaming)?.id;

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-1 px-6 py-4" 
        style={{ maxHeight }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Highlighted Contexts Display */}
          {highlightedContexts.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Selected Text Context{highlightedContexts.length > 1 ? 's' : ''}
              </h4>
              <div className="space-y-3">
                {highlightedContexts.map((context, index) => (
                  <div
                    key={`context-${context.id || `fallback-${index}`}`}
                    className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
                  >
                    <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed italic mb-2">
                      "{context.selectedText}"
                    </p>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      From: {context.documentTitle} • Page {context.pageNumber}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="space-y-1">
            {messages.map((message, index) => (
              <MessageBubble
                key={`message-${message.id || `fallback-${index}`}`}
                message={message}
                isStreaming={isStreaming && message.id === streamingMessageId}
                streamingContent={isStreaming && message.id === streamingMessageId ? streamingContent : undefined}
              />
            ))}

            {/* Typing Indicator */}
            {showTypingIndicator && <TypingIndicator />}
          </div>

          {/* Empty State */}
          {messages.length === 0 && highlightedContexts.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                Start a Conversation
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Ask questions about your selected text or start a general discussion.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <Textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                onPaste={handlePaste}
                placeholder={placeholder}
                className="min-h-[60px] max-h-[120px] resize-none"
                disabled={disabled || isLoading}
                maxLength={1000}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || disabled || isLoading}
              className="bg-blue-600 hover:bg-blue-700 min-w-[44px]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Input Footer */}
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Press Enter to send, Shift+Enter for new line
            </p>
            <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center">
                <MessageSquare className="h-3 w-3 mr-1" />
                {messages.length} message{messages.length !== 1 ? 's' : ''}
              </span>
              {isStreaming && (
                <span className="flex items-center text-blue-500">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Streaming
                </span>
              )}
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveChat; 