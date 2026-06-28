import type { User } from '@supabase/supabase-js';
import type { 
  ProjectState, SceneMetadata, PlotThread, Note, MemoryUpdate, Chapter, Scene,
  ContinuityFact, BibleItemVersion, ProposedContinuityFact, BibleCategory
} from '../types';
import type { ChatConversation } from '../types/chatTypes';

/**
 * Global state store context representing the entire state and actions of NovelSynth.
 * Consumed by components using the `useStore` hook. Modularity is implemented using custom hooks
 * under `src/store/hooks/` which are composed in the main `StoreProvider` in `src/store/index.tsx`.
 */
export interface StoreContextType {
  /** Holds the unified client-side project state tree (chapters, scenes, bible, plot threads, notes, memories) */
  project: ProjectState;
  activeSceneId: string | null;
  activeLeftTab: string;
  activeRightTab: string;
  viewMode: 'editor' | 'outline';
  setViewMode: (mode: 'editor' | 'outline') => void;
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  activeBibleCategory: 'characters' | 'locations' | 'factions' | 'lore' | 'powerSystems';
  activeBibleItemId: string | null;
  isReferenceModalOpen: boolean;
  openReferenceModal: (tab?: string) => void;
  closeReferenceModal: () => void;
  
  // Auth & Hierarchy States
  user: User | null;
  authLoading: boolean;
  booksList: any[];
  activeBookId: string | null;
  booksLoading: boolean;
  
  // AI States
  aiRunning: boolean;
  continuityRunning: boolean;
  dialogueRunning: boolean;
  pacingRunning: boolean;
  revisionSuggestions: { original: string; revised: string; explanation: string; diffHtml: string } | null;
  continuityWarnings: Array<{ title: string; content: string; severity: 'low' | 'medium' | 'high' }> | null;
  dialogueWarnings: Array<{ title: string; content: string; quote: string }> | null;
  activeContexts: string[];
  pacingSuggestions: string[] | null;
  researchResults: string | null;
  pendingMemoryUpdate: MemoryUpdate | null;
  aiError: string | null;
  clearAIError: () => void;

  // Chat States & Actions
  conversations: ChatConversation[];
  activeConversationId: string | null;
  chatMessages: Array<{ role: 'user' | 'model'; content: string }>;
  selectedText: string;
  setSelectedText: (text: string) => void;
  sendChatMessage: (content: string) => Promise<void>;
  replaceSelectedText: (newText: string) => void;
  clearChat: () => void;
  createNewConversation: () => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;

  // Auth & Book Actions
  signUp: (email: string, password: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  createBook: (name: string) => Promise<void>;
  loadBook: (bookId: string) => Promise<void>;
  closeBook: () => void;
  deleteBook: () => Promise<boolean>;
  fetchBooksList: () => Promise<void>;

  // IDE Actions
  updateSceneContent: (id: string, content: string) => void;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  selectScene: (id: string) => void;
  addChapter: (title: string) => void;
  updateChapter: (id: string, updates: Partial<Chapter>) => void;
  addScene: (chapterId: string, title: string) => void;
  deleteScene: (id: string) => void;
  deleteChapter: (id: string) => void;
  updateSceneMetadata: (id: string, metadata: Partial<SceneMetadata>) => void;
  updateSceneOutline: (id: string, outlineUpdates: Partial<import('../types').SceneOutline>) => void;
  addPlotBeat: (sceneId: string, beatText: string) => void;
  togglePlotBeat: (sceneId: string, beatId: string) => void;
  deletePlotBeat: (sceneId: string, beatId: string) => void;
  expandSceneBeatsWithAI: (sceneId: string) => Promise<void>;
  applyAiChatAction: (action: any) => Promise<boolean>;
  setLeftTab: (tab: string) => void;
  setRightTab: (tab: string) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setBibleCategory: (cat: BibleCategory) => void;
  setBibleItemId: (id: string | null) => void;
  updateBibleItem: (category: BibleCategory, item: any) => void;
  addBibleItem: (category: BibleCategory, item: any) => void;
  deleteBibleItem: (category: BibleCategory, id: string) => void;
  addContinuityFact: (fact: Omit<ContinuityFact, 'id' | 'createdAt'>) => Promise<ContinuityFact | null>;
  updateContinuityFact: (id: string, updates: Partial<ContinuityFact>) => Promise<void>;
  deleteContinuityFact: (id: string) => Promise<void>;
  createBibleItemVersion: (version: Omit<BibleItemVersion, 'id' | 'createdAt'>) => Promise<BibleItemVersion | null>;
  loadBibleItemVersions: (itemId: string) => BibleItemVersion[];
  addPlotThread: (thread: Partial<PlotThread>) => void;
  updatePlotThread: (thread: PlotThread) => void;
  addNote: (title: string, content: string) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  
  // AI Commands
  runAIRevision: (mode: 'light' | 'style' | 'line' | 'dev') => Promise<void>;
  runAIContinuityCheck: () => Promise<void>;
  runAIDialogueCheck: () => Promise<void>;
  runPacingAnalysis: () => Promise<void>;
  runAllDiagnostics: () => Promise<void>;
  runResearch: (query: string) => Promise<void>;
  approveMemory: (selectedFacts?: ProposedContinuityFact[]) => Promise<void>;
  rejectMemory: () => void;
  triggerMemoryGeneration: (sceneId: string) => void;
  updateMemoryUpdate: (sceneId: string, updates: Partial<MemoryUpdate>) => void;
  updateChapterMemory: (chapterId: string, summary: string) => void;
  clearAISuggestions: () => void;

  // Snapshots
  takeSnapshot: (description: string) => void;
  restoreSnapshot: (id: string) => void;
  
  // Export/Import
  exportProject: () => void;
  importProject: (data: string) => void;
  updateSettings: (settings: Partial<ProjectState['settings']>) => void;
  updateBookDetails: (name: string, settings: Partial<ProjectState['settings']>) => void;
  updateUserSettings: (settings: any) => Promise<void>;
}
