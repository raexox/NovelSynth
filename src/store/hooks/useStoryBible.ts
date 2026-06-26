import { supabase } from '../../services/supabaseClient';
import type { ProjectState } from '../../types';

export const useStoryBible = (
  activeBookId: string | null,
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>,
  activeBibleItemId: string | null,
  setBibleItemId: React.Dispatch<React.SetStateAction<string | null>>
) => {
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
      const { id: _id, name, ...data } = item;
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

  return {
    updateBibleItem,
    addBibleItem,
    deleteBibleItem
  };
};
