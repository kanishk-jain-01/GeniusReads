import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Loader2, 
  Brain, 
  CheckCircle, 
  AlertCircle,
  Clock
} from "lucide-react";

interface ProcessingIndicatorProps {
  isVisible: boolean;
  stage: string;
  progress: number;
  startTime: number | null;
  error?: string;
  onComplete?: () => void;
}

const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({
  isVisible,
  stage,
  progress,
  startTime,
  error,
  onComplete
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time every second
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isVisible && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isVisible, startTime]);

  // Auto-hide after completion
  useEffect(() => {
    if (progress === 100 && !error) {
      const timeout = setTimeout(() => {
        onComplete?.();
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [progress, error, onComplete]);

  if (!isVisible) return null;

  const getIcon = () => {
    if (error) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    } else if (progress === 100) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
  };

  const getProgressColor = () => {
    if (error) return "bg-red-500";
    if (progress === 100) return "bg-green-500";
    return "bg-blue-500";
  };

  return (
    <Card className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          {getIcon()}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {error ? "Analysis Failed" : stage}
              </span>
              <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                {startTime && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{elapsedTime}s</span>
                  </div>
                )}
                <span>{progress}%</span>
              </div>
            </div>
            <Progress 
              value={progress} 
              className="w-full h-2"
              style={{
                '--progress-background': getProgressColor()
              } as React.CSSProperties}
            />
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                {error}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessingIndicator; 