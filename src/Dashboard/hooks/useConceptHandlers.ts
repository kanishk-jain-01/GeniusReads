import { useCallback } from "react";
import { getExtractionConcepts, getConceptById, getChatsForConcept, searchConceptsByText } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useDashboardStore } from "@/stores/dashboardStore";
import { Concept, ConceptDetail } from "@/lib/types";

export const useConceptHandlers = () => {
  const { toast } = useToast();
  const { 
    setConcepts, 
    setConceptsLoading, 
    setViewingChatId, 
    setViewMode,
    setCurrentConceptDetail,
  } = useDashboardStore();

  const loadConcepts = useCallback(async () => {
    try {
      setConceptsLoading(true);
      const extractedConcepts = await getExtractionConcepts();
      setConcepts(extractedConcepts);
    } catch (error) {
      console.error('Failed to load concepts:', error);
      toast({
        title: "Failed to Load Concepts",
        description: "Could not load extracted concepts from the database.",
        variant: "destructive",
      });
    } finally {
      setConceptsLoading(false);
    }
  }, [setConcepts, setConceptsLoading, toast]);

  const searchConcepts = useCallback(async (query: string) => {
    try {
      setConceptsLoading(true);
      const searchResults = await searchConceptsByText(query);
      setConcepts(searchResults);
    } catch (error) {
      console.error('Failed to search concepts:', error);
      toast({
        title: "Search Failed",
        description: "Could not perform concept search.",
        variant: "destructive",
      });
    } finally {
      setConceptsLoading(false);
    }
  }, [setConcepts, setConceptsLoading, toast]);

  const handleConceptClick = useCallback(async (conceptId: string) => {
    try {
      const concept = await getConceptById(conceptId);
      if (concept) {
        const sourceChats = await getChatsForConcept(conceptId);
        const conceptDetail: ConceptDetail = {
            ...(concept as Concept),
            sourceChats: sourceChats.map((chat: any) => ({
                id: chat.id,
                title: chat.title,
                relevanceScore: chat.relevanceScore,
                createdAt: new Date(chat.createdAt),
            })),
        };

        setCurrentConceptDetail(conceptDetail);
        setViewMode('concept-detail');
      }
    } catch (error) {
      console.error('Failed to load concept details:', error);
      toast({
        title: "Failed to Load Details",
        description: "Could not load concept details.",
        variant: "destructive",
      });
    }
  }, [toast, setCurrentConceptDetail, setViewMode]);

  const handleNavigateToSource = useCallback(async (conceptId: string) => {
    try {
      const sourceChats = await getChatsForConcept(conceptId);

      if (sourceChats && sourceChats.length === 1) {
        const primarySourceChat = sourceChats[0];
        setViewingChatId(primarySourceChat.id);
        setViewMode('chat-interface');
        toast({
          title: "Navigating to Source",
          description: `Opening chat: "${primarySourceChat.title}"`,
        });
      } else {
        // If multiple sources, go to detail page for user to choose
        handleConceptClick(conceptId);
      }
    } catch (error) {
      console.error('Failed to navigate to source:', error);
      toast({
        title: "Navigation Failed",
        description: "Could not navigate to source conversation.",
        variant: "destructive",
      });
    }
  }, [setViewingChatId, setViewMode, toast, handleConceptClick]);

  return {
    loadConcepts,
    searchConcepts,
    handleConceptClick,
    handleNavigateToSource
  };
}; 