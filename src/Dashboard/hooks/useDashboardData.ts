import { useState, useEffect } from "react";
import { getRecentDocuments, getDashboardStats } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Document } from "@/lib/types";
import type { DashboardStats } from "../types";

export const useDashboardData = () => {
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    documentCount: 0,
    questionCount: 0,
    responseCount: 0,
    knowledgeCount: 0,
    noteCount: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [documents, stats] = await Promise.all([
          getRecentDocuments(),
          getDashboardStats()
        ]);
        
        setRecentDocuments(documents);
        setDashboardStats(stats);
        
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        toast({
          title: "Failed to Load Data",
          description: "Could not load documents and statistics.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  return {
    recentDocuments,
    setRecentDocuments,
    dashboardStats,
    loading
  };
}; 