import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { BibleCategory, ProjectState, MemoryUpdate } from '../types';
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
import type { ChatConversation } from '../types/chatTypes';
import { chatDatabaseService } from '../services/chatDatabaseService';
import { DEFAULT_THEME } from '../theme/themes';

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
  continuityFacts: [],
  bibleItemVersions: [],
  settings: {
    apiKey: '',
    model: 'gemini-1.5-flash',
    provider: 'gemini',
    aiTemperature: 0.7,
    typewriterMode: false,
    focusMode: false,
    splitView: false,
    theme: DEFAULT_THEME
  }
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

type SceneDiagnosticsCache = Record<string, {
  continuityWarnings: StoreContextType['continuityWarnings'];
  dialogueWarnings: StoreContextType['dialogueWarnings'];
  pacingSuggestions: string[] | null;
}>;

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [project, setProject] = useState<ProjectState>(EMPTY_PROJECT_STATE);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [activeLeftTab, setActiveLeftTab] = useState<string>('novel');
  const [activeRightTab, setActiveRightTab] = useState<string>('revision');
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [activeBibleCategory, setActiveBibleCategory] = useState<'characters' | 'locations' | 'factions' | 'powerSystems'>('characters');
  const [activeBibleItemId, setBibleItemId] = useState<string | null>(null);
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);

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
  const [sceneDiagnosticsCache, setSceneDiagnosticsCache] = useState<SceneDiagnosticsCache>({});
  const [researchResults, setResearchResults] = useState<string | null>(null);
  const [activeContexts, setActiveContexts] = useState<string[]>([]);
  const [pendingMemoryUpdate, setPendingMemoryUpdate] = useState<MemoryUpdate | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const clearAIError = () => setAiError(null);
  const clearSceneTransientAI = () => {
    setRevisionSuggestions(null);
    setResearchResults(null);
    setPendingMemoryUpdate(null);
    setAiError(null);
  };
  const cacheSceneDiagnostics = (
    sceneId: string,
    updates: Partial<SceneDiagnosticsCache[string]>
  ) => {
    setSceneDiagnosticsCache(prev => ({
      ...prev,
      [sceneId]: {
        continuityWarnings: prev[sceneId]?.continuityWarnings ?? null,
        dialogueWarnings: prev[sceneId]?.dialogueWarnings ?? null,
        pacingSuggestions: prev[sceneId]?.pacingSuggestions ?? null,
        ...updates
      }
    }));
  };
  const setContinuityWarningsForActiveScene: React.Dispatch<React.SetStateAction<StoreContextType['continuityWarnings']>> = value => {
    setContinuityWarnings(value);
    if (activeSceneId && typeof value !== 'function') {
      cacheSceneDiagnostics(activeSceneId, { continuityWarnings: value });
    }
  };
  const setDialogueWarningsForActiveScene: React.Dispatch<React.SetStateAction<StoreContextType['dialogueWarnings']>> = value => {
    setDialogueWarnings(value);
    if (activeSceneId && typeof value !== 'function') {
      cacheSceneDiagnostics(activeSceneId, { dialogueWarnings: value });
    }
  };
  const setPacingSuggestionsForActiveScene: React.Dispatch<React.SetStateAction<string[] | null>> = value => {
    setPacingSuggestions(value);
    if (activeSceneId && typeof value !== 'function') {
      cacheSceneDiagnostics(activeSceneId, { pacingSuggestions: value });
    }
  };

  useEffect(() => {
    if (!activeSceneId) {
      setContinuityWarnings(null);
      setDialogueWarnings(null);
      setPacingSuggestions(null);
      return;
    }

    const cachedDiagnostics = sceneDiagnosticsCache[activeSceneId];
    setContinuityWarnings(cachedDiagnostics?.continuityWarnings ?? null);
    setDialogueWarnings(cachedDiagnostics?.dialogueWarnings ?? null);
    setPacingSuggestions(cachedDiagnostics?.pacingSuggestions ?? null);
  }, [activeSceneId, sceneDiagnosticsCache]);

  // Chat States
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'model'; content: string }>>([]);
  const [selectedText, setSelectedText] = useState<string>('');

  // Fetch AI conversations from database whenever active book changes
  useEffect(() => {
    if (!activeBookId) {
      setConversations([]);
      setActiveConversationId(null);
      setChatMessages([]);
      return;
    }
    chatDatabaseService.fetchConversations(activeBookId).then(fetchedConvs => {
      setConversations(fetchedConvs);
      if (fetchedConvs.length > 0) {
        setActiveConversationId(fetchedConvs[0].id);
        setChatMessages(fetchedConvs[0].messages);
      } else {
        setActiveConversationId(null);
        setChatMessages([]);
      }
    });
  }, [activeBookId]);

  // 1. Auth Hook
  const { signUp, signIn, signOut, updateUserSettings: persistUserSettings } = useAuth(
    setUser,
    setAuthLoading,
    setActiveBookId,
    setProject,
    setBooksList
  );

  // 2. Books Hook
  const { fetchBooksList, createBook, loadBook, closeBook, deleteBook, updateSettings, updateBookDetails } = useBooks(
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
    continuityRunning,
    dialogueRunning,
    pacingRunning,
    clearAISuggestions,
    sendChatMessage,
    replaceSelectedText,
    clearChat,
    createNewConversation,
    selectConversation,
    deleteConversation,
    runAIRevision,
    runAIContinuityCheck,
    runAIDialogueCheck,
    runPacingAnalysis,
    runAllDiagnostics,
    runResearch,
    triggerMemoryGeneration,
    approveMemory,
    rejectMemory,
    updateMemoryUpdate,
    updateChapterMemory
  } = useAI(
    activeBookId,
    activeSceneId,
    project,
    setProject,
    setAiRunning,
    setAiError,
    setRevisionSuggestions,
    setContinuityWarningsForActiveScene,
    setDialogueWarningsForActiveScene,
    setPacingSuggestionsForActiveScene,
    setResearchResults,
    pendingMemoryUpdate,
    setPendingMemoryUpdate,
    conversations,
    setConversations,
    activeConversationId,
    setActiveConversationId,
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
    updateScene,
    addChapter,
    updateChapter,
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
    clearSceneTransientAI
  );

  // 5. Story Bible Hook
  const {
    updateBibleItem,
    addBibleItem,
    deleteBibleItem,
    addContinuityFact,
    updateContinuityFact,
    deleteContinuityFact,
    createBibleItemVersion
  } = useStoryBible(
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
  const updateUserSettings = async (settings: any) => {
    await persistUserSettings(settings);
    setProject(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...settings
      }
    }));
  };
  const setBibleCategory = (cat: BibleCategory) => {
    setActiveBibleCategory(cat);
    setBibleItemId(null);
  };
  const openReferenceModal = (tab?: string) => {
    if (tab) {
      if (tab === 'characters' || tab === 'locations' || tab === 'factions' || tab === 'powerSystems') {
        setActiveLeftTab('bible');
        setActiveBibleCategory(tab as any);
      } else {
        setActiveLeftTab(tab);
      }
    }
    setIsReferenceModalOpen(true);
  };
  const closeReferenceModal = () => setIsReferenceModalOpen(false);
  const loadBibleItemVersions = (itemId: string) => {
    return project.bibleItemVersions
      .filter(version => version.bibleItemId === itemId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
      isReferenceModalOpen,
      openReferenceModal,
      closeReferenceModal,
      
      user,
      authLoading,
      booksList,
      activeBookId,
      booksLoading,

      aiRunning,
      continuityRunning,
      dialogueRunning,
      pacingRunning,
      revisionSuggestions,
      continuityWarnings,
      dialogueWarnings,
      activeContexts,
      pacingSuggestions,
      researchResults,
      pendingMemoryUpdate,
      aiError,
      clearAIError,

      conversations,
      activeConversationId,
      chatMessages,
      selectedText,
      setSelectedText,
      sendChatMessage,
      replaceSelectedText,
      clearChat,
      createNewConversation,
      selectConversation,
      deleteConversation,

      signUp,
      signIn,
      signOut,
      createBook,
      loadBook,
      closeBook,
      deleteBook,
      fetchBooksList,
      updateUserSettings,
      updateBookDetails,

      updateSceneContent,
      updateScene,
      selectScene,
      addChapter,
      updateChapter,
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
      addContinuityFact,
      updateContinuityFact,
      deleteContinuityFact,
      createBibleItemVersion,
      loadBibleItemVersions,
      addPlotThread,
      updatePlotThread,
      addNote,
      updateNote,
      deleteNote,
      
      runAIRevision,
      runAIContinuityCheck,
      runAIDialogueCheck,
      runPacingAnalysis,
      runAllDiagnostics,
      runResearch,
      approveMemory,
      rejectMemory,
      triggerMemoryGeneration,
      updateMemoryUpdate,
      updateChapterMemory,
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
