import { create } from 'zustand';
import type { ViewMode } from '@/Dashboard/types';
import type { Document, TextSelection, Concept, ConceptDetail } from '@/lib/types';

interface DashboardState {
  searchQuery: string;
  currentDocument?: Document;
  viewMode: ViewMode;
  isUploadingPDF: boolean;
  currentTextSelection?: TextSelection;
  clearSelectionTrigger: number;
  viewingChatId?: string;
  chatListRefreshTrigger: number;
  concepts: Concept[];
  conceptsLoading: boolean;
  conceptSearchQuery: string;
  currentConceptDetail?: ConceptDetail;
  
  setSearchQuery: (query: string) => void;
  setCurrentDocument: (doc?: Document) => void;
  setViewMode: (mode: ViewMode) => void;
  setIsUploadingPDF: (uploading: boolean) => void;
  setCurrentTextSelection: (selection?: TextSelection) => void;
  setClearSelectionTrigger: () => void;
  setViewingChatId: (id?: string) => void;
  setChatListRefreshTrigger: () => void;
  setConcepts: (concepts: Concept[]) => void;
  setConceptsLoading: (loading: boolean) => void;
  setConceptSearchQuery: (query: string) => void;
  setCurrentConceptDetail: (concept?: ConceptDetail) => void;
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  searchQuery: '',
  currentDocument: undefined,
  viewMode: 'library',
  isUploadingPDF: false,
  currentTextSelection: undefined,
  clearSelectionTrigger: 0,
  viewingChatId: undefined,
  chatListRefreshTrigger: 0,
  concepts: [],
  conceptsLoading: false,
  conceptSearchQuery: '',
  currentConceptDetail: undefined,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setCurrentDocument: (doc) => set({ currentDocument: doc }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setIsUploadingPDF: (uploading) => set({ isUploadingPDF: uploading }),
  setCurrentTextSelection: (selection) => set({ currentTextSelection: selection }),
  setClearSelectionTrigger: () => set((state) => ({ clearSelectionTrigger: state.clearSelectionTrigger + 1 })),
  setViewingChatId: (id) => set({ viewingChatId: id }),
  setChatListRefreshTrigger: () => set((state) => ({ chatListRefreshTrigger: state.chatListRefreshTrigger + 1 })),
  setConcepts: (concepts) => set({ concepts: concepts }),
  setConceptsLoading: (loading) => set({ conceptsLoading: loading }),
  setConceptSearchQuery: (query) => set({ conceptSearchQuery: query }),
  setCurrentConceptDetail: (concept) => set({ currentConceptDetail: concept }),
})); 