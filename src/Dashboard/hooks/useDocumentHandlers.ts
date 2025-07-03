import { useCallback, useEffect } from "react";
import { 
  openPDFDialog, 
  loadPDFDocument, 
  updateDocumentState, 
  updateDocumentTotalPages,
  saveReadingPosition,
  getRecentDocuments
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Document, TextSelection } from "@/lib/types";
import type { ViewMode } from "../types";

interface UseDocumentHandlersProps {
  currentDocument?: Document;
  setCurrentDocument: (doc: Document | undefined) => void;
  setCurrentTextSelection: (selection: TextSelection | undefined) => void;
  setViewMode: (mode: ViewMode) => void;
  setRecentDocuments: (docs: Document[]) => void;
  setIsUploadingPDF: (uploading: boolean) => void;
}

export const useDocumentHandlers = ({
  currentDocument,
  setCurrentDocument,
  setCurrentTextSelection,
  setViewMode,
  setRecentDocuments,
  setIsUploadingPDF
}: UseDocumentHandlersProps) => {
  const { toast } = useToast();

  const handleUploadPDF = useCallback(async () => {
    try {
      setIsUploadingPDF(true);
      
      const filePath = await openPDFDialog();
      if (!filePath) {
        setIsUploadingPDF(false);
        return;
      }
      
      const document = await loadPDFDocument(filePath);
      setCurrentDocument(document);
      setViewMode('reader');
      
      const documents = await getRecentDocuments();
      setRecentDocuments(documents);
      
      toast({
        title: "PDF Loaded",
        description: `Opened "${document.title}" with ${document.totalPages} pages.`,
      });
      
    } catch (error) {
      console.error('Failed to load PDF:', error);
      toast({
        title: "Failed to Load PDF",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPDF(false);
    }
  }, [setIsUploadingPDF, setCurrentDocument, setViewMode, setRecentDocuments, toast]);

  const handleDocumentSelect = useCallback((document: Document) => {
    setCurrentDocument(document);
    setViewMode('reader');
  }, [setCurrentDocument, setViewMode]);

  const handleDocumentUpdate = useCallback(async (updates: Partial<Document>) => {
    if (!currentDocument) return;
    
    const updatedDocument = { ...currentDocument, ...updates };
    setCurrentDocument(updatedDocument);
    
    try {
      if (updates.currentPage !== undefined || updates.zoomLevel !== undefined) {
        await updateDocumentState(
          currentDocument.id,
          updates.currentPage ?? currentDocument.currentPage,
          updates.zoomLevel ?? currentDocument.zoomLevel
        );
      }
    } catch (error) {
      console.error('Failed to sync document state:', error);
    }
  }, [currentDocument, setCurrentDocument]);

  const handlePageChange = useCallback(async (page: number) => {
    handleDocumentUpdate({ currentPage: page });
    
    if (currentDocument) {
      try {
        await saveReadingPosition(currentDocument.id, page, currentDocument.zoomLevel, 0);
      } catch (error) {
        console.error('Failed to save reading position:', error);
      }
    }
  }, [currentDocument, handleDocumentUpdate]);

  const handleZoomChange = useCallback(async (zoom: number) => {
    handleDocumentUpdate({ zoomLevel: zoom });
    
    if (currentDocument) {
      try {
        await saveReadingPosition(currentDocument.id, currentDocument.currentPage, zoom, 0);
      } catch (error) {
        console.error('Failed to save reading position:', error);
      }
    }
  }, [currentDocument, handleDocumentUpdate]);

  const handleDocumentLoad = useCallback(async (document: Document) => {
    handleDocumentUpdate({ totalPages: document.totalPages });
    
    if (currentDocument && document.totalPages !== currentDocument.totalPages) {
      try {
        await updateDocumentTotalPages(currentDocument.id, document.totalPages);
      } catch (error) {
        console.error('Failed to update total pages in database:', error);
      }
    }
  }, [currentDocument, handleDocumentUpdate]);

  const handleTextSelection = useCallback((selection: TextSelection) => {
    setCurrentTextSelection(selection);
  }, [setCurrentTextSelection]);

  // Save reading position when document changes or component unmounts
  useEffect(() => {
    return () => {
      if (currentDocument) {
        saveReadingPosition(
          currentDocument.id, 
          currentDocument.currentPage, 
          currentDocument.zoomLevel, 
          0
        ).catch(error => {
          console.error('Failed to save reading position on cleanup:', error);
        });
      }
    };
  }, [currentDocument]);

  return {
    handleUploadPDF,
    handleDocumentSelect,
    handleDocumentUpdate,
    handlePageChange,
    handleZoomChange,
    handleDocumentLoad,
    handleTextSelection
  };
}; 