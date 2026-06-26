import { useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../services/supabaseClient';
import type { 
  ProjectState, Chapter, Scene, PlotThread, Note, MemoryUpdate, VersionSnapshot 
} from '../../types';
import { DEFAULT_THEME, isThemeId } from '../../theme/themes';
import { notify } from '../../services/notifications';

export const useBooks = (
  user: User | null,
  setBooksList: React.Dispatch<React.SetStateAction<any[]>>,
  activeBookId: string | null,
  setActiveBookId: React.Dispatch<React.SetStateAction<string | null>>,
  project: ProjectState,
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>,
  setBooksLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setActiveSceneId: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const fetchBooksList = useCallback(async () => {
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
  }, [user, setBooksList]);

  // Fetch books list when user changes
  useEffect(() => {
    if (user) {
      fetchBooksList();
    } else {
      setBooksList([]);
    }
  }, [user, fetchBooksList, setBooksList]);

  const loadBook = useCallback(async (bookId: string) => {
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

      const userMetaSettings = user?.user_metadata?.novelsynth_settings || {};
      const mergedSettings = {
        apiKey: '',
        model: 'gemini-1.5-flash',
        provider: 'gemini',
        aiTemperature: 0.7,
        typewriterMode: false,
        focusMode: false,
        splitView: false,
        theme: DEFAULT_THEME,
        ...(bookData.settings || {}),
        ...userMetaSettings
      };
      if (!isThemeId(mergedSettings.theme)) {
        mergedSettings.theme = DEFAULT_THEME;
      }

      const loadedProject: ProjectState = {
        projectName: bookData.name,
        chapters,
        scenes,
        storyBible,
        plotThreads,
        notes,
        memoryUpdates,
        snapshots,
        settings: mergedSettings as any
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
      notify({
        tone: 'error',
        title: 'Book failed to load',
        message: 'Could not load this project from the cloud.'
      });
    } finally {
      setBooksLoading(false);
    }
  }, [setProject, setActiveBookId, setActiveSceneId, setBooksLoading]);

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
      notify({
        tone: 'error',
        title: 'Book not created',
        message: err.message || 'An unexpected error occurred while creating the book.'
      });
    }
  };

  const closeBook = () => {
    setActiveBookId(null);
    setProject({
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
        splitView: false,
        theme: DEFAULT_THEME
      }
    });
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

  const updateBookDetails = async (name: string, newSettings: Partial<ProjectState['settings']>) => {
    if (!activeBookId) return;
    try {
      const mergedSettings = { ...project.settings, ...newSettings };
      const { theme: _accountTheme, ...bookSettings } = mergedSettings;
      const { error } = await supabase
        .from('books')
        .update({
          name,
          settings: bookSettings
        })
        .eq('id', activeBookId);

      if (error) throw error;

      setProject(prev => ({
        ...prev,
        projectName: name,
        settings: mergedSettings
      }));

      await fetchBooksList();
    } catch (err) {
      console.error('Failed to update book details:', err);
      notify({
        tone: 'error',
        title: 'Book settings not saved',
        message: 'Failed to update book details.'
      });
    }
  };

  return {
    fetchBooksList,
    createBook,
    loadBook,
    closeBook,
    updateSettings,
    updateBookDetails
  };
};
