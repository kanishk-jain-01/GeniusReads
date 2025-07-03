import { useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { LibraryView } from "./views/LibraryView";
import { ReaderView } from "./views/ReaderView";
import { ChatView } from "./views/ChatView";
import { ChatInterfaceView } from "./views/ChatInterfaceView";
import { KnowledgeView } from "./views/KnowledgeView";
import { PreferencesView } from "./views/PreferencesView";
import { useDashboardState } from "./hooks/useDashboardState";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useDashboardData } from "./hooks/useDashboardData";
import { useDocumentHandlers } from "./hooks/useDocumentHandlers";
import { useChatHandlers } from "./hooks/useChatHandlers";
import { useConceptHandlers } from "./hooks/useConceptHandlers";


const Dashboard = () => {
  const {
    viewMode,
    setViewMode,
    currentDocument,
    setCurrentDocument,
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
    setConceptSearchQuery,
    searchQuery,
    setSearchQuery,
    isUploadingPDF,
    setIsUploadingPDF
  } = useDashboardState();

  const {
    recentDocuments,
    setRecentDocuments,
    dashboardStats,
    loading
  } = useDashboardData();

  const {
    handleUploadPDF,
    handleDocumentSelect,
    handlePageChange,
    handleZoomChange,
    handleDocumentLoad,
    handleTextSelection
  } = useDocumentHandlers({
    currentDocument,
    setCurrentDocument,
    setCurrentTextSelection,
    setViewMode,
    setRecentDocuments,
    setIsUploadingPDF
  });

  const {
    handleChatSelect,
    handleStartNewChat,
    handleChatBack,
    handleChatEnd,
    handleChatAnalyze,
    handleTextSelectionProcessed,
    refreshChatList
  } = useChatHandlers({
    setViewingChatId,
    setViewMode,
    setCurrentTextSelection,
    setChatListRefreshTrigger,
    setConcepts,
    setConceptsLoading
  });

  const {
    loadConcepts,
    handleConceptClick,
    handleViewSource
  } = useConceptHandlers({
    setConcepts,
    setConceptsLoading,
    setViewingChatId,
    setViewMode
  });

  useKeyboardShortcuts({
    currentTextSelection,
    setCurrentTextSelection,
    setClearSelectionTrigger,
    setViewMode,
    currentDocument,
    recentDocuments,
    setCurrentDocument,
    viewMode
  });

  // Load concepts when knowledge tab is accessed
  useEffect(() => {
    if (viewMode === 'knowledge') {
      loadConcepts();
    }
  }, [viewMode, loadConcepts]);

  const getHighlightedContext = () => {
    if (!currentTextSelection || !currentDocument) return undefined;
    
    return {
      id: currentTextSelection.id,
      documentId: currentTextSelection.documentId,
      documentTitle: currentDocument.title,
      pageNumber: currentTextSelection.pageNumber,
      selectedText: currentTextSelection.selectedText,
      textCoordinates: currentTextSelection.boundingBoxes.map(box => ({
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height
      })),
      createdAt: currentTextSelection.createdAt
    };
  };

  const renderCurrentView = () => {
    switch (viewMode) {
      case 'library':
        return (
          <LibraryView
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            recentDocuments={recentDocuments}
            loading={loading}
            isUploadingPDF={isUploadingPDF}
            onUploadPDF={handleUploadPDF}
            onDocumentSelect={handleDocumentSelect}
          />
        );
      case 'reader':
        return (
          <ReaderView
            currentDocument={currentDocument}
            clearSelectionTrigger={clearSelectionTrigger}
            onBackToLibrary={() => setViewMode('library')}
            onDocumentLoad={handleDocumentLoad}
            onPageChange={handlePageChange}
            onZoomChange={handleZoomChange}
            onTextSelect={handleTextSelection}
          />
        );
      case 'chat':
        return (
          <ChatView
            activeTextSelection={getHighlightedContext()}
            currentDocument={currentDocument}
            refreshTrigger={chatListRefreshTrigger}
            onChatSelect={handleChatSelect}
            onStartNewChat={handleStartNewChat}
            onChatDelete={refreshChatList}
          />
        );
      case 'chat-interface':
        return (
          <ChatInterfaceView
            textSelection={currentTextSelection}
            document={currentDocument}
            readOnly={!!viewingChatId}
            chatSessionId={viewingChatId}
            onBack={handleChatBack}
            onEndChat={handleChatEnd}
            onAnalyze={handleChatAnalyze}
            onTextSelectionProcessed={handleTextSelectionProcessed}
          />
        );
      case 'knowledge':
        return (
          <KnowledgeView
            concepts={concepts}
            conceptsLoading={conceptsLoading}
            conceptSearchQuery={conceptSearchQuery}
            setConceptSearchQuery={setConceptSearchQuery}
            onConceptClick={handleConceptClick}
            onViewSource={handleViewSource}
          />
        );
      case 'preferences':
        return (
          <PreferencesView onBack={() => setViewMode('library')} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex overflow-hidden">
      <Sidebar
        viewMode={viewMode}
        setViewMode={setViewMode}
        dashboardStats={dashboardStats}
        isUploadingPDF={isUploadingPDF}
        onUploadPDF={handleUploadPDF}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default Dashboard; 