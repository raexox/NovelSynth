import type { User } from '@supabase/supabase-js';
import type { 
  ProjectState, SceneMetadata, PlotThread, Note, MemoryUpdate 
} from '../types';

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
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  activeBibleCategory: 'characters' | 'locations' | 'factions' | 'powerSystems';
  activeBibleItemId: string | null;
  
  // Auth & Hierarchy States
  user: User | null;
  authLoading: boolean;
  booksList: any[];
  activeBookId: string | null;
  booksLoading: boolean;
  
  // AI States
  aiRunning: boolean;
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
  chatMessages: Array<{ role: 'user' | 'model'; content: string }>;
  selectedText: string;
  setSelectedText: (text: string) => void;
  sendChatMessage: (content: string) => Promise<void>;
  replaceSelectedText: (newText: string) => void;
  clearChat: () => void;

  // Auth & Book Actions
  signUp: (email: string, password: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  createBook: (name: string) => Promise<void>;
  loadBook: (bookId: string) => Promise<void>;
  closeBook: () => void;
  fetchBooksList: () => Promise<void>;

  // IDE Actions
  updateSceneContent: (id: string, content: string) => void;
  selectScene: (id: string) => void;
  addChapter: (title: string) => void;
  addScene: (chapterId: string, title: string) => void;
  deleteScene: (id: string) => void;
  deleteChapter: (id: string) => void;
  updateSceneMetadata: (id: string, metadata: Partial<SceneMetadata>) => void;
  setLeftTab: (tab: string) => void;
  setRightTab: (tab: string) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setBibleCategory: (cat: 'characters' | 'locations' | 'factions' | 'powerSystems') => void;
  setBibleItemId: (id: string | null) => void;
  updateBibleItem: (category: 'characters' | 'locations' | 'factions' | 'powerSystems', item: any) => void;
  addBibleItem: (category: 'characters' | 'locations' | 'factions' | 'powerSystems', item: any) => void;
  deleteBibleItem: (category: 'characters' | 'locations' | 'factions' | 'powerSystems', id: string) => void;
  addPlotThread: (thread: Partial<PlotThread>) => void;
  updatePlotThread: (thread: PlotThread) => void;
  addNote: (title: string, content: string) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  
  // AI Commands
  runAIRevision: (mode: 'light' | 'style' | 'line' | 'dev') => void;
  runAIContinuityCheck: () => void;
  runAIDialogueCheck: () => void;
  runPacingAnalysis: () => void;
  runResearch: (query: string) => void;
  approveMemory: () => void;
  rejectMemory: () => void;
  triggerMemoryGeneration: (sceneId: string) => void;
  clearAISuggestions: () => void;

  // Snapshots
  takeSnapshot: (description: string) => void;
  restoreSnapshot: (id: string) => void;
  
  // Export/Import
  exportProject: () => void;
  importProject: (data: string) => void;
  updateSettings: (settings: Partial<ProjectState['settings']>) => void;
}
