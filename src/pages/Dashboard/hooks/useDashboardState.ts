import { useState } from "react";
import type { ViewMode } from "../types";
import type { Document, TextSelection, Concept } from "@/lib/types";

export const useDashboardState = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDocument, setCurrentDocument] = useState<Document | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [isUploadingPDF, setIsUploadingPDF] = useState(false);
  const [currentTextSelection, setCurrentTextSelection] = useState<TextSelection | undefined>();
  const [clearSelectionTrigger, setClearSelectionTrigger] = useState(0);
  const [viewingChatId, setViewingChatId] = useState<string | undefined>();
  const [chatListRefreshTrigger, setChatListRefreshTrigger] = useState(0);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [conceptsLoading, setConceptsLoading] = useState(false);
  const [conceptSearchQuery, setConceptSearchQuery] = useState("");

  return {
    searchQuery,
    setSearchQuery,
    currentDocument,
    setCurrentDocument,
    viewMode,
    setViewMode,
    isUploadingPDF,
    setIsUploadingPDF,
    currentTextSelection,
    setCurrentTextSelection,
    clearSelectionTrigger,
    setClearSelectionTrigger,
    viewingChatId,
    setViewingChatId,
    chatListRefreshTrigger,
    setChatListRefreshTrigger,
    concepts,
    setConcepts,
    conceptsLoading,
    setConceptsLoading,
    conceptSearchQuery,
    setConceptSearchQuery
  };
}; 