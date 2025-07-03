import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  MessageSquare, 
  Search, 
  Tag, 
  TrendingUp,
  ExternalLink
} from "lucide-react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useDebounce } from "@/hooks/use-debounce";
import { Concept } from "@/lib/types";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
  } from "@/components/ui/pagination"

interface KnowledgePageProps {
  concepts: Concept[];
  onConceptClick: (conceptId: string) => void;
  onViewSource: (conceptId: string) => void;
  searchConcepts: (query: string) => void;
  loadConcepts: () => void;
}

export const KnowledgePage = ({
  concepts,
  onConceptClick,
  onViewSource,
  searchConcepts,
  loadConcepts
}: KnowledgePageProps) => {
  const {
    conceptsLoading,
    conceptSearchQuery,
    setConceptSearchQuery
  } = useDashboardStore();

  const [currentPage, setCurrentPage] = useState(1);
  const conceptsPerPage = 9;

  const debouncedSearchQuery = useDebounce(conceptSearchQuery, 300);

  useEffect(() => {
    if (debouncedSearchQuery) {
      searchConcepts(debouncedSearchQuery);
    } else {
      loadConcepts();
    }
    setCurrentPage(1);
  }, [debouncedSearchQuery, searchConcepts, loadConcepts]);

  // Pagination logic
  const totalPages = Math.ceil(concepts.length / conceptsPerPage);
  const paginatedConcepts = concepts.slice(
    (currentPage - 1) * conceptsPerPage,
    currentPage * conceptsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
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
    <div className="flex-1 flex flex-col h-full">
      {/* Knowledge Toolbar */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Knowledge Base</h2>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search concepts..."
                value={conceptSearchQuery}
                onChange={(e) => setConceptSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Knowledge Grid */}
      <ScrollArea className="flex-1 p-6">
        <div className="flex flex-col h-full">
          <div className="flex-grow">
            {conceptsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
                      <div className="h-2 bg-slate-200 rounded w-full"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : concepts.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  {conceptSearchQuery ? "No Results Found" : "No Concepts Yet"}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                  {conceptSearchQuery
                    ? "Try a different search term."
                    : "Start conversations about your PDFs to build your knowledge base. Concepts will appear here after AI analysis."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedConcepts.map((concept) => (
                  <Card key={concept.id} className="hover:shadow-md transition-all duration-200 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2">
                            {concept.name}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-3">
                            {concept.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 mb-3">
                            <span className="flex items-center">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              {concept.sourceChatCount} chat{concept.sourceChatCount !== 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {Math.round(concept.confidenceScore * 100)}% confidence
                            </span>
                          </div>
                          {concept.tags && concept.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {concept.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  <Tag className="h-2 w-2 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                              {concept.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{concept.tags.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onConceptClick(concept.id)}
                          className="text-xs"
                        >
                          <Brain className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                        
                        {concept.sourceChatCount > 0 && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => onViewSource(concept.id)}
                            className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Source
                          </Button>
                        )}
                      </div>
                      
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                        Added {formatLastAccessed(concept.createdAt)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          {totalPages > 1 && (
            <div className="pt-6 mt-auto">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(i + 1);
                        }}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}; 