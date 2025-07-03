export type ViewMode = 'library' | 'reader' | 'chat' | 'chat-interface' | 'knowledge' | 'preferences';

export interface DashboardStats {
  documentCount: number;
  questionCount: number;
  responseCount: number;
  knowledgeCount: number;
  noteCount: number;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}

export interface KnowledgeStat {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
} 