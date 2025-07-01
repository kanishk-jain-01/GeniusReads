
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Upload, 
  Brain, 
  MessageSquare, 
  Search,
  BookOpen,
  Lightbulb,
  Save,
  Send,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

const Reader = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(245);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedText, setSelectedText] = useState("");
  const [question, setQuestion] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleAskQuestion = () => {
    if (!question.trim()) return;
    
    setIsAiThinking(true);
    // Simulate AI processing
    setTimeout(() => {
      setIsAiThinking(false);
      setQuestion("");
      setSelectedText("");
    }, 3000);
  };

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
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Upload className="mr-2 h-4 w-4" />
                Upload PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* PDF Viewer */}
          <div className="flex-1 bg-white/60 backdrop-blur-sm border-r border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-900">Introduction to Machine Learning</h2>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-slate-600 min-w-[60px] text-center">
                    {zoomLevel}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
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
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-slate-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  75% Complete
                </Badge>
              </div>
            </div>

            {/* PDF Content Placeholder */}
            <div className="p-6 flex-1">
              <Card className="h-full bg-white border-slate-200 shadow-sm">
                <CardContent className="p-8 h-full flex flex-col justify-center">
                  <div className="text-center mb-8">
                    <BookOpen className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold text-slate-900 mb-2">
                      Chapter 3: Supervised Learning
                    </h3>
                    <p className="text-slate-600 mb-6">
                      This chapter introduces the fundamental concepts of supervised learning, 
                      including classification and regression techniques.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-lg mb-6">
                    <p className="text-slate-700 leading-relaxed">
                      <span 
                        className="bg-yellow-200 px-1 rounded cursor-pointer hover:bg-yellow-300 transition-colors"
                        onClick={() => setSelectedText("Supervised learning is a machine learning paradigm where algorithms learn from labeled training data to make predictions on new, unseen data.")}
                      >
                        Supervised learning is a machine learning paradigm where algorithms learn from labeled training data to make predictions on new, unseen data.
                      </span>
                      {" "}The key characteristic of supervised learning is that the training dataset contains both input features and their corresponding target outputs, allowing the algorithm to learn the mapping between inputs and outputs.
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-slate-500 mb-2">
                      💡 Try highlighting text above to ask questions!
                    </p>
                    <p className="text-xs text-slate-400">
                      Click on the highlighted text to see AI explanations in action
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

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
        <div className="w-80 bg-white/80 backdrop-blur-sm border-l border-slate-200 flex flex-col">
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
