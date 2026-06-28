import { useRef, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { ProjectState, Chapter, Scene, SceneMetadata } from '../../types';
import { cacheSceneDraft, clearSceneDraft } from '../sceneDraftCache';
import { notify } from '../../services/notifications';

/**
 * Custom hook managing NovelSynth chapters and scenes.
 * Handles selection, insertion, deletions, and debounced text content updates (1-second delay).
 */
export const useManuscript = (
  activeBookId: string | null,
  activeSceneId: string | null,
  setActiveSceneId: React.Dispatch<React.SetStateAction<string | null>>,
  project: ProjectState,
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>,
  clearAISuggestions: () => void
) => {
  const sceneTimeoutRef = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    const timeouts = sceneTimeoutRef.current;
    return () => {
      Object.values(timeouts).forEach(clearTimeout);
    };
  }, []);

  const selectScene = (id: string) => {
    setActiveSceneId(id);
    clearAISuggestions();
  };

  const updateSceneContent = (id: string, content: string) => {
    cacheSceneDraft(id, content);

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
      const { data, error } = await supabase
        .from('scenes')
        .update({
          content,
          word_count: wordCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('id')
        .single();

      if (!error && data?.id) {
        clearSceneDraft(id);
        delete sceneTimeoutRef.current[id];
      } else {
        console.error('Failed to save scene content:', error || 'No scene row was updated.');
        notify({
          tone: 'warning',
          title: 'Draft not saved to database',
          message: 'Your text is kept locally for now. Check scene table permissions/RLS before refreshing.'
        });
      }
    }, 1000);
  };

  const updateScene = async (id: string, updates: Partial<Scene>) => {
    try {
      const currentScene = project.scenes.find(s => s.id === id);
      if (!currentScene) return;

      const mergedScene = { ...currentScene, ...updates };

      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.wordCount !== undefined) dbUpdates.word_count = updates.wordCount;
      if (updates.order !== undefined) dbUpdates.order_index = updates.order;

      if (updates.content !== undefined) {
        cacheSceneDraft(id, updates.content);
        const wordCount = updates.content.split(/\s+/).filter(Boolean).length;
        mergedScene.wordCount = wordCount;
        dbUpdates.word_count = wordCount;
      }
      mergedScene.lastSaved = new Date().toISOString();
      dbUpdates.updated_at = mergedScene.lastSaved;

      const { data, error } = await supabase
        .from('scenes')
        .update(dbUpdates)
        .eq('id', id)
        .select('id')
        .single();

      if (error || !data?.id) throw error || new Error('No scene row was updated.');

      if (updates.content !== undefined) {
        clearSceneDraft(id);
      }

      setProject(prev => {
        const updatedScenes = prev.scenes.map(s => s.id === id ? mergedScene : s);
        return { ...prev, scenes: updatedScenes };
      });
    } catch (err) {
      console.error('Failed to update scene:', err);
    }
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

  const updateChapter = async (id: string, updates: Partial<Chapter>) => {
    try {
      const currentChapter = project.chapters.find(c => c.id === id);
      if (!currentChapter) return;

      const mergedChapter = { ...currentChapter, ...updates };

      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.order !== undefined) dbUpdates.order_index = updates.order;

      const { error } = await supabase
        .from('chapters')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setProject(prev => {
        const updatedChapters = prev.chapters.map(c => {
          if (c.id === id) {
            return mergedChapter;
          }
          return c;
        });
        return { ...prev, chapters: updatedChapters };
      });
    } catch (err) {
      console.error('Failed to update chapter:', err);
    }
  };

  const addScene = async (chapterId: string, title: string) => {
    if (!activeBookId) return;
    try {
      const chapterScenes = project.scenes.filter(s => s.chapterId === chapterId);
      const order = chapterScenes.length + 1;
      
      const defaultMetadata = {
        pov: project.settings.defaultPovCharacter || project.storyBible.characters[0]?.name || "",
        date: "",
        time: "",
        location: project.storyBible.locations[0]?.name || "",
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
          outline: { summary: '', beats: [] },
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
        metadata: data.metadata as any,
        outline: data.outline || { summary: '', beats: [] }
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

  const updateSceneOutline = async (id: string, outlineUpdates: Partial<import('../../types').SceneOutline>) => {
    const currentScene = project.scenes.find(s => s.id === id);
    if (!currentScene) return;

    const currentOutline = currentScene.outline || { summary: '', beats: [] };
    const mergedOutline = { ...currentOutline, ...outlineUpdates };

    setProject(prev => ({
      ...prev,
      scenes: prev.scenes.map(s => s.id === id ? { ...s, outline: mergedOutline } : s)
    }));

    try {
      await supabase
        .from('scenes')
        .update({ outline: mergedOutline })
        .eq('id', id);
    } catch (err) {
      console.warn('Could not persist outline column to DB, kept in local state.', err);
    }
  };

  const addPlotBeat = (sceneId: string, beatText: string) => {
    if (!beatText.trim()) return;
    const currentScene = project.scenes.find(s => s.id === sceneId);
    if (!currentScene) return;

    const currentOutline = currentScene.outline || { summary: '', beats: [] };
    const newBeat = {
      id: 'beat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      text: beatText.trim(),
      completed: false
    };

    updateSceneOutline(sceneId, {
      beats: [...currentOutline.beats, newBeat]
    });
  };

  const togglePlotBeat = (sceneId: string, beatId: string) => {
    const currentScene = project.scenes.find(s => s.id === sceneId);
    if (!currentScene || !currentScene.outline) return;

    const updatedBeats = currentScene.outline.beats.map(b => 
      b.id === beatId ? { ...b, completed: !b.completed } : b
    );

    updateSceneOutline(sceneId, { beats: updatedBeats });
  };

  const deletePlotBeat = (sceneId: string, beatId: string) => {
    const currentScene = project.scenes.find(s => s.id === sceneId);
    if (!currentScene || !currentScene.outline) return;

    const updatedBeats = currentScene.outline.beats.filter(b => b.id !== beatId);

    updateSceneOutline(sceneId, { beats: updatedBeats });
  };

  const applyAiChatAction = async (action: any): Promise<boolean> => {
    if (!action || typeof action !== 'object') return false;

    // Resolve target scene
    const targetQuery = String(action.targetScene || action.sceneId || action.sceneTitle || activeSceneId || '').toLowerCase().trim();
    const sortedScenes = [...project.scenes].sort((a, b) => a.order - b.order);
    
    let targetScene = project.scenes.find(s => s.id === action.sceneId);
    if (!targetScene && targetQuery) {
      targetScene = project.scenes.find(s => s.title.toLowerCase() === targetQuery || s.title.toLowerCase().includes(targetQuery));
    }
    if (!targetScene && targetQuery) {
      const matchNum = targetQuery.match(/\d+/);
      if (matchNum) {
        const idx = parseInt(matchNum[0], 10) - 1;
        if (idx >= 0 && idx < sortedScenes.length) {
          targetScene = sortedScenes[idx];
        }
      }
    }
    if (!targetScene) {
      targetScene = sortedScenes.find(s => s.id === activeSceneId) || sortedScenes[0];
    }

    if (!targetScene) {
      notify({ tone: 'warning', title: 'Target scene not found', message: 'Could not resolve scene for proposed update.' });
      return false;
    }

    const currentOutline = targetScene.outline || { summary: '', beats: [] };
    let newBeats = [...currentOutline.beats];

    if (Array.isArray(action.addBeats) && action.addBeats.length > 0) {
      const addedObjects = action.addBeats.map((bText: string) => ({
        id: 'beat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        text: String(bText).trim(),
        completed: false
      }));
      newBeats = [...newBeats, ...addedObjects];
    }

    const newSummary = action.summary !== undefined ? String(action.summary).trim() : currentOutline.summary;

    updateSceneOutline(targetScene.id, {
      summary: newSummary,
      beats: newBeats
    });

    if (action.location || action.pov) {
      updateSceneMetadata(targetScene.id, {
        ...(action.location ? { location: String(action.location) } : {}),
        ...(action.pov ? { pov: String(action.pov) } : {})
      });
    }

    notify({
      tone: 'success',
      title: 'Outline updated!',
      message: `Applied proposed changes to "${targetScene.title}".`
    });

    return true;
  };

  return {
    selectScene,
    updateSceneContent,
    updateScene,
    addChapter,
    updateChapter,
    addScene,
    deleteScene,
    deleteChapter,
    updateSceneMetadata,
    updateSceneOutline,
    addPlotBeat,
    togglePlotBeat,
    deletePlotBeat,
    applyAiChatAction
  };
};
