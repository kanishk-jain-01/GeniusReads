
// Import useState removed as it's not used in this component
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Brain, MessageSquare, Search, Upload, Users, Zap, Star } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {

  const features = [
    {
      icon: BookOpen,
      title: "PDF Reader",
      description: "Advanced PDF viewing with highlighting and navigation",
      color: "bg-blue-500"
    },
    {
      icon: Brain,
      title: "AI Explanations",
      description: "Get instant explanations for complex concepts",
      color: "bg-purple-500"
    },
    {
      icon: MessageSquare,
      title: "Smart Q&A",
      description: "Ask questions and get contextual answers",
      color: "bg-green-500"
    },
    {
      icon: Search,
      title: "Knowledge Search",
      description: "Search through your accumulated learning",
      color: "bg-orange-500"
    }
  ];

  const stats = [
    { label: "Documents Processed", value: "10K+", icon: BookOpen },
    { label: "Questions Answered", value: "50K+", icon: MessageSquare },
    { label: "Concepts Learned", value: "25K+", icon: Brain },
    { label: "Active Learners", value: "2K+", icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  GeniusReads
                </h1>
                <p className="text-xs text-slate-600">AI-Powered Learning Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="outline" className="hidden sm:flex">
                  Dashboard
                </Button>
              </Link>
              <Link to="/reader">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Start Reading
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200">
            <Zap className="h-3 w-3 mr-1" />
            AI-Powered Learning
          </Badge>
          <h2 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
            Transform How You
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}Learn{" "}
            </span>
            from Documents
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Upload PDFs, highlight confusing text, and get instant AI explanations. 
            Build your personal knowledge base with every question you ask.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/reader">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg"
              >
                <Upload className="mr-2 h-5 w-5" />
                Try GeniusReads Free
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center bg-white/60 backdrop-blur-sm border-slate-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full">
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 bg-white/60 backdrop-blur-sm border-slate-200 hover:border-slate-300">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className={`${feature.color} p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl text-slate-900">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600 text-center">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 border border-slate-200">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-slate-900 mb-4">How GeniusReads Works</h3>
            <p className="text-lg text-slate-600">Three simple steps to accelerate your learning</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h4 className="text-xl font-semibold text-slate-900 mb-3">Upload & Read</h4>
              <p className="text-slate-600">Upload your PDF and start reading. Use our advanced viewer with zoom and navigation controls.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h4 className="text-xl font-semibold text-slate-900 mb-3">Highlight & Ask</h4>
              <p className="text-slate-600">Highlight confusing text and ask questions. Our AI provides instant, contextual explanations.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-pink-600 to-orange-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h4 className="text-xl font-semibold text-slate-900 mb-3">Learn & Retain</h4>
              <p className="text-slate-600">Build your knowledge base automatically. Search and review concepts whenever you need them.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white">
            <CardContent className="p-12">
              <Star className="h-12 w-12 mx-auto mb-6 text-yellow-300" />
              <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Learning?</h3>
              <p className="text-xl mb-8 text-blue-100">
                Join thousands of learners who are already using GeniusReads to accelerate their understanding.
              </p>
              <Link to="/reader">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold">
                  Start Your Journey Today
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
