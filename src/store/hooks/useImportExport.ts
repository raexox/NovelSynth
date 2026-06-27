import { supabase } from '../../services/supabaseClient';
import type { ProjectState } from '../../types';
import { notify } from '../../services/notifications';

export const useImportExport = (
  activeBookId: string | null,
  project: ProjectState,
  loadBook: (bookId: string) => Promise<void>
) => {
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
        await supabase.from('bible_item_versions').delete().eq('book_id', activeBookId);
        await supabase.from('continuity_facts').delete().eq('book_id', activeBookId);
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

        const { data: importedScenes } = await supabase.from('scenes').select('id, title, chapter_id').eq('book_id', activeBookId);
        const { data: importedBibleItems } = await supabase.from('story_bible_items').select('id, name, category').eq('book_id', activeBookId);

        for (const fact of (parsed.continuityFacts || [])) {
          const sourceScene = importedScenes?.find((s: any) => s.title === parsed.scenes.find((sc: any) => sc.id === fact.sceneId)?.title);
          const startsAtScene = importedScenes?.find((s: any) => s.title === parsed.scenes.find((sc: any) => sc.id === fact.startsAtSceneId)?.title);
          const endsAtScene = importedScenes?.find((s: any) => s.title === parsed.scenes.find((sc: any) => sc.id === fact.endsAtSceneId)?.title);
          const entityItem = importedBibleItems?.find((i: any) => i.name === fact.entityName);

          await supabase.from('continuity_facts').insert({
            book_id: activeBookId,
            scene_id: sourceScene?.id || null,
            chapter_id: sourceScene?.chapter_id || null,
            entity_type: fact.entityType,
            entity_id: entityItem?.id || null,
            entity_name: fact.entityName || '',
            fact_type: fact.factType || '',
            fact_text: fact.factText || '',
            status: fact.status || 'active',
            starts_at_scene_id: startsAtScene?.id || sourceScene?.id || null,
            ends_at_scene_id: endsAtScene?.id || null,
            source: fact.source || 'memory'
          });
        }

        for (const version of (parsed.bibleItemVersions || [])) {
          const item = importedBibleItems?.find((i: any) => i.name === version.name && i.category === version.category);
          const sourceScene = importedScenes?.find((s: any) => s.title === parsed.scenes.find((sc: any) => sc.id === version.sourceSceneId)?.title);
          if (!item) continue;

          await supabase.from('bible_item_versions').insert({
            book_id: activeBookId,
            bible_item_id: item.id,
            category: version.category,
            name: version.name || item.name,
            data: version.data || {},
            source_scene_id: sourceScene?.id || null,
            reason: version.reason || 'Imported version'
          });
        }

        // Reload Book
        await loadBook(activeBookId);
        notify({
          tone: 'success',
          title: 'Project imported',
          message: 'The current book has been replaced with the imported project.'
        });
      } else {
        notify({
          tone: 'warning',
          title: 'Invalid project file',
          message: 'The selected JSON does not match the NovelSynth project format.'
        });
      }
    } catch (e) {
      console.error(e);
      notify({
        tone: 'error',
        title: 'Import failed',
        message: 'Could not parse or import the selected project JSON.'
      });
    }
  };

  return {
    exportProject,
    importProject
  };
};
