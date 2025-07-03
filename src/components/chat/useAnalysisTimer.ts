import { useEffect } from "react";

interface UseAnalysisTimerProps {
  isAnalyzing: boolean;
  analysisStartTime: number | null;
  setAnalysisStartTime: React.Dispatch<React.SetStateAction<number | null>>;
}

export const useAnalysisTimer = ({
  isAnalyzing,
  analysisStartTime,
  setAnalysisStartTime
}: UseAnalysisTimerProps) => {
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
  }, [isAnalyzing, analysisStartTime, setAnalysisStartTime]);
}; 