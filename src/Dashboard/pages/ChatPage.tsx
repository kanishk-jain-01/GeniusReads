import { ChatList } from "@/components/chat";
import { useToast } from "@/hooks/use-toast";
import type { Document, HighlightedContext } from "@/lib/types";

interface ChatPageProps {
  activeTextSelection?: HighlightedContext;
  currentDocument?: Document;
  refreshTrigger: number;
  onChatSelect: (chatId: string) => void;
  onStartNewChat: () => void;
  onChatDelete: () => void;
}

export const ChatPage = ({
  activeTextSelection,
  currentDocument,
  refreshTrigger,
  onChatSelect,
  onStartNewChat,
  onChatDelete
}: ChatPageProps) => {
  const { toast } = useToast();

  const handleChatDelete = (_chatId: string) => {
    onChatDelete();
    toast({
      title: "Chat Deleted",
      description: "The conversation has been removed from your history.",
    });
  };

  return (
    <ChatList
      activeTextSelection={activeTextSelection}
      currentDocument={currentDocument}
      onChatSelect={onChatSelect}
      onStartNewChat={onStartNewChat}
      onChatDelete={handleChatDelete}
      refreshTrigger={refreshTrigger}
    />
  );
}; 