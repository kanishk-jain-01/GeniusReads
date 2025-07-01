
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Brain, 
  MessageSquare, 
  Search, 
  Clock, 
  FileText,
  Star,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { getRecentDocuments, getDashboardStats } from "@/lib/api";
import type { Document } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    documentCount: 0,
    questionCount: 0,
    responseCount: 0,
    knowledgeCount: 0,
    noteCount: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
          title: "Failed to Load Dashboard",
          description: "Could not load recent documents and statistics.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  const recentQuestions = [
    {
      id: 1,
      question: "What is the difference between supervised and unsupervised learning?",
      document: "Introduction to Machine Learning",
      timestamp: "2 hours ago",
      concepts: 3
    },
    {
      id: 2,
      question: "How does quantum entanglement work?",
      document: "Quantum Physics Fundamentals",
      timestamp: "1 day ago",
      concepts: 2
    },
    {
      id: 3,
      question: "What is the fundamental theorem of calculus?",
      document: "Advanced Calculus",
      timestamp: "2 days ago",
      concepts: 4
    }
  ];

  const knowledgeStats = [
    { label: "Total Concepts", value: dashboardStats.knowledgeCount, icon: Brain, color: "text-purple-600" },
    { label: "Questions Asked", value: dashboardStats.questionCount, icon: MessageSquare, color: "text-blue-600" },
    { label: "Documents Read", value: dashboardStats.documentCount, icon: BookOpen, color: "text-green-600" },
    { label: "AI Responses", value: dashboardStats.responseCount, icon: Clock, color: "text-orange-600" }
  ];

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
                  <p className="text-xs text-slate-600">Dashboard</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search knowledge..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <Link to="/reader">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Start Reading
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back!</h2>
          <p className="text-lg text-slate-600">Here's what you've been learning lately.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {knowledgeStats.map((stat, index) => (
            <Card key={index} className="bg-white/60 backdrop-blur-sm border-slate-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                {loading ? (
                  <div className="flex items-center justify-between animate-pulse">
                    <div>
                      <div className="h-4 bg-slate-200 rounded w-20 mb-2"></div>
                      <div className="h-8 bg-slate-200 rounded w-12"></div>
                    </div>
                    <div className="p-3 rounded-full bg-slate-200 w-12 h-12"></div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full bg-slate-100 ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Documents */}
          <div className="lg:col-span-2">
            <Card className="bg-white/60 backdrop-blur-sm border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-slate-900">Recent Documents</CardTitle>
                  <CardDescription>Continue where you left off</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  // Loading state
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 bg-white rounded-lg border border-slate-100 animate-pulse">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
                            <div className="flex space-x-4">
                              <div className="h-3 bg-slate-200 rounded w-16"></div>
                              <div className="h-3 bg-slate-200 rounded w-20"></div>
                              <div className="h-3 bg-slate-200 rounded w-18"></div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="h-6 bg-slate-200 rounded w-12"></div>
                            <div className="h-8 bg-slate-200 rounded w-8"></div>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2"></div>
                      </div>
                    ))}
                  </div>
                ) : recentDocuments.length === 0 ? (
                  // Empty state
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No documents yet</h3>
                    <p className="text-slate-600 mb-4">Start your learning journey by uploading your first PDF.</p>
                    <Link to="/reader">
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Upload PDF
                      </Button>
                    </Link>
                  </div>
                ) : (
                  // Real documents
                  recentDocuments.map((doc) => {
                    const progress = calculateProgress(doc.currentPage, doc.totalPages);
                    return (
                      <div key={doc.id} className="p-4 bg-white rounded-lg border border-slate-100 hover:shadow-md transition-all duration-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 mb-1">{doc.title}</h3>
                            <p className="text-sm text-slate-600 mb-2">
                              {doc.author || 'Unknown Author'} • {doc.totalPages} pages
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-slate-500">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatLastAccessed(doc.lastAccessed)}
                              </span>
                              <span className="flex items-center">
                                <FileText className="h-3 w-3 mr-1" />
                                Page {doc.currentPage} of {doc.totalPages}
                              </span>
                              <span className="flex items-center">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                0 questions
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">{progress}%</Badge>
                            <Link to="/reader" state={{ documentId: doc.id }}>
                              <Button size="sm" variant="ghost">
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Questions */}
          <div>
            <Card className="bg-white/60 backdrop-blur-sm border-slate-200 mb-6">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Recent Questions</CardTitle>
                <CardDescription>Your latest learning moments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentQuestions.map((question) => (
                  <div key={question.id} className="p-3 bg-white rounded-lg border border-slate-100">
                    <p className="text-sm text-slate-900 font-medium mb-2 line-clamp-2">
                      {question.question}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center">
                        <FileText className="h-3 w-3 mr-1" />
                        {question.document}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {question.timestamp}
                      </span>
                    </div>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {question.concepts} concepts learned
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white">
              <CardContent className="p-6">
                <Star className="h-8 w-8 mb-4 text-yellow-300" />
                <h3 className="text-lg font-semibold mb-2">Keep Learning!</h3>
                <p className="text-sm text-blue-100 mb-4">
                  Upload a new document or continue reading to expand your knowledge.
                </p>
                <Link to="/reader">
                  <Button className="bg-white text-blue-600 hover:bg-blue-50 w-full">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Continue Reading
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
