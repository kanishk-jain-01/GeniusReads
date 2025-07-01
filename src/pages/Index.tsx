import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, BookOpen, Lightbulb, Zap, Search, MessageSquare, TestTube2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { greet, getAppInfo, getSystemInfo, testTauriCommunication } from "@/lib/api";

const Index = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [isTestingTauri, setIsTestingTauri] = useState(false);
  const [greetResult, setGreetResult] = useState<string>("");

  const handleTestTauri = async () => {
    setIsTestingTauri(true);
    try {
      const results = await testTauriCommunication();
      setTestResults(results);
    } catch (error) {
      setTestResults({
        success: false,
        results: {},
        errors: [`Test failed: ${error}`]
      });
    } finally {
      setIsTestingTauri(false);
    }
  };

  const handleGreet = async () => {
    try {
      const result = await greet("GeniusReads User");
      setGreetResult(result);
    } catch (error) {
      setGreetResult(`Error: ${error}`);
    }
  };

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
                <p className="text-xs text-slate-600">AI-Powered PDF Learning</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="outline">Dashboard</Button>
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
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <div className="mb-8">
            <Badge variant="secondary" className="mb-4 bg-blue-100 text-blue-700">
              Foundation Phase - Task 1.8 Testing
            </Badge>
            <h2 className="text-5xl font-bold text-slate-900 mb-6">
              Transform Your Technical Reading
            </h2>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
              Break through comprehension barriers with AI-powered explanations. 
              Highlight confusing text, ask questions, and build a persistent knowledge base.
            </p>
          </div>

          {/* Tauri Communication Test Section */}
          <div className="mb-12">
            <Card className="max-w-2xl mx-auto bg-white/60 backdrop-blur-sm border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-center space-x-2">
                  <TestTube2 className="h-5 w-5 text-purple-600" />
                  <span>Tauri-React Communication Test</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col space-y-3">
                  <Button 
                    onClick={handleGreet}
                    variant="outline"
                    className="w-full"
                  >
                    Test Simple Greeting
                  </Button>
                  
                  <Button 
                    onClick={handleTestTauri}
                    disabled={isTestingTauri}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {isTestingTauri ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing Communication...
                      </>
                    ) : (
                      <>
                        <TestTube2 className="mr-2 h-4 w-4" />
                        Run Full Communication Test
                      </>
                    )}
                  </Button>
                </div>

                {greetResult && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">{greetResult}</p>
                  </div>
                )}

                {testResults && (
                  <div className="text-left space-y-3">
                    <div className="flex items-center space-x-2">
                      {testResults.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={`font-medium ${testResults.success ? 'text-green-700' : 'text-red-700'}`}>
                        {testResults.success ? 'All Tests Passed!' : 'Some Tests Failed'}
                      </span>
                    </div>

                    {testResults.results && Object.keys(testResults.results).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-slate-700">Results:</h4>
                        {Object.entries(testResults.results).map(([key, value]) => (
                          <div key={key} className="p-2 bg-green-50 border border-green-200 rounded text-xs">
                            <strong>{key}:</strong> {JSON.stringify(value, null, 2)}
                          </div>
                        ))}
                      </div>
                    )}

                    {testResults.errors && testResults.errors.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-red-700">Errors:</h4>
                        {testResults.errors.map((error: string, index: number) => (
                          <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            {error}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center space-x-4">
            <Link to="/reader">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <BookOpen className="mr-2 h-5 w-5" />
                Try the Reader
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline">
                <Brain className="mr-2 h-5 w-5" />
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-white/40 backdrop-blur-sm">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center text-slate-900 mb-12">
            How GeniusReads Works
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/60 backdrop-blur-sm border-slate-200 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl text-slate-900">Load & Read</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Open any PDF document and read naturally. Our viewer provides smooth navigation and zoom controls.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-sm border-slate-200 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl text-slate-900">Highlight & Ask</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Highlight confusing passages and ask questions. Get instant AI explanations in simple terms.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-sm border-slate-200 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Lightbulb className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl text-slate-900">Learn & Remember</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Build a searchable knowledge base of concepts, definitions, and insights for future reference.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-16 px-6">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl font-bold text-slate-900 mb-8">
            Built with Modern Technology
          </h3>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Badge variant="outline" className="px-4 py-2 text-sm">Tauri + Rust</Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm">React + TypeScript</Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm">TailwindCSS</Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm">OpenAI GPT-4</Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm">PostgreSQL</Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm">PDF.js</Badge>
          </div>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Native macOS performance with web technology flexibility. 
            Local-first architecture ensures your data stays private and accessible offline.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Index;
