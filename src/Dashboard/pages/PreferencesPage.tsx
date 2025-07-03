import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Key, Palette, Eye, EyeOff } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { saveUserPreferences, getUserPreferences } from "@/lib/api";

interface PreferencesPageProps {
  onBack: () => void;
}

interface UserPreferences {
  openaiApiKey?: string;
  theme: 'light' | 'dark' | 'system';
}

const PreferencesPage: React.FC<PreferencesPageProps> = ({ onBack }) => {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setIsLoading(true);
        const preferences = await getUserPreferences();
        if (preferences.openaiApiKey) {
          setApiKey(preferences.openaiApiKey);
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
        // Don't show error toast for missing preferences - it's expected on first run
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const handleSavePreferences = async () => {
    try {
      setIsSaving(true);
      
      const preferences: UserPreferences = {
        openaiApiKey: apiKey.trim() || undefined,
        theme: theme as 'light' | 'dark' | 'system'
      };

      await saveUserPreferences(preferences);
      
      toast({
        title: "Preferences Saved",
        description: "Your preferences have been saved successfully.",
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as 'light' | 'dark' | 'system');
  };

  const isApiKeyValid = apiKey.trim().length > 0 && apiKey.startsWith('sk-');

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900 overflow-auto">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Preferences</h1>
            <p className="text-slate-500 dark:text-slate-400">Configure your GeniusReads settings</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* OpenAI API Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-blue-600" />
                <CardTitle>OpenAI API Configuration</CardTitle>
              </div>
              <CardDescription>
                Configure your OpenAI API key to enable AI-powered conversations. Your API key is stored locally and never shared.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">OpenAI API Key</Label>
                <div className="relative">
                  <Input
                    id="api-key"
                    type={showApiKey ? "text" : "password"}
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pr-10"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${isApiKeyValid ? 'bg-green-500' : 'bg-slate-300'}`} />
                  <span className={isApiKeyValid ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}>
                    {isApiKeyValid ? 'Valid API key format' : 'Enter your OpenAI API key'}
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-slate-600 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="font-medium mb-1">How to get your API key:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">platform.openai.com/api-keys</a></li>
                  <li>Sign in to your OpenAI account</li>
                  <li>Click "Create new secret key"</li>
                  <li>Copy and paste the key here</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Palette className="h-5 w-5 text-purple-600" />
                <CardTitle>Appearance</CardTitle>
              </div>
              <CardDescription>
                Customize the visual appearance of the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Choose your preferred color scheme. System will match your operating system settings.
                </p>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSavePreferences}
              disabled={isSaving || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesPage; 