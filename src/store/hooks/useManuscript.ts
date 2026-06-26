import { useRef, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { ProjectState, Chapter, Scene, SceneMetadata } from '../../types';

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

  return {
    selectScene,
    updateSceneContent,
    addChapter,
    addScene,
    deleteScene,
    deleteChapter,
    updateSceneMetadata
  };
};
