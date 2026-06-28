import { supabase } from '../../services/supabaseClient';
import type { BibleCategory, BibleItemVersion, ContinuityFact, ProjectState } from '../../types';
import { notify } from '../../services/notifications';

export const useStoryBible = (
  activeBookId: string | null,
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>,
  activeBibleItemId: string | null,
  setBibleItemId: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const updateBibleItem = async (category: BibleCategory, item: any) => {
    try {
      const { id, name, ...data } = item;
      if (id && !id.startsWith('local-')) {
        const { error } = await supabase
          .from('story_bible_items')
          .update({
            name,
            data
          })
          .eq('id', id);

        if (error) console.error('Failed to update bible item in DB:', error);
      }

      setProject(prev => {
        const currentList = prev.storyBible?.[category] || [];
        const updatedCategory = currentList.map((i: any) => i.id === item.id ? item : i);
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

  const addBibleItem = async (category: BibleCategory, item: any) => {
    const localId = `local-${category}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newItem = {
      id: item.id || localId,
      name: item.name || `New ${category}`,
      ...item
    };

    let persistentId = newItem.id;

    if (activeBookId) {
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

        if (!error && inserted) {
          persistentId = inserted.id;
          newItem.id = inserted.id;
        } else if (error) {
          console.warn('Database insert failed, adding to local session only:', error);
        }
      } catch (err) {
        console.warn('Database insert error, adding to local session only:', err);
      }
    }

    setProject(prev => {
      const currentList = prev.storyBible?.[category] || [];
      return {
        ...prev,
        storyBible: {
          ...prev.storyBible,
          [category]: [...currentList, newItem]
        }
      };
    });
    setBibleItemId(persistentId);
  };

  const deleteBibleItem = async (category: BibleCategory, id: string) => {
    try {
      if (id && !id.startsWith('local-')) {
        const { error } = await supabase
          .from('story_bible_items')
          .delete()
          .eq('id', id);

        if (error) console.warn('Failed to delete from DB:', error);
      }

      setProject(prev => {
        const currentList = prev.storyBible?.[category] || [];
        // If deleting a folder, unassign folderId from child items
        const updatedList = currentList
          .filter((i: any) => i.id !== id)
          .map((i: any) => i.folderId === id ? { ...i, folderId: null } : i);
        return {
          ...prev,
          storyBible: {
            ...prev.storyBible,
            [category]: updatedList
          }
        };
      });
      if (activeBibleItemId === id) {
        setBibleItemId(null);
      }
    } catch (err) {
      console.error('Failed to delete bible item:', err);
    }
  };

  const addFolder = async (category: BibleCategory, name: string) => {
    await addBibleItem(category, { name: name || 'New Folder', isFolder: true });
  };

  const updateFolder = async (category: BibleCategory, folderId: string, name: string) => {
    await updateBibleItem(category, { id: folderId, name, isFolder: true });
  };

  const addContinuityFact = async (fact: Omit<ContinuityFact, 'id' | 'createdAt'>) => {
    if (!activeBookId) return null;

    const localFact: ContinuityFact = {
      ...fact,
      id: `local-fact-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      bookId: activeBookId,
      createdAt: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('continuity_facts')
        .insert({
          book_id: activeBookId,
          scene_id: fact.sceneId || null,
          chapter_id: fact.chapterId || null,
          entity_type: fact.entityType,
          entity_id: fact.entityId || null,
          entity_name: fact.entityName,
          fact_type: fact.factType,
          fact_text: fact.factText,
          status: fact.status,
          starts_at_scene_id: fact.startsAtSceneId || fact.sceneId || null,
          ends_at_scene_id: fact.endsAtSceneId || null,
          source: fact.source
        })
        .select()
        .single();

      if (error) throw error;

      const insertedFact: ContinuityFact = {
        id: data.id,
        bookId: data.book_id,
        sceneId: data.scene_id || '',
        chapterId: data.chapter_id || '',
        entityType: data.entity_type,
        entityId: data.entity_id,
        entityName: data.entity_name || '',
        factType: data.fact_type || '',
        factText: data.fact_text || '',
        status: data.status,
        startsAtSceneId: data.starts_at_scene_id || data.scene_id || '',
        endsAtSceneId: data.ends_at_scene_id,
        source: data.source,
        createdAt: data.created_at || new Date().toISOString()
      };

      setProject(prev => ({
        ...prev,
        continuityFacts: [...prev.continuityFacts, insertedFact]
      }));

      return insertedFact;
    } catch (err) {
      console.error('Failed to add continuity fact:', err);
      notify({
        tone: 'warning',
        title: 'Ledger fact not saved to database',
        message: 'The fact is visible for this session only. Check that the continuity ledger migrations were applied.'
      });
      setProject(prev => ({
        ...prev,
        continuityFacts: [...prev.continuityFacts, localFact]
      }));
      return localFact;
    }
  };

  const updateContinuityFact = async (id: string, updates: Partial<ContinuityFact>) => {
    try {
      const dbUpdates: any = {};
      if (updates.sceneId !== undefined) dbUpdates.scene_id = updates.sceneId || null;
      if (updates.chapterId !== undefined) dbUpdates.chapter_id = updates.chapterId || null;
      if (updates.entityType !== undefined) dbUpdates.entity_type = updates.entityType;
      if (updates.entityId !== undefined) dbUpdates.entity_id = updates.entityId || null;
      if (updates.entityName !== undefined) dbUpdates.entity_name = updates.entityName;
      if (updates.factText !== undefined) dbUpdates.fact_text = updates.factText;
      if (updates.factType !== undefined) dbUpdates.fact_type = updates.factType;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.startsAtSceneId !== undefined) dbUpdates.starts_at_scene_id = updates.startsAtSceneId || null;
      if (updates.endsAtSceneId !== undefined) dbUpdates.ends_at_scene_id = updates.endsAtSceneId || null;
      if (updates.source !== undefined) dbUpdates.source = updates.source;

      if (!id.startsWith('local-fact-')) {
        const { error } = await supabase
          .from('continuity_facts')
          .update(dbUpdates)
          .eq('id', id);

        if (error) throw error;
      }

      setProject(prev => ({
        ...prev,
        continuityFacts: prev.continuityFacts.map(fact => fact.id === id ? { ...fact, ...updates } : fact)
      }));
    } catch (err) {
      console.error('Failed to update continuity fact:', err);
    }
  };

  const deleteContinuityFact = async (id: string) => {
    try {
      if (!id.startsWith('local-fact-')) {
        const { error } = await supabase
          .from('continuity_facts')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }

      setProject(prev => ({
        ...prev,
        continuityFacts: prev.continuityFacts.filter(fact => fact.id !== id)
      }));
    } catch (err) {
      console.error('Failed to delete continuity fact:', err);
    }
  };

  const createBibleItemVersion = async (version: Omit<BibleItemVersion, 'id' | 'createdAt'>) => {
    if (!activeBookId || !version.bibleItemId) return null;

    const localVersion: BibleItemVersion = {
      ...version,
      id: `local-version-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      bookId: activeBookId,
      createdAt: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('bible_item_versions')
        .insert({
          book_id: activeBookId,
          bible_item_id: version.bibleItemId,
          category: version.category,
          name: version.name,
          data: version.data || {},
          source_scene_id: version.sourceSceneId || null,
          reason: version.reason
        })
        .select()
        .single();

      if (error) throw error;

      const insertedVersion: BibleItemVersion = {
        id: data.id,
        bookId: data.book_id,
        bibleItemId: data.bible_item_id,
        category: data.category,
        name: data.name || '',
        data: data.data || {},
        sourceSceneId: data.source_scene_id,
        reason: data.reason || '',
        createdAt: data.created_at || new Date().toISOString()
      };

      setProject(prev => ({
        ...prev,
        bibleItemVersions: [...prev.bibleItemVersions, insertedVersion]
      }));

      return insertedVersion;
    } catch (err) {
      console.error('Failed to create bible item version:', err);
      notify({
        tone: 'warning',
        title: 'Profile version not saved to database',
        message: 'The version is visible for this session only. Check that the continuity ledger migrations were applied.'
      });
      setProject(prev => ({
        ...prev,
        bibleItemVersions: [...prev.bibleItemVersions, localVersion]
      }));
      return localVersion;
    }
  };

  const loadBibleItemVersions = (_itemId: string) => {
    return [] as BibleItemVersion[];
  };

  return {
    updateBibleItem,
    addBibleItem,
    deleteBibleItem,
    addFolder,
    updateFolder,
    addContinuityFact,
    updateContinuityFact,
    deleteContinuityFact,
    createBibleItemVersion,
    loadBibleItemVersions
  };
};
