import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Brain, 
  MessageSquare, 
  Search, 
  Clock, 
  Plus,
  Library,
  Settings
} from "lucide-react";
import type { ViewMode, DashboardStats, SidebarItem, KnowledgeStat } from "../types";

interface SidebarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  dashboardStats: DashboardStats;
  isUploadingPDF: boolean;
  onUploadPDF: () => void;
}

export const Sidebar = ({ 
  viewMode, 
  setViewMode, 
  dashboardStats, 
  isUploadingPDF, 
  onUploadPDF 
}: SidebarProps) => {
  const sidebarItems: SidebarItem[] = [
    { id: 'library', label: 'Library', icon: Library, active: viewMode === 'library' },
    { id: 'chat', label: 'Chat', icon: MessageSquare, active: viewMode === 'chat' },
    { id: 'knowledge', label: 'Knowledge', icon: Brain, active: viewMode === 'knowledge' },
  ];

  const knowledgeStats: KnowledgeStat[] = [
    { label: "Documents", value: dashboardStats.documentCount, icon: BookOpen, color: "text-blue-600" },
    { label: "Concepts", value: dashboardStats.knowledgeCount, icon: Brain, color: "text-purple-600" },
    { label: "Questions", value: dashboardStats.questionCount, icon: MessageSquare, color: "text-green-600" },
  ];

  return (
    <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
      {/* App Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">GeniusReads</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">AI-Powered Reading</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 gap-3">
          {knowledgeStats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-sm text-slate-600 dark:text-slate-300">{stat.label}</span>
              </div>
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setViewMode(item.id as ViewMode)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                item.active 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Button */}
      <div className="p-4">
        <Button 
          onClick={onUploadPDF}
          disabled={isUploadingPDF}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isUploadingPDF ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add PDF
            </>
          )}
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex-1 p-4">
        <div className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Quick Actions</div>
        <div className="space-y-1">
          <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
            <Search className="h-4 w-4" />
            <span>Search Knowledge</span>
          </button>
          <button 
            onClick={() => setViewMode('preferences')}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Settings className="h-4 w-4" />
            <span>Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
}; 