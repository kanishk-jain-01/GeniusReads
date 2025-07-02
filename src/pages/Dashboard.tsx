import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ThemeToggle } from "@/components/theme-toggle";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { getRecentDocuments, getDashboardStats, openPDFDialog, loadPDFDocument, updateDocumentState, updateDocumentTotalPages } from "@/lib/api";
import type { Document, TextSelection, NavigationState } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

type ViewMode = 'library' | 'reader' | 'chat' | 'knowledge';

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

  // Handle CMD+K: Navigate to Chat tab with text selection
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
    
    setViewMode('chat');
  };

  // Handle CMD+L: Toggle between Library and Chat tabs
  const handleCmdL = () => {
    if (viewMode === 'chat') {
      // Return to previous reading position or library
      if (navigationState.readingPosition && navigationState.previousTab === 'reader') {
        setViewMode('reader');
      } else {
        setViewMode('library');
      }
    } else if (viewMode === 'reader' || viewMode === 'library') {
      setViewMode('chat');
    }
  };

  // Handle text selection from PDF viewer
  const handleTextSelection = (selection: TextSelection) => {
    setCurrentTextSelection(selection);
    // Don't automatically navigate to chat - wait for CMD+K
  };

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    onCmdK: handleCmdK,
    onCmdL: handleCmdL,
    currentTextSelection,
    navigationState,
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
  const handlePageChange = (page: number) => {
    handleDocumentUpdate({ currentPage: page });
  };

  // Handle zoom changes
  const handleZoomChange = (zoom: number) => {
    handleDocumentUpdate({ zoomLevel: zoom });
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

  const sampleKnowledge = [
    {
      id: 1,
      concept: "Supervised Learning",
      definition: "A machine learning approach where algorithms learn from labeled training data.",
      context: "Introduction to ML Types",
      tags: ["machine-learning", "algorithms"]
    },
    {
      id: 2,
      concept: "Neural Networks", 
      definition: "Computing systems inspired by biological neural networks with interconnected nodes.",
      context: "Deep Learning Fundamentals",
      tags: ["neural-networks", "deep-learning"]
    },
    {
      id: 3,
      concept: "Gradient Descent",
      definition: "An optimization algorithm used to minimize cost functions iteratively.",
      context: "Optimization Techniques", 
      tags: ["optimization", "algorithm"]
    }
  ];

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
            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
              <Settings className="h-4 w-4" />
              <span>Preferences</span>
            </button>
          </div>
          
          {/* Theme Toggle */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Appearance</div>
            <div className="flex justify-start">
              <ThemeToggle />
            </div>
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
          <div className="flex-1 flex flex-col">
            {/* Chat Toolbar */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">AI Chat</h2>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCmdL}
                  >
                    ← Back to Reading
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat Content */}
            <div className="flex-1 flex flex-col">
              {currentTextSelection ? (
                <div className="flex-1 p-6">
                  <div className="max-w-4xl mx-auto">
                    {/* Selected Text Display */}
                    <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium text-blue-900 dark:text-blue-100 flex items-center">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Selected Text from {currentDocument?.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-blue-800 dark:text-blue-200 leading-relaxed mb-3">
                          "{currentTextSelection.selectedText}"
                        </p>
                        <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                          <FileText className="h-3 w-3 mr-1" />
                          Page {currentTextSelection.pageNumber}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Chat Interface Placeholder */}
                    <Card className="bg-white dark:bg-slate-800">
                      <CardContent className="p-6">
                        <div className="text-center py-12">
                          <MessageSquare className="h-16 w-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                            Chat Interface Coming Soon
                          </h3>
                          <p className="text-slate-600 dark:text-slate-400 mb-6">
                            AI conversation functionality will be implemented in Phase 4.
                          </p>
                          <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 text-left">
                            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                              <strong>Selected Text:</strong>
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                              "{currentTextSelection.selectedText}"
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                      No Text Selected
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">
                      Highlight text in a PDF and press CMD+K to start a conversation.
                    </p>
                    <Button onClick={() => setViewMode('library')} variant="outline">
                      Go to Library
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sampleKnowledge.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-all duration-200 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium text-slate-900 dark:text-slate-100 flex items-center justify-between">
                        {item.concept}
                        <Brain className="h-4 w-4 text-purple-500" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                        {item.definition}
                      </p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-slate-500 dark:text-slate-400">{item.context}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs px-2 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
