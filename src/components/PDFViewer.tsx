import { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Upload, 
  FileText,
  Loader2
} from 'lucide-react';
import type { Document as DocumentType } from '@/lib/types';

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
  onTextSelect?: (selectedText: string, coordinates: any) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  document,
  onDocumentLoad,
  onPageChange,
  onZoomChange,
  // onTextSelect - will be used in Phase 3
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pageInput, setPageInput] = useState<string>('1');
  
  const { toast } = useToast();

  // Sync with document state from database
  useEffect(() => {
    if (document) {
      setCurrentPage(document.currentPage);
      setZoomLevel(document.zoomLevel);
      setPageInput(document.currentPage.toString());
    }
  }, [document]);

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
      <div className="h-full flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
        <div className="text-center">
          <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            No PDF Loaded
          </h3>
          <p className="text-slate-600 mb-6">
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
    <div className="h-full flex flex-col">
      {/* PDF Controls Header */}
      <div className="p-6 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 truncate">
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
            <span className="text-sm text-slate-600 min-w-[60px] text-center">
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
              <span className="text-sm text-slate-600">Page</span>
              <Input
                type="number"
                value={pageInput}
                onChange={(e) => handlePageInputChange(e.target.value)}
                className="w-16 h-8 text-center text-sm"
                min={1}
                max={numPages}
              />
              <span className="text-sm text-slate-600">of {numPages}</span>
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
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {Math.round((currentPage / numPages) * 100)}% Complete
            </Badge>
          )}
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-slate-100 p-6">
        <div className="flex justify-center">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-0">
              {loading && (
                <div className="flex items-center justify-center h-96">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-slate-600">Loading PDF...</span>
                </div>
              )}
              
              {error && (
                <div className="flex items-center justify-center h-96 text-red-600">
                  <p>{error}</p>
                </div>
              )}
              
              {document.filePath && (
                <Document
                  file={document.filePath}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="flex items-center justify-center h-96">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <span className="ml-2 text-slate-600">Loading PDF...</span>
                    </div>
                  }
                  error={
                    <div className="flex items-center justify-center h-96 text-red-600">
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer; 