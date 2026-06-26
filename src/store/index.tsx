import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import type { 
  ProjectState, Chapter, Scene, PlotThread, VersionSnapshot, Note, MemoryUpdate, SceneMetadata 
} from '../types';
import { 
  getAIRevision, 
  getAIContinuityCheck, 
  getAIDialogueCheck, 
  getAIPacingAnalysis, 
  getAIResearch, 
  getAIMemoryGeneration 
} from '../services/aiService';
import { supabase } from '../services/supabaseClient';

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

// Interface for context state
interface StoreContextType {
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

  // Auth & Hierarchy States
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

  // Debounce timeouts refs
  const sceneTimeoutRef = useRef<{ [key: string]: any }>({});
  const noteTimeoutRef = useRef<{ [key: string]: any }>({});

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(sceneTimeoutRef.current).forEach(clearTimeout);
      Object.values(noteTimeoutRef.current).forEach(clearTimeout);
    };
  }, []);

  // Auth Lifecycle checking
  useEffect(() => {
    supabase.auth.getSession().then((res: any) => {
      const session = res.data?.session;
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (!session) {
        // Logged out
        setActiveBookId(null);
        setProject(EMPTY_PROJECT_STATE);
        setBooksList([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch books list when user changes
  useEffect(() => {
    if (user) {
      fetchBooksList();
    } else {
      setBooksList([]);
    }
  }, [user]);

  const fetchBooksList = async () => {
    if (!user) return;
    try {
      const { data: books, error } = await supabase
        .from('books')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;

      // Fetch count of chapters, scenes, and word_count aggregates
      const { data: scenesCountData } = await supabase
        .from('scenes')
        .select('book_id, word_count');
      
      const { data: chaptersCountData } = await supabase
        .from('chapters')
        .select('book_id');

      const booksWithCounts = (books || []).map((book: any) => {
        const bookScenes = (scenesCountData || []).filter((s: any) => s.book_id === book.id);
        const bookChapters = (chaptersCountData || []).filter((c: any) => c.book_id === book.id);
        const totalWordCount = bookScenes.reduce((sum: number, s: any) => sum + (s.word_count || 0), 0);
        return {
          ...book,
          sceneCount: bookScenes.length,
          chapterCount: bookChapters.length,
          wordCount: totalWordCount
        };
      });

      setBooksList(booksWithCounts);
    } catch (err) {
      console.error('Failed to fetch books list:', err);
    }
  };

  // Auth Actions
  const signUp = async (email: string, password: string) => {
    return await supabase.auth.signUp({ email, password });
  };

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    const res = await supabase.auth.signOut();
    setUser(null);
    setActiveBookId(null);
    setBooksList([]);
    setProject(EMPTY_PROJECT_STATE);
    return res;
  };

  // Hierarchy Actions
  const createBook = async (name: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('books')
        .insert({
          user_id: user.id,
          name
        })
        .select()
        .single();
      
      if (error) throw error;
      
      await fetchBooksList();
      if (data) {
        await loadBook(data.id);
      }
    } catch (err: any) {
      console.error('Failed to create book:', err);
      alert('Error creating book: ' + (err.message || JSON.stringify(err)));
    }
  };

  const loadBook = async (bookId: string) => {
    setBooksLoading(true);
    try {
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('name, settings')
        .eq('id', bookId)
        .single();
      
      if (bookError || !bookData) throw bookError || new Error('Book not found');

      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('id, title, order_index')
        .eq('book_id', bookId)
        .order('order_index', { ascending: true });
      
      if (chaptersError) throw chaptersError;

      const { data: scenesData, error: scenesError } = await supabase
        .from('scenes')
        .select('id, chapter_id, title, content, order_index, status, word_count, metadata, updated_at, created_at')
        .eq('book_id', bookId)
        .order('order_index', { ascending: true });

      if (scenesError) throw scenesError;

      const { data: bibleData, error: bibleError } = await supabase
        .from('story_bible_items')
        .select('id, category, name, data')
        .eq('book_id', bookId);

      if (bibleError) throw bibleError;

      const { data: plotData, error: plotError } = await supabase
        .from('plot_threads')
        .select('id, title, description, type, status, notes, started_in_scene_id, resolved_in_scene_id')
        .eq('book_id', bookId);

      if (plotError) throw plotError;

      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('id, title, content, updated_at')
        .eq('book_id', bookId);

      if (notesError) throw notesError;

      const { data: memoryData, error: memoryError } = await supabase
        .from('memory_updates')
        .select('id, scene_id, summary, events, new_facts, revealed_info, unresolved_questions, emotional_changes, character_development, timeline_updates, location_updates, status')
        .eq('book_id', bookId);

      if (memoryError) throw memoryError;

      const { data: snapshotData, error: snapshotError } = await supabase
        .from('snapshots')
        .select('id, scene_id, timestamp, description, content')
        .eq('book_id', bookId)
        .order('timestamp', { ascending: false });

      if (snapshotError) throw snapshotError;

      // Mapping from DB columns (snake_case) to typescript properties (camelCase)
      const chapters: Chapter[] = (chaptersData || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        order: r.order_index
      }));

      const scenes: Scene[] = (scenesData || []).map((r: any) => ({
        id: r.id,
        chapterId: r.chapter_id,
        title: r.title,
        content: r.content,
        order: r.order_index,
        status: r.status as any,
        wordCount: r.word_count,
        lastSaved: r.updated_at || r.created_at || new Date().toISOString(),
        metadata: r.metadata as any
      }));

      const storyBible = {
        characters: [] as any[],
        locations: [] as any[],
        factions: [] as any[],
        powerSystems: [] as any[]
      };

      (bibleData || []).forEach((r: any) => {
        const cat = r.category as 'characters' | 'locations' | 'factions' | 'powerSystems';
        storyBible[cat].push({
          id: r.id,
          name: r.name,
          ...(r.data || {})
        });
      });

      const plotThreads: PlotThread[] = (plotData || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        type: r.type as any,
        status: r.status as any,
        startedInSceneId: r.started_in_scene_id || '',
        resolvedInSceneId: r.resolved_in_scene_id || '',
        notes: r.notes || ''
      }));

      const notes: Note[] = (notesData || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        lastUpdated: r.updated_at || new Date().toISOString()
      }));

      const memoryUpdates: MemoryUpdate[] = (memoryData || []).map((r: any) => ({
        sceneId: r.scene_id,
        summary: r.summary,
        events: r.events || [],
        newFacts: r.new_facts || [],
        revealedInfo: r.revealed_info || [],
        unresolvedQuestions: r.unresolved_questions || [],
        emotionalChanges: r.emotional_changes || [],
        characterDevelopment: r.character_development || [],
        timelineUpdates: r.timeline_updates || [],
        locationUpdates: r.location_updates || [],
        status: r.status as any
      }));

      const snapshots: VersionSnapshot[] = (snapshotData || []).map((r: any) => ({
        id: r.id,
        sceneId: r.scene_id,
        timestamp: r.timestamp,
        description: r.description,
        content: r.content
      }));

      const loadedProject: ProjectState = {
        projectName: bookData.name,
        chapters,
        scenes,
        storyBible,
        plotThreads,
        notes,
        memoryUpdates,
        snapshots,
        settings: bookData.settings as any
      };

      setProject(loadedProject);
      setActiveBookId(bookId);

      if (scenes.length > 0) {
        setActiveSceneId(scenes[0].id);
      } else {
        setActiveSceneId(null);
      }
    } catch (err) {
      console.error('Failed to load book:', err);
      alert('Error loading book details.');
    } finally {
      setBooksLoading(false);
    }
  };

  const closeBook = () => {
    setActiveBookId(null);
    setProject(EMPTY_PROJECT_STATE);
  };

  // Load Active Contexts based on characters and locations mentioned in active scene
  useEffect(() => {
    if (!activeSceneId) {
      setActiveContexts([]);
      return;
    }
    const scene = project.scenes.find(s => s.id === activeSceneId);
    if (!scene) return;
    
    const contexts: string[] = [];
    contexts.push(`Current Scene: "${scene.title}" Metadata`);
    
    // Scan characters present
    scene.metadata.characters.forEach(charName => {
      const char = project.storyBible.characters.find(c => c.name.toLowerCase() === charName.toLowerCase());
      if (char) contexts.push(`Character Profile: ${char.name}`);
    });

    // Scan location
    const loc = project.storyBible.locations.find(l => l.name.toLowerCase() === scene.metadata.location.toLowerCase());
    if (loc) contexts.push(`Location Profile: ${loc.name}`);

    // Scan magic rules if mentioned
    if (scene.content.toLowerCase().includes('magic') || scene.content.toLowerCase().includes('aether')) {
      project.storyBible.powerSystems.forEach(sys => {
        contexts.push(`Magic System: ${sys.name}`);
      });
    }
    
    // Add active plot threads
    project.plotThreads.forEach(t => {
      if (t.status === 'active') {
        contexts.push(`Active Plot Thread: ${t.title}`);
      }
    });

    setActiveContexts(contexts);
  }, [activeSceneId, project.scenes, project.storyBible, project.plotThreads]);

  const selectScene = (id: string) => {
    setActiveSceneId(id);
    clearAISuggestions();
  };

  const updateSceneContent = (id: string, content: string) => {
    // 1. Update React state instantly
    setProject(prev => {
      const updatedScenes = prev.scenes.map(s => {
        if (s.id === id) {
          return {
            ...s,
            content,
            wordCount: content.split(/\s+/).filter(Boolean).length,
            lastSaved: new Date().toISOString()
          };
        }
        return s;
      });
      return { ...prev, scenes: updatedScenes };
    });

    // 2. Debounce writing to Supabase
    if (sceneTimeoutRef.current[id]) {
      clearTimeout(sceneTimeoutRef.current[id]);
    }

    sceneTimeoutRef.current[id] = setTimeout(async () => {
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      await supabase
        .from('scenes')
        .update({
          content,
          word_count: wordCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
    }, 1000);
  };

  const addChapter = async (title: string) => {
    if (!activeBookId) return;
    try {
      const order = project.chapters.length + 1;
      const { data, error } = await supabase
        .from('chapters')
        .insert({
          book_id: activeBookId,
          title,
          order_index: order
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const newCh: Chapter = {
        id: data.id,
        title: data.title,
        order: data.order_index
      };

      setProject(prev => ({
        ...prev,
        chapters: [...prev.chapters, newCh]
      }));
    } catch (err) {
      console.error('Failed to add chapter:', err);
    }
  };

  const addScene = async (chapterId: string, title: string) => {
    if (!activeBookId) return;
    try {
      const chapterScenes = project.scenes.filter(s => s.chapterId === chapterId);
      const order = chapterScenes.length + 1;
      
      const defaultMetadata = {
        pov: project.storyBible.characters[0]?.name || "Author",
        date: new Date().toISOString().split('T')[0],
        time: "12:00",
        location: project.storyBible.locations[0]?.name || "Default Location",
        characters: []
      };

      const { data, error } = await supabase
        .from('scenes')
        .insert({
          book_id: activeBookId,
          chapter_id: chapterId,
          title,
          content: `Start writing your new scene...`,
          order_index: order,
          status: 'draft',
          metadata: defaultMetadata,
          word_count: 5
        })
        .select()
        .single();

      if (error) throw error;

      const newSc: Scene = {
        id: data.id,
        chapterId: data.chapter_id,
        title: data.title,
        content: data.content,
        order: data.order_index,
        status: data.status as any,
        wordCount: data.word_count,
        lastSaved: data.updated_at || data.created_at || new Date().toISOString(),
        metadata: data.metadata as any
      };

      setProject(prev => ({
        ...prev,
        scenes: [...prev.scenes, newSc]
      }));
      setActiveSceneId(data.id);
    } catch (err) {
      console.error('Failed to add scene:', err);
    }
  };

  const deleteScene = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scenes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProject(prev => ({
        ...prev,
        scenes: prev.scenes.filter(s => s.id !== id)
      }));
      if (activeSceneId === id) {
        setActiveSceneId(null);
      }
    } catch (err) {
      console.error('Failed to delete scene:', err);
    }
  };

  const deleteChapter = async (id: string) => {
    try {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProject(prev => ({
        ...prev,
        chapters: prev.chapters.filter(c => c.id !== id),
        scenes: prev.scenes.filter(s => s.chapterId !== id)
      }));
      if (project.scenes.find(s => s.chapterId === id)?.id === activeSceneId) {
        setActiveSceneId(null);
      }
    } catch (err) {
      console.error('Failed to delete chapter:', err);
    }
  };

  const updateSceneMetadata = async (id: string, metadata: Partial<SceneMetadata>) => {
    try {
      const currentScene = project.scenes.find(s => s.id === id);
      if (!currentScene) return;

      const mergedMetadata = { ...currentScene.metadata, ...metadata };

      const { error } = await supabase
        .from('scenes')
        .update({
          metadata: mergedMetadata
        })
        .eq('id', id);

      if (error) throw error;

      setProject(prev => {
        const updated = prev.scenes.map(s => {
          if (s.id === id) {
            return {
              ...s,
              metadata: mergedMetadata
            };
          }
          return s;
        });
        return { ...prev, scenes: updated };
      });
    } catch (err) {
      console.error('Failed to update scene metadata:', err);
    }
  };

  const setLeftTab = (tab: string) => setActiveLeftTab(tab);
  const setRightTab = (tab: string) => setActiveRightTab(tab);
  const toggleLeftSidebar = () => setIsLeftSidebarOpen(!isLeftSidebarOpen);
  const toggleRightSidebar = () => setIsRightSidebarOpen(!isRightSidebarOpen);
  const setBibleCategory = (cat: 'characters' | 'locations' | 'factions' | 'powerSystems') => {
    setActiveBibleCategory(cat);
    setBibleItemId(null);
  };

  const updateBibleItem = async (category: 'characters' | 'locations' | 'factions' | 'powerSystems', item: any) => {
    try {
      const { id, name, ...data } = item;
      const { error } = await supabase
        .from('story_bible_items')
        .update({
          name,
          data
        })
        .eq('id', id);

      if (error) throw error;

      setProject(prev => {
        const updatedCategory = (prev.storyBible[category] as any[]).map((i: any) => i.id === item.id ? item : i);
        return {
          ...prev,
          storyBible: {
            ...prev.storyBible,
            [category]: updatedCategory
          }
        };
      });
    } catch (err) {
      console.error('Failed to update bible item:', err);
    }
  };

  const addBibleItem = async (category: 'characters' | 'locations' | 'factions' | 'powerSystems', item: any) => {
    if (!activeBookId) return;
    try {
      const { id, name, ...data } = item;
      const { data: inserted, error } = await supabase
        .from('story_bible_items')
        .insert({
          book_id: activeBookId,
          category,
          name: name || `New ${category}`,
          data
        })
        .select()
        .single();

      if (error) throw error;

      const newItem = {
        id: inserted.id,
        name: inserted.name,
        ...(inserted.data || {})
      };

      setProject(prev => ({
        ...prev,
        storyBible: {
          ...prev.storyBible,
          [category]: [...prev.storyBible[category], newItem]
        }
      }));
      setBibleItemId(inserted.id);
    } catch (err) {
      console.error('Failed to add bible item:', err);
    }
  };

  const deleteBibleItem = async (category: 'characters' | 'locations' | 'factions' | 'powerSystems', id: string) => {
    try {
      const { error } = await supabase
        .from('story_bible_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProject(prev => ({
        ...prev,
        storyBible: {
          ...prev.storyBible,
          [category]: (prev.storyBible[category] as any[]).filter((i: any) => i.id !== id)
        }
      }));
      if (activeBibleItemId === id) {
        setBibleItemId(null);
      }
    } catch (err) {
      console.error('Failed to delete bible item:', err);
    }
  };

  const addPlotThread = async (thread: Partial<PlotThread>) => {
    if (!activeBookId) return;
    try {
      const startedInSceneId = activeSceneId || null;
      const { data, error } = await supabase
        .from('plot_threads')
        .insert({
          book_id: activeBookId,
          title: thread.title || "New Plot Thread",
          description: thread.description || "",
          type: thread.type || "mystery",
          status: thread.status || "active",
          notes: thread.notes || "",
          started_in_scene_id: startedInSceneId,
          resolved_in_scene_id: thread.resolvedInSceneId || null
        })
        .select()
        .single();

      if (error) throw error;

      const newThread: PlotThread = {
        id: data.id,
        title: data.title,
        description: data.description,
        type: data.type as any,
        status: data.status as any,
        startedInSceneId: data.started_in_scene_id || "",
        resolvedInSceneId: data.resolved_in_scene_id || "",
        notes: data.notes || ""
      };

      setProject(prev => ({
        ...prev,
        plotThreads: [...prev.plotThreads, newThread]
      }));
    } catch (err) {
      console.error('Failed to add plot thread:', err);
    }
  };

  const updatePlotThread = async (thread: PlotThread) => {
    try {
      const { error } = await supabase
        .from('plot_threads')
        .update({
          title: thread.title,
          description: thread.description,
          type: thread.type,
          status: thread.status,
          notes: thread.notes,
          started_in_scene_id: thread.startedInSceneId || null,
          resolved_in_scene_id: thread.resolvedInSceneId || null
        })
        .eq('id', thread.id);

      if (error) throw error;

      setProject(prev => ({
        ...prev,
        plotThreads: prev.plotThreads.map(t => t.id === thread.id ? thread : t)
      }));
    } catch (err) {
      console.error('Failed to update plot thread:', err);
    }
  };

  const addNote = async (title: string, content: string) => {
    if (!activeBookId) return;
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          book_id: activeBookId,
          title,
          content
        })
        .select()
        .single();

      if (error) throw error;

      const newNote: Note = {
        id: data.id,
        title: data.title,
        content: data.content,
        lastUpdated: data.updated_at || new Date().toISOString()
      };

      setProject(prev => ({
        ...prev,
        notes: [...prev.notes, newNote]
      }));
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    // 1. Update React state instantly
    setProject(prev => ({
      ...prev,
      notes: prev.notes.map(n => n.id === id ? { ...n, ...updates, lastUpdated: new Date().toISOString() } : n)
    }));

    // 2. Debounce writing to Supabase if content or title is changed
    if (updates.content !== undefined || updates.title !== undefined) {
      if (noteTimeoutRef.current[id]) {
        clearTimeout(noteTimeoutRef.current[id]);
      }

      noteTimeoutRef.current[id] = setTimeout(async () => {
        const dbUpdates: any = { updated_at: new Date().toISOString() };
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.content !== undefined) dbUpdates.content = updates.content;
        
        await supabase
          .from('notes')
          .update(dbUpdates)
          .eq('id', id);
      }, 1000);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProject(prev => ({
        ...prev,
        notes: prev.notes.filter(n => n.id !== id)
      }));
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const clearAISuggestions = () => {
    setRevisionSuggestions(null);
    setContinuityWarnings(null);
    setDialogueWarnings(null);
    setPacingSuggestions(null);
    setResearchResults(null);
    setPendingMemoryUpdate(null);
    setAiError(null);
  };

  // AI Service Integrations (calling aiService.ts)
  const runAIRevision = async (mode: 'light' | 'style' | 'line' | 'dev') => {
    if (!activeSceneId) return;
    const scene = project.scenes.find(s => s.id === activeSceneId);
    if (!scene) return;

    setAiRunning(true);
    setRevisionSuggestions(null);
    setAiError(null);

    try {
      const res = await getAIRevision(scene.content, mode, project.settings);
      setRevisionSuggestions({
        ...res,
        original: scene.content
      });
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate AI revision suggestions.');
    } finally {
      setAiRunning(false);
    }
  };

  const runAIContinuityCheck = async () => {
    if (!activeSceneId) return;
    const scene = project.scenes.find(s => s.id === activeSceneId);
    if (!scene) return;

    setAiRunning(true);
    setContinuityWarnings(null);
    setAiError(null);

    try {
      const warnings = await getAIContinuityCheck(scene.content, project.storyBible, scene.metadata, project.settings);
      if (warnings.length === 0) {
        setContinuityWarnings([
          {
            title: 'No Major Inconsistencies Found',
            content: 'The scene aligns nicely with your Story Bible guidelines, active plot threads, and character details.',
            severity: 'low'
          }
        ]);
      } else {
        setContinuityWarnings(warnings);
      }
    } catch (err: any) {
      setAiError(err.message || 'Failed to run continuity check.');
    } finally {
      setAiRunning(false);
    }
  };

  const runAIDialogueCheck = async () => {
    if (!activeSceneId) return;
    const scene = project.scenes.find(s => s.id === activeSceneId);
    if (!scene) return;

    setAiRunning(true);
    setDialogueWarnings(null);
    setAiError(null);

    try {
      const warnings = await getAIDialogueCheck(scene.content, project.storyBible, project.settings);
      if (warnings.length === 0) {
        setDialogueWarnings([
          {
            title: 'Dialogue Voice Preserved',
            quote: 'All dialogue chunks analyzed.',
            content: 'The vocabulary, emotional states, and relationships match the character profiles in the Story Bible.'
          }
        ]);
      } else {
        setDialogueWarnings(warnings);
      }
    } catch (err: any) {
      setAiError(err.message || 'Failed to run dialogue voice check.');
    } finally {
      setAiRunning(false);
    }
  };

  const runPacingAnalysis = async () => {
    if (!activeSceneId) return;
    const scene = project.scenes.find(s => s.id === activeSceneId);
    if (!scene) return;

    setAiRunning(true);
    setPacingSuggestions(null);
    setAiError(null);

    try {
      const suggestions = await getAIPacingAnalysis(scene.content, project.settings);
      setPacingSuggestions(suggestions);
    } catch (err: any) {
      setAiError(err.message || 'Failed to analyze pacing.');
    } finally {
      setAiRunning(false);
    }
  };

  const runResearch = async (query: string) => {
    if (!query) return;
    setAiRunning(true);
    setResearchResults(null);
    setAiError(null);

    try {
      const results = await getAIResearch(query, project.settings);
      setResearchResults(results);
    } catch (err: any) {
      setAiError(err.message || 'Failed to fetch research results.');
    } finally {
      setAiRunning(false);
    }
  };

  const triggerMemoryGeneration = async (sceneId: string) => {
    const scene = project.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    setAiRunning(true);
    setPendingMemoryUpdate(null);
    setAiError(null);

    try {
      const memory = await getAIMemoryGeneration(scene.content, scene.metadata, project.settings);
      setPendingMemoryUpdate({
        ...memory,
        sceneId,
        status: 'pending'
      });
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate scene memory card.');
    } finally {
      setAiRunning(false);
    }
  };

  const approveMemory = async () => {
    if (!pendingMemoryUpdate || !activeBookId) return;
    
    try {
      const { error } = await supabase
        .from('memory_updates')
        .upsert({
          book_id: activeBookId,
          scene_id: pendingMemoryUpdate.sceneId,
          summary: pendingMemoryUpdate.summary,
          events: pendingMemoryUpdate.events,
          new_facts: pendingMemoryUpdate.newFacts,
          revealed_info: pendingMemoryUpdate.revealedInfo,
          unresolved_questions: pendingMemoryUpdate.unresolvedQuestions,
          emotional_changes: pendingMemoryUpdate.emotionalChanges,
          character_development: pendingMemoryUpdate.characterDevelopment,
          timeline_updates: pendingMemoryUpdate.timelineUpdates,
          location_updates: pendingMemoryUpdate.locationUpdates,
          status: 'approved'
        }, { onConflict: 'book_id,scene_id' });

      if (error) throw error;
      
      const scene = project.scenes.find(s => s.id === pendingMemoryUpdate.sceneId);
      const povCharName = scene?.metadata.pov || '';
      
      const charToUpdate = project.storyBible.characters.find(c => c.name.toLowerCase() === povCharName.toLowerCase());
      
      if (charToUpdate) {
        const updatedHistory = charToUpdate.history + `\n- Scene "${scene?.title}" Memory Summary: ${pendingMemoryUpdate.summary}`;
        const updatedChar = { ...charToUpdate, history: updatedHistory };
        
        const { id: charId, name, ...charData } = updatedChar;
        await supabase
          .from('story_bible_items')
          .update({
            name,
            data: charData
          })
          .eq('id', charId);
      }

      setProject(prev => {
        const approved = { ...pendingMemoryUpdate, status: 'approved' as const };
        const updatedMemories = [...prev.memoryUpdates.filter(m => m.sceneId !== approved.sceneId), approved];
        
        const updatedCharacters = prev.storyBible.characters.map(char => {
          if (char.name.toLowerCase() === povCharName.toLowerCase()) {
            return {
              ...char,
              history: char.history + `\n- Scene "${scene?.title}" Memory Summary: ${approved.summary}`
            };
          }
          return char;
        });

        return {
          ...prev,
          memoryUpdates: updatedMemories,
          storyBible: {
            ...prev.storyBible,
            characters: updatedCharacters
          }
        };
      });
      setPendingMemoryUpdate(null);
    } catch (err) {
      console.error('Failed to approve memory:', err);
    }
  };

  const rejectMemory = () => {
    setPendingMemoryUpdate(null);
  };

  // Version Snapshots
  const takeSnapshot = async (description: string) => {
    if (!activeBookId || !activeSceneId) return;
    const scene = project.scenes.find(s => s.id === activeSceneId);
    if (!scene) return;

    try {
      const { data, error } = await supabase
        .from('snapshots')
        .insert({
          book_id: activeBookId,
          scene_id: activeSceneId,
          description,
          content: scene.content
        })
        .select()
        .single();

      if (error) throw error;

      const newSnapshot: VersionSnapshot = {
        id: data.id,
        sceneId: data.scene_id,
        timestamp: data.timestamp,
        description: data.description,
        content: data.content
      };

      setProject(prev => ({
        ...prev,
        snapshots: [newSnapshot, ...prev.snapshots]
      }));
    } catch (err) {
      console.error('Failed to take snapshot:', err);
    }
  };

  const restoreSnapshot = async (id: string) => {
    const snapshot = project.snapshots.find(s => s.id === id);
    if (!snapshot) return;

    try {
      const { error } = await supabase
        .from('scenes')
        .update({
          content: snapshot.content,
          word_count: snapshot.content.split(/\s+/).filter(Boolean).length,
          updated_at: new Date().toISOString()
        })
        .eq('id', snapshot.sceneId);

      if (error) throw error;

      setProject(prev => {
        const updated = prev.scenes.map(s => {
          if (s.id === snapshot.sceneId) {
            return {
              ...s,
              content: snapshot.content,
              wordCount: snapshot.content.split(/\s+/).filter(Boolean).length,
              lastSaved: new Date().toISOString()
            };
          }
          return s;
        });
        return { ...prev, scenes: updated };
      });
    } catch (err) {
      console.error('Failed to restore snapshot:', err);
    }
  };

  // Import / Export
  const exportProject = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${project.projectName.toLowerCase().replace(/\s+/g, '_')}_project.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importProject = async (data: string) => {
    if (!activeBookId) return;
    try {
      const parsed = JSON.parse(data);
      if (parsed.projectName && parsed.scenes) {
        // Warning: this imports into current book project!
        // Delete all old chapters and scenes for this book first
        await supabase.from('chapters').delete().eq('book_id', activeBookId);
        await supabase.from('story_bible_items').delete().eq('book_id', activeBookId);
        await supabase.from('plot_threads').delete().eq('book_id', activeBookId);
        await supabase.from('notes').delete().eq('book_id', activeBookId);
        await supabase.from('memory_updates').delete().eq('book_id', activeBookId);
        await supabase.from('snapshots').delete().eq('book_id', activeBookId);

        // Update book name
        await supabase.from('books').update({ name: parsed.projectName }).eq('id', activeBookId);

        // Load imports
        // Chapters
        for (const ch of (parsed.chapters || [])) {
          await supabase.from('chapters').insert({
            id: ch.id.startsWith('ch-') && ch.id.length > 20 ? undefined : ch.id, // generate uuid if it's mock
            book_id: activeBookId,
            title: ch.title,
            order_index: ch.order
          });
        }

        // Fetch back imported chapters to map their IDs in scenes
        const { data: dbChs } = await supabase.from('chapters').select('id, title, order_index').eq('book_id', activeBookId);

        // Scenes
        for (const sc of (parsed.scenes || [])) {
          // find matching chapter in db (either by title or old id)
          const matchedCh = dbChs?.find((c: any) => c.order_index === parsed.chapters.find((ch: any) => ch.id === sc.chapterId)?.order);
          await supabase.from('scenes').insert({
            id: sc.id.startsWith('sc-') && sc.id.length > 20 ? undefined : sc.id,
            book_id: activeBookId,
            chapter_id: matchedCh?.id || dbChs?.[0]?.id,
            title: sc.title,
            content: sc.content,
            order_index: sc.order,
            status: sc.status,
            word_count: sc.wordCount,
            metadata: sc.metadata
          });
        }

        // Bible items
        const categories: Array<'characters' | 'locations' | 'factions' | 'powerSystems'> = ['characters', 'locations', 'factions', 'powerSystems'];
        for (const cat of categories) {
          const items = parsed.storyBible?.[cat] || [];
          for (const item of items) {
            const { id, name, ...data } = item;
            await supabase.from('story_bible_items').insert({
              id: id.length > 20 ? undefined : id,
              book_id: activeBookId,
              category: cat,
              name: name || `New ${cat}`,
              data
            });
          }
        }

        // Plot threads
        for (const pt of (parsed.plotThreads || [])) {
          await supabase.from('plot_threads').insert({
            id: pt.id.length > 20 ? undefined : pt.id,
            book_id: activeBookId,
            title: pt.title,
            description: pt.description,
            type: pt.type,
            status: pt.status,
            notes: pt.notes,
            started_in_scene_id: null, // cascade resolves later
            resolved_in_scene_id: null
          });
        }

        // Notes
        for (const n of (parsed.notes || [])) {
          await supabase.from('notes').insert({
            id: n.id.length > 20 ? undefined : n.id,
            book_id: activeBookId,
            title: n.title,
            content: n.content
          });
        }

        // Memory updates
        for (const m of (parsed.memoryUpdates || [])) {
          // get matching scene from DB
          const { data: dbScs } = await supabase.from('scenes').select('id, title').eq('book_id', activeBookId);
          const matchedSc = dbScs?.find((s: any) => s.title === parsed.scenes.find((sc: any) => sc.id === m.sceneId)?.title);
          if (matchedSc) {
            await supabase.from('memory_updates').insert({
              book_id: activeBookId,
              scene_id: matchedSc.id,
              summary: m.summary,
              events: m.events,
              new_facts: m.newFacts,
              revealed_info: m.revealedInfo,
              unresolved_questions: m.unresolvedQuestions,
              emotional_changes: m.emotionalChanges,
              character_development: m.characterDevelopment,
              timeline_updates: m.timelineUpdates,
              location_updates: m.locationUpdates,
              status: m.status
            });
          }
        }

        // Reload Book
        await loadBook(activeBookId);
      } else {
        alert("Invalid project format!");
      }
    } catch (e) {
      alert("Failed to parse/import project JSON.");
      console.error(e);
    }
  };

  const updateSettings = async (newSettings: Partial<ProjectState['settings']>) => {
    if (!activeBookId) return;
    try {
      const mergedSettings = { ...project.settings, ...newSettings };
      const { error } = await supabase
        .from('books')
        .update({
          settings: mergedSettings
        })
        .eq('id', activeBookId);

      if (error) throw error;

      setProject(prev => ({
        ...prev,
        settings: mergedSettings
      }));
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
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
