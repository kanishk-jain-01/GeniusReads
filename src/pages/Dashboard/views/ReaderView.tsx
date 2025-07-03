import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import PDFViewer from "@/components/PDFViewer";
import type { Document, TextSelection } from "@/lib/types";

interface ReaderViewProps {
  currentDocument?: Document;
  clearSelectionTrigger: number;
  onBackToLibrary: () => void;
  onDocumentLoad: (document: Document) => void;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onTextSelect: (selection: TextSelection) => void;
}

export const ReaderView = ({
  currentDocument,
  clearSelectionTrigger,
  onBackToLibrary,
  onDocumentLoad,
  onPageChange,
  onZoomChange,
  onTextSelect
}: ReaderViewProps) => {
  if (!currentDocument) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No Document Selected</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">Choose a document from your library to start reading.</p>
          <Button onClick={onBackToLibrary} variant="outline">
            Go to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Reader Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToLibrary}
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
          onDocumentLoad={onDocumentLoad}
          onPageChange={onPageChange}
          onZoomChange={onZoomChange}
          onTextSelect={onTextSelect}
          clearSelectionTrigger={clearSelectionTrigger}
        />
      </div>
    </div>
  );
}; 