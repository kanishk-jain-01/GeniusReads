import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft,
  Brain,
  Square,
  Loader2
} from "lucide-react";
import type { Document, TextSelection } from "@/lib/types";

interface ChatHeaderProps {
  chatTitle: string;
  document?: Document;
  textSelection?: TextSelection;
  readOnly?: boolean;
  isAnalyzing: boolean;
  analysisProgress: number;
  analysisStage: string;
  analysisStartTime: number | null;
  onBack: () => void;
  onEndChat: () => void;
  onAnalyze: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  chatTitle,
  document,
  textSelection,
  readOnly,
  isAnalyzing,
  analysisProgress,
  analysisStage,
  analysisStartTime,
  onBack,
  onEndChat,
  onAnalyze
}) => {
  return (
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
                onClick={onEndChat}
                className="text-red-600 hover:text-red-700"
                disabled={isAnalyzing}
              >
                <Square className="h-4 w-4 mr-2" />
                End
              </Button>
              <Button
                size="sm"
                onClick={onAnalyze}
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
              onClick={onAnalyze}
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
  );
};

export default ChatHeader; 