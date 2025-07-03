import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { LibraryPage } from "./pages/LibraryPage";
import { ReaderPage } from "./pages/ReaderPage";
import { ChatPage } from "./pages/ChatPage";
import { ChatInterfacePage } from "./pages/ChatInterfacePage";
import { KnowledgePage } from "./pages/KnowledgePage";
import PreferencesPage from "./pages/PreferencesPage";
import { useDashboardStore } from "@/stores/dashboardStore";
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
    currentTextSelection,
    isUploadingPDF,
  } = useDashboardStore();

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
    setRecentDocuments,
  });

  const {
    handleChatSelect,
    handleStartNewChat,
    handleChatBack,
    handleChatEnd,
    handleChatAnalyze,
    handleTextSelectionProcessed,
    refreshChatList
  } = useChatHandlers();

  const {
    loadConcepts,
    handleConceptClick,
    handleViewSource
  } = useConceptHandlers();

  useKeyboardShortcuts({
    recentDocuments,
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
          <LibraryPage
            recentDocuments={recentDocuments}
            loading={loading}
            onUploadPDF={handleUploadPDF}
            onDocumentSelect={handleDocumentSelect}
          />
        );
      case 'reader':
        return (
          <ReaderPage
            onBackToLibrary={() => setViewMode('library')}
            onDocumentLoad={handleDocumentLoad}
            onPageChange={handlePageChange}
            onZoomChange={handleZoomChange}
            onTextSelect={handleTextSelection}
          />
        );
      case 'chat':
        return (
          <ChatPage
            activeTextSelection={getHighlightedContext()}
            onChatSelect={handleChatSelect}
            onStartNewChat={handleStartNewChat}
            onChatDelete={refreshChatList}
          />
        );
      case 'chat-interface':
        return (
          <ChatInterfacePage
            onBack={handleChatBack}
            onEndChat={handleChatEnd}
            onAnalyze={handleChatAnalyze}
            onTextSelectionProcessed={handleTextSelectionProcessed}
          />
        );
      case 'knowledge':
        return (
          <KnowledgePage
            onConceptClick={handleConceptClick}
            onViewSource={handleViewSource}
          />
        );
      case 'preferences':
        return (
          <PreferencesPage onBack={() => setViewMode('library')} />
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