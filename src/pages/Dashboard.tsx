import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  Brain, 
  MessageSquare, 
  Search, 
  Clock, 
  FileText,
  Plus,
  ArrowRight,
  Library,
  Settings,
  Upload
} from "lucide-react";
import PDFViewer from "@/components/PDFViewer";
import ChatInterface from "@/pages/ChatInterface";
import ChatList from "@/components/ChatList";
import Preferences from "@/pages/Preferences";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { 
  getRecentDocuments, 
  getDashboardStats, 
  openPDFDialog, 
  loadPDFDocument, 
  updateDocumentState, 
  updateDocumentTotalPages,
  saveReadingPosition,
  getLastReadingPosition
} from "@/lib/api";
import type { Document, TextSelection, NavigationState, HighlightedContext } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

type ViewMode = 'library' | 'reader' | 'chat' | 'chat-interface' | 'knowledge' | 'preferences';

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [currentDocument, setCurrentDocument] = useState<Document | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [dashboardStats, setDashboardStats] = useState({
    documentCount: 0,
    questionCount: 0,
    responseCount: 0,
    knowledgeCount: 0,
    noteCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [isUploadingPDF, setIsUploadingPDF] = useState(false);
  const [currentTextSelection, setCurrentTextSelection] = useState<TextSelection | undefined>();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentTab: 'library'
  });
  const { toast } = useToast();

  // Handle CMD+K: Navigate directly to active chat interface
  const handleCmdK = (textSelection?: TextSelection) => {
    if (textSelection) {
      setCurrentTextSelection(textSelection);
      toast({
        title: "Text Selected",
        description: `Selected: "${textSelection.selectedText.substring(0, 50)}${textSelection.selectedText.length > 50 ? '...' : ''}"`,
      });
    }
    
    // Save current reading position if in reader mode
    if (viewMode === 'reader' && currentDocument) {
      setNavigationState(prev => ({
        ...prev,
        previousTab: 'reader',
        readingPosition: {
          documentId: currentDocument.id,
          page: currentDocument.currentPage,
          zoom: currentDocument.zoomLevel,
          scroll: 0 // TODO: Implement scroll position tracking
        }
      }));
    }
    
    // Navigate directly to chat interface (not chat list)
    setViewMode('chat-interface');
  };

  // Handle CMD+L: Toggle between active chat interface and reading position
  const handleCmdL = () => {
    if (viewMode === 'chat-interface') {
      // Return to previous reading position or library
      if (navigationState.readingPosition && navigationState.previousTab === 'reader') {
        setViewMode('reader');
      } else {
        setViewMode('library');
      }
    } else if (viewMode === 'reader' || viewMode === 'library') {
      // Navigate directly to chat interface if there's an active selection
      if (currentTextSelection) {
        setViewMode('chat-interface');
      } else {
        setViewMode('chat'); // Go to chat list if no active selection
      }
    }
  };

  // Handle text selection from PDF viewer
  const handleTextSelection = (selection: TextSelection) => {
    setCurrentTextSelection(selection);
    // Don't automatically navigate to chat - wait for CMD+K
  };

  // Convert TextSelection to HighlightedContext
  const getHighlightedContext = (): HighlightedContext | undefined => {
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

  // Handle chat selection from ChatList
  const handleChatSelect = (_chatId: string) => {
    // Navigate to individual chat interface
    setViewMode('chat-interface');
    // TODO: Load specific chat data based on chatId in future tasks
  };

  // Handle starting new chat from ChatList
  const handleStartNewChat = () => {
    // Navigate to active chat interface
    setViewMode('chat-interface');
  };

  // Handle chat interface actions
  const handleChatBack = () => {
    // Return to previous location based on how chat was accessed
    if (navigationState.previousTab === 'reader') {
      setViewMode('reader');
    } else {
      setViewMode('chat'); // Go to chat list
    }
  };

  const handleChatSave = () => {
    // Save chat and return to reading position
    setCurrentTextSelection(undefined);
    if (navigationState.readingPosition && navigationState.previousTab === 'reader') {
      setViewMode('reader');
    } else {
      setViewMode('library');
    }
  };

  const handleChatSaveAndAnalyze = () => {
    // Save chat, trigger analysis, and navigate to Knowledge tab
    setCurrentTextSelection(undefined);
    setViewMode('knowledge');
    toast({
      title: "Analysis Started",
      description: "Your conversation is being analyzed for concepts. Check the Knowledge tab for results.",
    });
  };

  const handleChatDelete = () => {
    // Delete chat and return to reading position
    setCurrentTextSelection(undefined);
    if (navigationState.readingPosition && navigationState.previousTab === 'reader') {
      setViewMode('reader');
    } else {
      setViewMode('library');
    }
  };

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    onCmdK: handleCmdK,
    onCmdL: handleCmdL,
    currentTextSelection,
    enabled: true
  });

  // Helper function to calculate reading progress
  const calculateProgress = (currentPage: number, totalPages: number): number => {
    if (totalPages === 0) return 0;
    return Math.round((currentPage / totalPages) * 100);
  };

  // Helper function to format last accessed time
  const formatLastAccessed = (date: Date): string => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days} days ago`;
    }
  };

  // Load dashboard data on component mount
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
        
        // Restore last reading position
        try {
          const lastPosition = await getLastReadingPosition();
          if (lastPosition && documents.length > 0) {
            // Find the document that was being read
            const lastDocument = documents.find(doc => doc.id === lastPosition.documentId);
            if (lastDocument) {
              // Update document with saved position
              const restoredDocument = {
                ...lastDocument,
                currentPage: lastPosition.page,
                zoomLevel: lastPosition.zoom
              };
              setCurrentDocument(restoredDocument);
              setViewMode('reader');
              
              toast({
                title: "Reading Position Restored",
                description: `Returned to page ${lastPosition.page} of "${lastDocument.title}"`,
              });
            }
          }
        } catch (error) {
          console.error('Failed to restore reading position:', error);
          // Don't show error toast for this - it's not critical
        }
        
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

  // Save reading position when document changes or component unmounts
  useEffect(() => {
    return () => {
      // Save current reading position when navigating away or closing app
      if (currentDocument && viewMode === 'reader') {
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
  }, [currentDocument, viewMode]);

  // Handle PDF file upload
  const handleUploadPDF = async () => {
    try {
      setIsUploadingPDF(true);
      
      // Open file dialog
      const filePath = await openPDFDialog();
      if (!filePath) {
        setIsUploadingPDF(false);
        return; // User cancelled
      }
      
      // Load PDF document
      const document = await loadPDFDocument(filePath);
      setCurrentDocument(document);
      setViewMode('reader');
      
      // Refresh document list
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
  };

  // Handle document selection
  const handleDocumentSelect = (document: Document) => {
    setCurrentDocument(document);
    setViewMode('reader');
  };

  // Handle document state updates with database sync
  const handleDocumentUpdate = async (updates: Partial<Document>) => {
    if (!currentDocument) return;
    
    const updatedDocument = { ...currentDocument, ...updates };
    setCurrentDocument(updatedDocument);
    
    // Sync with database
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
  };

  // Handle page changes
  const handlePageChange = async (page: number) => {
    handleDocumentUpdate({ currentPage: page });
    
    // Save reading position to database
    if (currentDocument) {
      try {
        await saveReadingPosition(currentDocument.id, page, currentDocument.zoomLevel, 0);
      } catch (error) {
        console.error('Failed to save reading position:', error);
      }
    }
  };

  // Handle zoom changes
  const handleZoomChange = async (zoom: number) => {
    handleDocumentUpdate({ zoomLevel: zoom });
    
    // Save reading position to database
    if (currentDocument) {
      try {
        await saveReadingPosition(currentDocument.id, currentDocument.currentPage, zoom, 0);
      } catch (error) {
        console.error('Failed to save reading position:', error);
      }
    }
  };

  // Handle document load completion
  const handleDocumentLoad = async (document: Document) => {
    handleDocumentUpdate({ totalPages: document.totalPages });
    
    if (currentDocument && document.totalPages !== currentDocument.totalPages) {
      try {
        await updateDocumentTotalPages(currentDocument.id, document.totalPages);
      } catch (error) {
        console.error('Failed to update total pages in database:', error);
      }
    }
  };

  const sidebarItems = [
    { id: 'library', label: 'Library', icon: Library, active: viewMode === 'library' },
    { id: 'chat', label: 'Chat', icon: MessageSquare, active: viewMode === 'chat' },
    { id: 'knowledge', label: 'Knowledge', icon: Brain, active: viewMode === 'knowledge' },
  ];

  const knowledgeStats = [
    { label: "Documents", value: dashboardStats.documentCount, icon: BookOpen, color: "text-blue-600" },
    { label: "Concepts", value: dashboardStats.knowledgeCount, icon: Brain, color: "text-purple-600" },
    { label: "Questions", value: dashboardStats.questionCount, icon: MessageSquare, color: "text-green-600" },
  ];

  // TODO: Replace with real API calls to fetch knowledge entries from database

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
        {/* App Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">GeniusReads</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">AI-Powered Reading</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 gap-3">
            {knowledgeStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div className="flex items-center space-x-2">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  <span className="text-sm text-slate-600 dark:text-slate-300">{stat.label}</span>
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setViewMode(item.id as ViewMode)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  item.active 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Upload Button */}
        <div className="p-4">
          <Button 
            onClick={handleUploadPDF}
            disabled={isUploadingPDF}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isUploadingPDF ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add PDF
              </>
            )}
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex-1 p-4">
          <div className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Quick Actions</div>
          <div className="space-y-1">
            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
              <Search className="h-4 w-4" />
              <span>Search Knowledge</span>
            </button>
            <button 
              onClick={() => setViewMode('preferences')}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <Settings className="h-4 w-4" />
              <span>Preferences</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {viewMode === 'library' && (
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Document Library</h2>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-80"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Document Grid */}
            <ScrollArea className="flex-1 p-6">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
                        <div className="h-2 bg-slate-200 rounded w-full"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : recentDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FileText className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No Documents Yet</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                    Start your learning journey by adding your first PDF document.
                  </p>
                  <Button 
                    onClick={handleUploadPDF}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Add Your First PDF
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentDocuments.map((doc) => {
                    const progress = calculateProgress(doc.currentPage, doc.totalPages);
                    return (
                      <Card key={doc.id} className="hover:shadow-md transition-all duration-200 cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" onClick={() => handleDocumentSelect(doc)}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 line-clamp-2">{doc.title}</h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                                {doc.author || 'Unknown Author'}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-slate-400 dark:text-slate-500">
                                <span className="flex items-center">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {doc.totalPages} pages
                                </span>
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatLastAccessed(doc.lastAccessed)}
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500 dark:text-slate-400">Page {doc.currentPage} of {doc.totalPages}</span>
                              <Badge variant="secondary" className="text-xs">{progress}%</Badge>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5">
                              <div 
                                className="bg-gradient-to-r from-blue-600 to-purple-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {viewMode === 'reader' && (
          <div className="flex-1 flex flex-col">
            {currentDocument ? (
              <>
                {/* Reader Toolbar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewMode('library')}
                      >
                        ← Library
                      </Button>
                      <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 truncate">
                        {currentDocument.title}
                      </h2>
                    </div>
                  </div>
                </div>
                
                {/* PDF Viewer */}
                <div className="flex-1 overflow-hidden">
                  <PDFViewer
                    document={currentDocument}
                    onDocumentLoad={handleDocumentLoad}
                    onPageChange={handlePageChange}
                    onZoomChange={handleZoomChange}
                    onTextSelect={handleTextSelection}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No Document Selected</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-4">Choose a document from your library to start reading.</p>
                  <Button onClick={() => setViewMode('library')} variant="outline">
                    Go to Library
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === 'chat' && (
          <ChatList
            activeTextSelection={getHighlightedContext()}
            currentDocument={currentDocument}
            onChatSelect={handleChatSelect}
            onStartNewChat={handleStartNewChat}
          />
        )}

        {viewMode === 'chat-interface' && (
          <ChatInterface
            textSelection={currentTextSelection}
            document={currentDocument}
            onBack={handleChatBack}
            onSave={handleChatSave}
            onSaveAndAnalyze={handleChatSaveAndAnalyze}
            onDelete={handleChatDelete}
          />
        )}

        {viewMode === 'knowledge' && (
          <div className="flex-1 flex flex-col">
            {/* Knowledge Toolbar */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Knowledge Base</h2>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Search concepts..."
                      className="pl-10 w-80"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Knowledge Grid */}
            <ScrollArea className="flex-1 p-6">
              {/* Empty State for Knowledge */}
              <div className="text-center py-12">
                <Brain className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  No Concepts Yet
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                  Start conversations about your PDFs to build your knowledge base. Concepts will appear here after AI analysis.
                </p>
              </div>
            </ScrollArea>
          </div>
        )}

        {viewMode === 'preferences' && (
          <Preferences onBack={() => setViewMode('library')} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
