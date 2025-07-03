import { useCallback } from "react";
import { getExtractionConcepts, getConceptByIdDetailed } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useDashboardStore } from "@/stores/dashboardStore";

export const useConceptHandlers = () => {
  const { toast } = useToast();
  const { 
    setConcepts, 
    setConceptsLoading, 
    setViewingChatId, 
    setViewMode 
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

  const handleConceptClick = useCallback(async (conceptId: string) => {
    try {
      const conceptDetail = await getConceptByIdDetailed(conceptId);
      if (conceptDetail) {
        console.log('Concept detail:', conceptDetail);
        
        const sourceCount = conceptDetail.sourceChats?.length || 0;
        toast({
          title: "Concept Details",
          description: `"${conceptDetail.name}" found in ${sourceCount} conversation${sourceCount !== 1 ? 's' : ''}. Click "View Source" to navigate to original chat.`,
        });
      }
    } catch (error) {
      console.error('Failed to load concept details:', error);
      toast({
        title: "Failed to Load Details",
        description: "Could not load concept details.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleViewSource = useCallback(async (conceptId: string) => {
    try {
      const conceptDetail = await getConceptByIdDetailed(conceptId);
      if (conceptDetail && conceptDetail.sourceChats && conceptDetail.sourceChats.length > 0) {
        const primarySourceChat = conceptDetail.sourceChats[0];
        
        setViewingChatId(primarySourceChat.id);
        setViewMode('chat-interface');
        
        toast({
          title: "Navigating to Source",
          description: `Opening chat: "${primarySourceChat.title}"`,
        });
      } else {
        toast({
          title: "No Source Found",
          description: "Could not find source conversation for this concept.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to navigate to source:', error);
      toast({
        title: "Navigation Failed",
        description: "Could not navigate to source conversation.",
        variant: "destructive",
      });
    }
  }, [setViewingChatId, setViewMode, toast]);

  return {
    loadConcepts,
    handleConceptClick,
    handleViewSource
  };
}; 