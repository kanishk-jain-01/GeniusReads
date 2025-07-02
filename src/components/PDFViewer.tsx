import { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { readPDFFile } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTextSelection } from '@/hooks/use-text-selection';
import TextSelectionOverlay from '@/components/TextSelectionOverlay';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Upload, 
  FileText,
  Loader2
} from 'lucide-react';
import type { Document as DocumentType, TextSelection } from '@/lib/types';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PDFViewerProps {
  document?: DocumentType;
  onDocumentLoad?: (document: DocumentType) => void;
  onPageChange?: (page: number) => void;
  onZoomChange?: (zoom: number) => void;
  onTextSelect?: (selection: TextSelection) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  document,
  onDocumentLoad,
  onPageChange,
  onZoomChange,
  onTextSelect
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pageInput, setPageInput] = useState<string>('1');
  const [pdfData, setPdfData] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  // Text selection functionality
  const {
    isSelecting,
    // currentSelection,
    selectionRects,
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    // clearSelection,
    hasSelection,
    // selectedText
  } = useTextSelection({
    document,
    currentPage,
    onTextSelected: onTextSelect,
    enabled: !!document
  });

  // Sync with document state from database
  useEffect(() => {
    if (document) {
      setCurrentPage(document.currentPage);
      setZoomLevel(document.zoomLevel);
      setPageInput(document.currentPage.toString());
    }
  }, [document]);

  // Load PDF data when document changes
  useEffect(() => {
    if (document?.filePath) {
      setLoading(true);
      setError(null);
      setPdfData(null);
      
      readPDFFile(document.filePath)
        .then((data) => {
          setPdfData(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Failed to load PDF data:', error);
          setError('Failed to load PDF file');
          setLoading(false);
          toast({
            title: "Failed to Load PDF",
            description: "Could not read the PDF file. Please check file permissions.",
            variant: "destructive",
          });
        });
    }
  }, [document?.filePath, toast]);

  // Handle successful PDF load
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    
    if (onDocumentLoad && document) {
      onDocumentLoad({
        ...document,
        totalPages: numPages
      });
    }
  }, [document, onDocumentLoad]);

  // Handle PDF load error
  const onDocumentLoadError = useCallback((error: Error) => {
    setLoading(false);
    setError('Failed to load PDF');
    console.error('PDF load error:', error);
    
    toast({
      title: "Invalid PDF",
      description: "Could not load the selected PDF file. Please try a different file.",
      variant: "destructive",
    });
  }, [toast]);

  // Handle page navigation
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);
      setPageInput(newPage.toString());
      onPageChange?.(newPage);
    }
  }, [numPages, onPageChange]);

  // Handle zoom changes
  const handleZoomChange = useCallback((newZoom: number) => {
    const clampedZoom = Math.max(50, Math.min(200, newZoom));
    setZoomLevel(clampedZoom);
    onZoomChange?.(clampedZoom);
  }, [onZoomChange]);

  // Handle page input
  const handlePageInputChange = useCallback((value: string) => {
    setPageInput(value);
    const pageNum = parseInt(value, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= numPages) {
      handlePageChange(pageNum);
    }
  }, [numPages, handlePageChange]);

  if (!document) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <FileText className="h-16 w-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            No PDF Loaded
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Click "Upload PDF" to select a document to read
          </p>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Upload className="mr-2 h-4 w-4" />
            Upload PDF
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 pdf-viewer-container">
      {/* PDF Controls Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm pdf-viewer-controls">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 truncate">
            {document.title}
          </h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleZoomChange(zoomLevel - 10)}
              disabled={zoomLevel <= 50}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-700 dark:text-slate-300 min-w-[60px] text-center font-medium">
              {zoomLevel}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleZoomChange(zoomLevel + 10)}
              disabled={zoomLevel >= 200}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Page</span>
              <Input
                type="number"
                value={pageInput}
                onChange={(e) => handlePageInputChange(e.target.value)}
                className="w-16 h-8 text-center text-sm"
                min={1}
                max={numPages}
              />
              <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">of {numPages}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {numPages > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
              {Math.round((currentPage / numPages) * 100)}% Complete
            </Badge>
          )}
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-800 p-6 pdf-viewer-content">
        <div className="flex justify-center min-h-0">
          <Card className="bg-white shadow-lg max-w-full border-slate-200 dark:shadow-xl dark:shadow-black/20">
            <CardContent className="p-0 relative" ref={containerRef}>
              {loading && (
                <div className="flex items-center justify-center h-96 bg-white">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-slate-700">Loading PDF...</span>
                </div>
              )}
              
              {error && (
                <div className="flex items-center justify-center h-96 text-red-600 bg-white">
                  <p>{error}</p>
                </div>
              )}
              
              {pdfData && (
                <>
                  <Document
                    file={pdfData}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div className="flex items-center justify-center h-96 bg-white">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <span className="ml-2 text-slate-700">Loading PDF...</span>
                      </div>
                    }
                    error={
                      <div className="flex items-center justify-center h-96 text-red-600 bg-white">
                        <p>Failed to load PDF</p>
                      </div>
                    }
                  >
                    <Page
                      pageNumber={currentPage}
                      scale={zoomLevel / 100}
                      renderTextLayer={true}
                      renderAnnotationLayer={false}
                      className="pdf-page"
                    />
                  </Document>
                  
                  {/* Text Selection Overlay */}
                  <TextSelectionOverlay
                    isSelecting={isSelecting}
                    selectionRects={selectionRects}
                    hasSelection={hasSelection}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer; 