import { supabase } from '../../services/supabaseClient';
import type { ProjectState, VersionSnapshot } from '../../types';

export const useSnapshots = (
  activeBookId: string | null,
  activeSceneId: string | null,
  project: ProjectState,
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>
) => {
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

  return {
    takeSnapshot,
    restoreSnapshot
  };
};
