import React, { createContext, useContext, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { ProjectState, MemoryUpdate } from '../types';
import type { StoreContextType } from './storeTypes';

/**
 * Main State Entrypoint for NovelSynth.
 * Coordinates React state slices and delegates actual business logic actions
 * to separate hook files inside `src/store/hooks/`.
 */
// Modular Hooks
import { useAuth } from './hooks/useAuth';
import { useBooks } from './hooks/useBooks';
import { useManuscript } from './hooks/useManuscript';
import { useStoryBible } from './hooks/useStoryBible';
import { usePlotAndNotes } from './hooks/usePlotAndNotes';
import { useSnapshots } from './hooks/useSnapshots';
import { useImportExport } from './hooks/useImportExport';
import { useAI } from './hooks/useAI';

const EMPTY_PROJECT_STATE: ProjectState = {
  projectName: '',
  chapters: [],
  scenes: [],
  storyBible: {
    characters: [],
    locations: [],
    factions: [],
    powerSystems: []
  },
  plotThreads: [],
  snapshots: [],
  notes: [],
  memoryUpdates: [],
  settings: {
    apiKey: '',
    model: 'gemini-1.5-flash',
    provider: 'gemini',
    aiTemperature: 0.7,
    typewriterMode: false,
    focusMode: false,
    splitView: false
  }
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [project, setProject] = useState<ProjectState>(EMPTY_PROJECT_STATE);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [activeLeftTab, setActiveLeftTab] = useState<string>('novel');
  const [activeRightTab, setActiveRightTab] = useState<string>('revision');
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [activeBibleCategory, setActiveBibleCategory] = useState<'characters' | 'locations' | 'factions' | 'powerSystems'>('characters');
  const [activeBibleItemId, setBibleItemId] = useState<string | null>(null);

  // Auth & Book Hierarchy States
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [booksList, setBooksList] = useState<any[]>([]);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [booksLoading, setBooksLoading] = useState(false);

  // AI & Analysis States
  const [aiRunning, setAiRunning] = useState(false);
  const [revisionSuggestions, setRevisionSuggestions] = useState<StoreContextType['revisionSuggestions']>(null);
  const [continuityWarnings, setContinuityWarnings] = useState<StoreContextType['continuityWarnings']>(null);
  const [dialogueWarnings, setDialogueWarnings] = useState<StoreContextType['dialogueWarnings']>(null);
  const [pacingSuggestions, setPacingSuggestions] = useState<string[] | null>(null);
  const [researchResults, setResearchResults] = useState<string | null>(null);
  const [activeContexts, setActiveContexts] = useState<string[]>([]);
  const [pendingMemoryUpdate, setPendingMemoryUpdate] = useState<MemoryUpdate | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const clearAIError = () => setAiError(null);

  // Chat States
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'model'; content: string }>>([]);
  const [selectedText, setSelectedText] = useState<string>('');

  // 1. Auth Hook
  const { signUp, signIn, signOut } = useAuth(
    setUser,
    setAuthLoading,
    setActiveBookId,
    setProject,
    setBooksList
  );

  // 2. Books Hook
  const { fetchBooksList, createBook, loadBook, closeBook, updateSettings } = useBooks(
    user,
    setBooksList,
    activeBookId,
    setActiveBookId,
    project,
    setProject,
    setBooksLoading,
    setActiveSceneId
  );

  const {
    clearAISuggestions,
    sendChatMessage,
    replaceSelectedText,
    clearChat,
    runAIRevision,
    runAIContinuityCheck,
    runAIDialogueCheck,
    runPacingAnalysis,
    runResearch,
    triggerMemoryGeneration,
    approveMemory,
    rejectMemory
  } = useAI(
    activeBookId,
    activeSceneId,
    project,
    setProject,
    setAiRunning,
    setAiError,
    setRevisionSuggestions,
    setContinuityWarnings,
    setDialogueWarnings,
    setPacingSuggestions,
    setResearchResults,
    pendingMemoryUpdate,
    setPendingMemoryUpdate,
    chatMessages,
    setChatMessages,
    selectedText,
    setSelectedText,
    setActiveContexts,
    // Callback to update local scene content
    (id, content) => updateSceneContent(id, content)
  );

  // 4. Manuscript Hook
  const {
    selectScene,
    updateSceneContent,
    addChapter,
    addScene,
    deleteScene,
    deleteChapter,
    updateSceneMetadata
  } = useManuscript(
    activeBookId,
    activeSceneId,
    setActiveSceneId,
    project,
    setProject,
    clearAISuggestions
  );

  // 5. Story Bible Hook
  const { updateBibleItem, addBibleItem, deleteBibleItem } = useStoryBible(
    activeBookId,
    setProject,
    activeBibleItemId,
    setBibleItemId
  );

  // 6. Plots & Notes Hook
  const { addPlotThread, updatePlotThread, addNote, updateNote, deleteNote } = usePlotAndNotes(
    activeBookId,
    activeSceneId,
    setProject
  );

  // 7. Snapshots Hook
  const { takeSnapshot, restoreSnapshot } = useSnapshots(
    activeBookId,
    activeSceneId,
    project,
    setProject
  );

  // 8. Import/Export Hook
  const { exportProject, importProject } = useImportExport(
    activeBookId,
    project,
    loadBook
  );

  const setLeftTab = (tab: string) => setActiveLeftTab(tab);
  const setRightTab = (tab: string) => setActiveRightTab(tab);
  const toggleLeftSidebar = () => setIsLeftSidebarOpen(!isLeftSidebarOpen);
  const toggleRightSidebar = () => setIsRightSidebarOpen(!isRightSidebarOpen);
  const setBibleCategory = (cat: 'characters' | 'locations' | 'factions' | 'powerSystems') => {
    setActiveBibleCategory(cat);
    setBibleItemId(null);
  };

  return (
    <StoreContext.Provider value={{
      project,
      activeSceneId,
      activeLeftTab,
      activeRightTab,
      isLeftSidebarOpen,
      isRightSidebarOpen,
      activeBibleCategory,
      activeBibleItemId,
      
      user,
      authLoading,
      booksList,
      activeBookId,
      booksLoading,

      aiRunning,
      revisionSuggestions,
      continuityWarnings,
      dialogueWarnings,
      activeContexts,
      pacingSuggestions,
      researchResults,
      pendingMemoryUpdate,
      aiError,
      clearAIError,

      chatMessages,
      selectedText,
      setSelectedText,
      sendChatMessage,
      replaceSelectedText,
      clearChat,

      signUp,
      signIn,
      signOut,
      createBook,
      loadBook,
      closeBook,
      fetchBooksList,

      updateSceneContent,
      selectScene,
      addChapter,
      addScene,
      deleteScene,
      deleteChapter,
      updateSceneMetadata,
      setLeftTab,
      setRightTab,
      toggleLeftSidebar,
      toggleRightSidebar,
      setBibleCategory,
      setBibleItemId,
      updateBibleItem,
      addBibleItem,
      deleteBibleItem,
      addPlotThread,
      updatePlotThread,
      addNote,
      updateNote,
      deleteNote,
      
      runAIRevision,
      runAIContinuityCheck,
      runAIDialogueCheck,
      runPacingAnalysis,
      runResearch,
      approveMemory,
      rejectMemory,
      triggerMemoryGeneration,
      clearAISuggestions,

      takeSnapshot,
      restoreSnapshot,
      exportProject,
      importProject,
      updateSettings
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
