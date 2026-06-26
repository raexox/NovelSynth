import { useRef, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { ProjectState, PlotThread, Note } from '../../types';

export const usePlotAndNotes = (
  activeBookId: string | null,
  activeSceneId: string | null,
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>
) => {
  const noteTimeoutRef = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    const timeouts = noteTimeoutRef.current;
    return () => {
      Object.values(timeouts).forEach(clearTimeout);
    };
  }, []);

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

  return {
    addPlotThread,
    updatePlotThread,
    addNote,
    updateNote,
    deleteNote
  };
};
