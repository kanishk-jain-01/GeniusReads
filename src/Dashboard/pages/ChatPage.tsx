import { ChatList } from "@/components/chat";
import { useToast } from "@/hooks/use-toast";
import type { HighlightedContext } from "@/lib/types";
import { useDashboardStore } from "@/stores/dashboardStore";

interface ChatPageProps {
  activeTextSelection?: HighlightedContext;
  onChatSelect: (chatId: string) => void;
  onStartNewChat: () => void;
  onChatDelete: () => void;
}

export const ChatPage = ({
  activeTextSelection,
  onChatSelect,
  onStartNewChat,
  onChatDelete
}: ChatPageProps) => {
  const { toast } = useToast();
  const { currentDocument, chatListRefreshTrigger: refreshTrigger } = useDashboardStore();

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