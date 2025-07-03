import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Clock, 
  FileText,
  ArrowRight,
  Upload
} from "lucide-react";
import type { Document } from "@/lib/types";
import { useDashboardStore } from "@/stores/dashboardStore";

interface LibraryPageProps {
  recentDocuments: Document[];
  loading: boolean;
  onUploadPDF: () => void;
  onDocumentSelect: (document: Document) => void;
}

export const LibraryPage = ({
  recentDocuments,
  loading,
  onUploadPDF,
  onDocumentSelect
}: LibraryPageProps) => {
  const { searchQuery, setSearchQuery, isUploadingPDF } = useDashboardStore();

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

  return (
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
              onClick={onUploadPDF}
              disabled={isUploadingPDF}
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
                <Card 
                  key={doc.id} 
                  className="hover:shadow-md transition-all duration-200 cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" 
                  onClick={() => onDocumentSelect(doc)}
                >
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
  );
}; 