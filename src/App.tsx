import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import Dashboard from "./Dashboard";
import { getUserPreferences } from "./lib/api";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        await getUserPreferences();
      } catch (error) {
        console.error("Failed to fetch user preferences on startup:", error);
      }
    };
    fetchPreferences();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="genius-reads-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Dashboard />
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
};

export default App;
