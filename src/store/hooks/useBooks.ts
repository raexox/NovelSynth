import { useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../services/supabaseClient';
import type { 
  ProjectState, Chapter, Scene, PlotThread, Note, MemoryUpdate, VersionSnapshot,
  ContinuityFact, BibleItemVersion
} from '../../types';
import { DEFAULT_THEME, isThemeId } from '../../theme/themes';
import { notify } from '../../services/notifications';
import { clearSceneDraft, readSceneDraft } from '../sceneDraftCache';

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
        .select('id, chapter_id, title, content, order_index, status, word_count, metadata, outline, updated_at, created_at')
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

      const { data: continuityData, error: continuityError } = await supabase
        .from('continuity_facts')
        .select('id, book_id, scene_id, chapter_id, entity_type, entity_id, entity_name, fact_type, fact_text, status, starts_at_scene_id, ends_at_scene_id, source, created_at')
        .eq('book_id', bookId);

      if (continuityError) {
        console.warn('Continuity ledger unavailable; run the continuity ledger migration to persist book-aware facts.', continuityError);
      }

      const { data: bibleVersionData, error: bibleVersionError } = await supabase
        .from('bible_item_versions')
        .select('id, book_id, bible_item_id, category, name, data, source_scene_id, reason, created_at')
        .eq('book_id', bookId);

      if (bibleVersionError) {
        console.warn('Bible item versions unavailable; run the continuity ledger migration to persist profile versions.', bibleVersionError);
      }

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

      const draftsToSync: Array<{ id: string; content: string; wordCount: number }> = [];
      const scenes: Scene[] = (scenesData || []).map((r: any) => {
        const remoteSavedAt = r.updated_at || r.created_at || new Date().toISOString();
        const cachedDraft = readSceneDraft(r.id);
        const shouldUseCachedDraft = cachedDraft && new Date(cachedDraft.savedAt).getTime() > new Date(remoteSavedAt).getTime();
        const content = shouldUseCachedDraft ? cachedDraft.content : r.content;
        const wordCount = content.split(/\s+/).filter(Boolean).length;

        if (shouldUseCachedDraft) {
          draftsToSync.push({
            id: r.id,
            content,
            wordCount
          });
        }

        return {
          id: r.id,
          chapterId: r.chapter_id,
          title: r.title,
          content,
          order: r.order_index,
          status: r.status as any,
          wordCount,
          lastSaved: shouldUseCachedDraft ? cachedDraft.savedAt : remoteSavedAt,
          metadata: r.metadata as any,
          outline: r.outline || { summary: '', beats: [] }
        };
      });

      const storyBible = {
        characters: [] as any[],
        locations: [] as any[],
        factions: [] as any[],
        lore: [] as any[],
        powerSystems: [] as any[]
      };

      (bibleData || []).forEach((r: any) => {
        const rawCat = r.category;
        const cat = (rawCat === 'magic' ? 'powerSystems' : rawCat) as 'characters' | 'locations' | 'factions' | 'lore' | 'powerSystems';
        if (storyBible[cat]) {
          storyBible[cat].push({
            id: r.id,
            name: r.name,
            ...(r.data || {})
          });
        }
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
        proposedFacts: [],
        revealedInfo: r.revealed_info || [],
        unresolvedQuestions: r.unresolved_questions || [],
        emotionalChanges: r.emotional_changes || [],
        characterDevelopment: r.character_development || [],
        timelineUpdates: r.timeline_updates || [],
        locationUpdates: r.location_updates || [],
        status: r.status as any
      }));

      const continuityFacts: ContinuityFact[] = (continuityData || []).map((r: any) => ({
        id: r.id,
        bookId: r.book_id,
        sceneId: r.scene_id || '',
        chapterId: r.chapter_id || '',
        entityType: r.entity_type,
        entityId: r.entity_id,
        entityName: r.entity_name || '',
        factType: r.fact_type || '',
        factText: r.fact_text || '',
        status: r.status,
        startsAtSceneId: r.starts_at_scene_id || r.scene_id || '',
        endsAtSceneId: r.ends_at_scene_id,
        source: r.source,
        createdAt: r.created_at || new Date().toISOString()
      }));

      const bibleItemVersions: BibleItemVersion[] = (bibleVersionData || []).map((r: any) => ({
        id: r.id,
        bookId: r.book_id,
        bibleItemId: r.bible_item_id,
        category: r.category,
        name: r.name || '',
        data: r.data || {},
        sourceSceneId: r.source_scene_id,
        reason: r.reason || '',
        createdAt: r.created_at || new Date().toISOString()
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
        continuityFacts,
        bibleItemVersions,
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

      draftsToSync.forEach(async draft => {
        const { error } = await supabase
          .from('scenes')
          .update({
            content: draft.content,
            word_count: draft.wordCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', draft.id);

        if (!error) {
          clearSceneDraft(draft.id);
        } else {
          console.error('Failed to sync cached scene draft:', error);
        }
      });
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
  }, [user, setProject, setActiveBookId, setActiveSceneId, setBooksLoading]);

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
        lore: [],
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
        povType: '3rd Person (Limited)',
        defaultPovCharacter: '',
        povNotes: '',
        proseTense: 'Past',
        proseLanguage: 'US English',
        authorName: '',
        seriesName: '',
        seriesIndex: '',
        labels: [],
        maxTokens: 8192
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

  const deleteBook = async () => {
    if (!activeBookId || !user) return false;

    try {
      await supabase.from('snapshots').delete().eq('book_id', activeBookId);
      await supabase.from('bible_item_versions').delete().eq('book_id', activeBookId).then(
        () => {},
        (err: any) => console.warn('Bible item version cleanup skipped:', err)
      );
      await supabase.from('continuity_facts').delete().eq('book_id', activeBookId).then(
        () => {},
        (err: any) => console.warn('Continuity fact cleanup skipped:', err)
      );
      await supabase.from('memory_updates').delete().eq('book_id', activeBookId);
      await supabase.from('notes').delete().eq('book_id', activeBookId);
      await supabase.from('plot_threads').delete().eq('book_id', activeBookId);
      await supabase.from('story_bible_items').delete().eq('book_id', activeBookId);
      await supabase.from('scenes').delete().eq('book_id', activeBookId);
      await supabase.from('chapters').delete().eq('book_id', activeBookId);

      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', activeBookId)
        .eq('user_id', user.id);

      if (error) throw error;

      const deletedName = project.projectName || 'Book';
      closeBook();
      await fetchBooksList();
      notify({
        tone: 'success',
        title: 'Book deleted',
        message: `${deletedName} was removed from your bookshelf.`
      });
      return true;
    } catch (err) {
      console.error('Failed to delete book:', err);
      notify({
        tone: 'error',
        title: 'Book not deleted',
        message: 'Failed to delete this book and its project data.'
      });
      return false;
    }
  };

  return {
    fetchBooksList,
    createBook,
    loadBook,
    closeBook,
    deleteBook,
    updateSettings,
    updateBookDetails
  };
};
