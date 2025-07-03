import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  MessageSquare, 
  Search, 
  Clock, 
  FileText,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Loader2
} from "lucide-react";
import type { ChatSession, HighlightedContext, Document } from "@/lib/types";
import { getChatSessions, getActiveChatSession, deleteChatSession } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ChatListProps {
  activeTextSelection?: HighlightedContext;
  currentDocument?: Document;
  onChatSelect: (chatId: string) => void;
  onStartNewChat?: () => void;
  onChatDelete?: (chatId: string) => void;
  refreshTrigger?: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const ChatList = ({ 
  activeTextSelection, 
  currentDocument: _, // Not used yet, will be used in future tasks
  onChatSelect,
  onStartNewChat,
  onChatDelete,
  refreshTrigger
}: ChatListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatSession, setActiveChatSession] = useState<any | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<ChatSession | null>(null);
  const { toast } = useToast();

  // Helper function to format time ago
  const formatTimeAgo = (date: Date): string => {
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

  // Get status badge variant and text
  const getStatusInfo = (status: ChatSession['analysisStatus']) => {
    switch (status) {
      case 'complete':
        return { 
          variant: 'default' as const, 
          text: 'Analyzed', 
          color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
          showLoader: false
        };
      case 'processing':
        return { 
          variant: 'secondary' as const, 
          text: 'Processing', 
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
          showLoader: true
        };
      case 'pending':
        return { 
          variant: 'outline' as const, 
          text: 'Saved', 
          color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400',
          showLoader: false
        };
      case 'failed':
        return { 
          variant: 'destructive' as const, 
          text: 'Failed', 
          color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
          showLoader: false
        };
      case 'none':
        return {
          variant: 'outline' as const,
          text: 'Unanalyzed',
          color: 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400',
          showLoader: false
        };
      default:
        return { 
          variant: 'secondary' as const, 
          text: 'Unknown', 
          color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400',
          showLoader: false
        };
    }
  };

  // Filter chats based on search query
  const filteredChats = chatSessions.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.previewText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Paginate filtered results
  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const endIndex = startIndex + pagination.itemsPerPage;
  const paginatedChats = filteredChats.slice(startIndex, endIndex);

  // Update pagination info when search changes
  useEffect(() => {
    const totalItems = filteredChats.length;
    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
    
    setPagination(prev => ({
      ...prev,
      totalItems,
      totalPages,
      currentPage: totalPages > 0 ? Math.min(prev.currentPage, totalPages) : 1
    }));
  }, [filteredChats.length, pagination.itemsPerPage]);

  // Load chats on component mount and when refresh is triggered
  useEffect(() => {
    loadChats();
  }, [refreshTrigger]);

  const loadChats = async () => {
    setLoading(true);
    try {
      const [sessions, activeSession] = await Promise.all([
        getChatSessions(),
        getActiveChatSession()
      ]);
      setChatSessions(sessions);
      setActiveChatSession(activeSession);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      setChatSessions([]);
      setActiveChatSession(null);
    } finally {
      setLoading(false);
    }
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    setPagination(prev => ({
      ...prev,
      currentPage: Math.max(1, prev.currentPage - 1)
    }));
  };

  const handleNextPage = () => {
    setPagination(prev => ({
      ...prev,
      currentPage: Math.min(prev.totalPages, prev.currentPage + 1)
    }));
  };

  // Handle showing delete confirmation
  const handleDeleteClick = (chat: ChatSession) => {
    setChatToDelete(chat);
    setDeleteDialogOpen(true);
  };

  // Handle confirmed chat deletion
  const handleConfirmDelete = async () => {
    if (!chatToDelete) return;
    
    try {
      await deleteChatSession(chatToDelete.id);
      
      // Remove the deleted chat from local state
      setChatSessions(prev => prev.filter(chat => chat.id !== chatToDelete.id));
      
      // Call parent callback if provided
      onChatDelete?.(chatToDelete.id);
      
      toast({
        title: "Chat Deleted",
        description: "The conversation has been permanently deleted.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast({
        title: "Error",
        description: "Failed to delete the conversation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Search Bar */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Chat History</h2>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chat List Content */}
      <ScrollArea className="flex-1 p-6">
        {/* Active Chat Section */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wide">
            Active Chat
          </h3>
{activeChatSession ? (
            <Card 
              className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800 cursor-pointer hover:shadow-md transition-all duration-200"
              onClick={() => onStartNewChat?.()}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Active Conversation</span>
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      {activeChatSession.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {activeChatSession.messages?.length || 0} message{(activeChatSession.messages?.length || 0) !== 1 ? 's' : ''} • 
                      {activeChatSession.highlightedContexts?.length || 0} context{(activeChatSession.highlightedContexts?.length || 0) !== 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Continue conversation
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTimeAgo(new Date(activeChatSession.updatedAt))}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>
          ) : activeTextSelection ? (
            <Card 
              className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800 cursor-pointer hover:shadow-md transition-all duration-200"
              onClick={() => onStartNewChat?.()}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">Ready to Start</span>
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Discussion about: "{activeTextSelection.selectedText.substring(0, 60)}..."
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      From: {activeTextSelection.documentTitle} • Page {activeTextSelection.pageNumber}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Click to start conversation
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Just now
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-green-500 dark:text-green-400" />
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                  <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                    "{activeTextSelection.selectedText}"
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 border-slate-300 dark:border-slate-600">
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-8 w-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No active chat. Highlight text in a PDF and press CMD+K to start.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Previous Conversations Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Previous Conversations
            </h3>
            {pagination.totalItems > 0 && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Showing {startIndex + 1}-{Math.min(endIndex, pagination.totalItems)} of {pagination.totalItems}
              </div>
            )}
          </div>
          
          {loading ? (
            /* Loading State */
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : paginatedChats.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                {searchQuery ? 'No Matching Conversations' : 'No Conversations Yet'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                {searchQuery 
                  ? `No conversations found matching "${searchQuery}". Try a different search term.`
                  : 'Start your first conversation by highlighting text in a PDF and pressing CMD+K.'
                }
              </p>
              {!searchQuery && (
                <Button onClick={onStartNewChat} variant="outline">
                  Start Reading
                </Button>
              )}
            </div>
          ) : (
            /* Chat Cards */
            <div className="space-y-4">
              {paginatedChats.map((chat) => {
                const statusInfo = getStatusInfo(chat.analysisStatus);
                return (
                  <Card 
                    key={chat.id} 
                    className="group hover:shadow-md transition-all duration-200 cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    onClick={() => onChatSelect(chat.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                              {chat.title}
                            </h4>
                            <Badge 
                              variant={statusInfo.variant}
                              className={`text-xs ${statusInfo.color} flex items-center space-x-1`}
                            >
                              {statusInfo.showLoader && (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              )}
                              <span>{statusInfo.text}</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                            {chat.previewText}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center">
                              <FileText className="h-3 w-3 mr-1" />
                              {chat.sourceDocumentCount} {chat.sourceDocumentCount === 1 ? 'source' : 'sources'}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTimeAgo(chat.createdAt)}
                            </span>
                            {chat.completedAt && (
                              <span className="flex items-center">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Completed {formatTimeAgo(chat.completedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                                                  <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(chat);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                          </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={pagination.currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{chatToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatList; 