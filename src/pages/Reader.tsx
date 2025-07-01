import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Brain, 
  MessageSquare, 
  Search,
  Lightbulb,
  Save,
  Send,
  Sparkles
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import PDFViewer from "@/components/PDFViewer";
import { openPDFDialog, loadPDFDocument, updateDocumentState, updateDocumentTotalPages, getRecentDocuments } from "@/lib/api";
import type { Document } from "@/lib/types";

const Reader = () => {
  const [currentDocument, setCurrentDocument] = useState<Document | undefined>();
  const [selectedText, setSelectedText] = useState("");
  const [question, setQuestion] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  const location = useLocation();
  const documentId = location.state?.documentId;

  // Load specific document if documentId is provided via navigation state
  useEffect(() => {
    const loadSpecificDocument = async () => {
      if (!documentId) return;
      
      try {
        setIsLoading(true);
        
        // Get all documents and find the one with matching ID
        const documents = await getRecentDocuments();
        const targetDocument = documents.find(doc => doc.id === documentId);
        
        if (targetDocument) {
          setCurrentDocument(targetDocument);
          toast({
            title: "Document Loaded",
            description: `Opened "${targetDocument.title}"`,
          });
        } else {
          toast({
            title: "Document Not Found",
            description: "The requested document could not be found.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Failed to load specific document:', error);
        toast({
          title: "Failed to Load Document",
          description: error instanceof Error ? error.message : "An unknown error occurred.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSpecificDocument();
  }, [documentId, toast]);

  const sampleKnowledge = [
    {
      id: 1,
      concept: "Supervised Learning",
      definition: "A machine learning approach where algorithms learn from labeled training data to make predictions on new data.",
      context: "Page 45 - Introduction to ML Types",
      tags: ["machine-learning", "algorithms", "training"]
    },
    {
      id: 2,
      concept: "Neural Networks",
      definition: "Computing systems inspired by biological neural networks, consisting of interconnected nodes that process information.",
      context: "Page 67 - Deep Learning Fundamentals",
      tags: ["neural-networks", "deep-learning", "nodes"]
    },
    {
      id: 3,
      concept: "Gradient Descent",
      definition: "An optimization algorithm used to minimize the cost function by iteratively moving toward the minimum.",
      context: "Page 89 - Optimization Techniques",
      tags: ["optimization", "algorithm", "cost-function"]
    }
  ];

  // Handle PDF file upload
  const handleUploadPDF = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Open file dialog
      const filePath = await openPDFDialog();
      if (!filePath) {
        setIsLoading(false);
        return; // User cancelled
      }
      
      // Load PDF document
      const document = await loadPDFDocument(filePath);
      setCurrentDocument(document);
      
      toast({
        title: "PDF Loaded Successfully",
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
      setIsLoading(false);
    }
  }, [toast]);

  // Handle document state updates (page, zoom) with database sync
  const handleDocumentUpdate = useCallback(async (updates: Partial<Document>) => {
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
      // Don't show error to user for sync failures - just log them
    }
  }, [currentDocument]);

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    handleDocumentUpdate({ currentPage: page });
  }, [handleDocumentUpdate]);

  // Handle zoom changes
  const handleZoomChange = useCallback((zoom: number) => {
    handleDocumentUpdate({ zoomLevel: zoom });
  }, [handleDocumentUpdate]);

  // Handle document load completion (when PDF.js finishes loading)
  const handleDocumentLoad = useCallback(async (document: Document) => {
    // Update local state
    handleDocumentUpdate({ totalPages: document.totalPages });
    
    // Update database with actual total pages
    if (currentDocument && document.totalPages !== currentDocument.totalPages) {
      try {
        await updateDocumentTotalPages(currentDocument.id, document.totalPages);
      } catch (error) {
        console.error('Failed to update total pages in database:', error);
      }
    }
  }, [handleDocumentUpdate, currentDocument]);

  // Handle text selection (placeholder for Phase 3)
  const handleTextSelect = useCallback((selectedText: string, _coordinates: any) => {
    setSelectedText(selectedText);
    // Phase 3 will implement coordinate storage and question interface
  }, []);

  // Handle AI question processing (placeholder for Phase 4)
  const handleAskQuestion = useCallback(() => {
    if (!question.trim()) return;
    
    setIsAiThinking(true);
    // Simulate AI processing for now
    setTimeout(() => {
      setIsAiThinking(false);
      setQuestion("");
      setSelectedText("");
    }, 3000);
  }, [question]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    GeniusReads
                  </h1>
                  <p className="text-xs text-slate-600">PDF Reader</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
              <Button 
                onClick={handleUploadPDF}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLoading ? (
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {isLoading ? "Loading..." : "Upload PDF"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)] overflow-hidden">
        {/* Main Content Area - PDF Viewer */}
        <div className="flex-1 min-w-0 flex flex-col bg-white/60 backdrop-blur-sm border-r border-slate-200">
          <PDFViewer
            document={currentDocument}
            onDocumentLoad={handleDocumentLoad}
            onPageChange={handlePageChange}
            onZoomChange={handleZoomChange}
            onTextSelect={handleTextSelect}
          />

          {/* Question Interface */}
          {selectedText && (
            <div className="bg-white border-t border-slate-200 p-6">
              <div className="mb-4">
                <h4 className="font-medium text-slate-900 mb-2">Selected Text:</h4>
                <p className="text-sm text-slate-600 bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
                  "{selectedText}"
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Input
                  placeholder="Ask a question about this text..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                />
                <Button 
                  onClick={handleAskQuestion}
                  disabled={isAiThinking || !question.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isAiThinking ? (
                    <Sparkles className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {isAiThinking && (
                <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-blue-600 animate-spin" />
                    <span className="text-blue-700 font-medium">AI is thinking...</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    Analyzing your question and generating a helpful explanation.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Knowledge Sidebar */}
        <div className="w-80 flex-shrink-0 bg-white/80 backdrop-blur-sm border-l border-slate-200 flex flex-col">
          <div className="p-6 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-600" />
              Knowledge Base
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search concepts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {sampleKnowledge.map((item) => (
                <Card key={item.id} className="bg-white/60 backdrop-blur-sm border-slate-200 hover:shadow-md transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-medium text-slate-900">
                        {item.concept}
                      </CardTitle>
                      <Lightbulb className="h-4 w-4 text-yellow-500 flex-shrink-0 ml-2" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                      {item.definition}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{item.context}</span>
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                        <Save className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <div className="p-6 border-t border-slate-200">
            <Card className="bg-gradient-to-r from-green-500 to-blue-500 border-0 text-white">
              <CardContent className="p-4 text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm font-medium mb-1">12 Questions Asked</p>
                <p className="text-xs text-green-100">8 New Concepts Learned</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reader;
