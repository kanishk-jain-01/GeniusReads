import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft,
  Send,
  MessageSquare, 
  FileText,
  Clock,
  Save,
  Brain,
  Trash2,
  User,
  Bot,
  Loader2
} from "lucide-react";
import type { TextSelection, Document, ChatMessage } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface ChatInterfaceProps {
  textSelection?: TextSelection;
  document?: Document;
  onBack: () => void;
  onSave: () => void;
  onSaveAndAnalyze: () => void;
  onDelete: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  textSelection,
  document,
  onBack,
  onSave,
  onSaveAndAnalyze,
  onDelete
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatTitle, setChatTitle] = useState("");
  const { toast } = useToast();

  // Initialize chat with text selection context
  useEffect(() => {
    if (textSelection && messages.length === 0) {
      // Generate a title from the selected text
      const title = textSelection.selectedText.length > 50 
        ? `Discussion about: ${textSelection.selectedText.substring(0, 50)}...`
        : `Discussion about: ${textSelection.selectedText}`;
      setChatTitle(title);

      // Add initial context message
      const contextMessage: ChatMessage = {
        id: crypto.randomUUID(),
        chatSessionId: "active-chat",
        content: `I'd like to understand this text better: "${textSelection.selectedText}"`,
        senderType: 'user',
        createdAt: new Date()
      };
      setMessages([contextMessage]);
    }
  }, [textSelection, messages.length]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      chatSessionId: "active-chat",
      content: currentMessage,
      senderType: 'user',
      createdAt: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");
    setIsLoading(true);

    // Simulate AI response (will be replaced with actual OpenAI integration in Phase 5)
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: crypto.randomUUID(),
        chatSessionId: "active-chat",
        content: `I understand you're asking about "${currentMessage}". This is a placeholder response that will be replaced with actual AI conversation in Phase 5. The system will integrate with OpenAI GPT-4 to provide real explanations about the selected text.`,
        senderType: 'assistant',
        createdAt: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSaveChat = () => {
    toast({
      title: "Chat Saved",
      description: "Your conversation has been saved to chat history.",
    });
    onSave();
  };

  const handleSaveAndAnalyze = () => {
    toast({
      title: "Chat Saved & Analysis Started",
      description: "Your conversation has been saved and will be analyzed for concepts.",
    });
    onSaveAndAnalyze();
  };

  const handleDeleteChat = () => {
    toast({
      title: "Chat Deleted",
      description: "Your conversation has been deleted.",
      variant: "destructive",
    });
    onDelete();
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

      {/* Selected Text Context */}
      {textSelection && (
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-blue-900 dark:text-blue-100 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Selected Text Context
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-800 dark:text-blue-200 leading-relaxed mb-3 italic">
                "{textSelection.selectedText}"
              </p>
              <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                <FileText className="h-3 w-3 mr-1" />
                Page {textSelection.pageNumber}
                {document && (
                  <>
                    <span className="mx-2">•</span>
                    {document.title}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-start space-x-3 max-w-[80%] ${
                  message.senderType === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.senderType === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-purple-600 text-white'
                  }`}
                >
                  {message.senderType === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-lg px-4 py-3 ${
                    message.senderType === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <div
                    className={`text-xs mt-2 ${
                      message.senderType === 'user'
                        ? 'text-blue-100'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {message.createdAt.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-[80%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <Textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about the selected text..."
                className="min-h-[60px] max-h-[120px] resize-none"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Press Enter to send, Shift+Enter for new line
            </p>
            <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center">
                <MessageSquare className="h-3 w-3 mr-1" />
                {messages.length} messages
              </span>
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Active chat
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface; 