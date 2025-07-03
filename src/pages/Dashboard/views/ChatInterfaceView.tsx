import ChatInterface from "@/pages/ChatInterface";
import type { Document, TextSelection } from "@/lib/types";

interface ChatInterfaceViewProps {
  textSelection?: TextSelection;
  document?: Document;
  readOnly: boolean;
  chatSessionId?: string;
  onBack: () => void;
  onEndChat: () => void;
  onAnalyze: () => void;
  onTextSelectionProcessed: () => void;
}

export const ChatInterfaceView = ({
  textSelection,
  document,
  readOnly,
  chatSessionId,
  onBack,
  onEndChat,
  onAnalyze,
  onTextSelectionProcessed
}: ChatInterfaceViewProps) => {
  return (
    <ChatInterface
      textSelection={textSelection}
      document={document}
      onBack={onBack}
      onEndChat={onEndChat}
      onAnalyze={onAnalyze}
      onTextSelectionProcessed={onTextSelectionProcessed}
      readOnly={readOnly}
      chatSessionId={chatSessionId}
    />
  );
}; 