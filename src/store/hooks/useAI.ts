import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { buildBookContextForScene, findBibleItemByEntity } from '../../services/continuityContext';
import { 
  getAIRevision, 
  getAIContinuityCheck, 
  getAIDialogueCheck, 
  getAIPacingAnalysis, 
  getAIResearch, 
  getAIMemoryGeneration,
  getAIChatResponse,
  getAISceneBeats
} from '../../services/aiService';
import type { ContinuityFact, BibleItemVersion, ProjectState, MemoryUpdate, ProposedContinuityFact } from '../../types';
import { notify } from '../../services/notifications';

const inferProposedFactsFromMemory = (
  rawFacts: string[],
  scene: ProjectState['scenes'][number],
  project: ProjectState
): ProposedContinuityFact[] => {
  return rawFacts
    .filter(fact => fact.trim().length > 0)
    .map(fact => {
      const normalizedFact = fact.toLowerCase();
      const character = project.storyBible.characters.find(c => normalizedFact.includes(c.name.toLowerCase()));
      const location = project.storyBible.locations.find(l => normalizedFact.includes(l.name.toLowerCase()));
      const faction = project.storyBible.factions.find(f => normalizedFact.includes(f.name.toLowerCase()));
      const powerSystem = project.storyBible.powerSystems.find(p => normalizedFact.includes(p.name.toLowerCase()));
      const povCharacter = project.storyBible.characters.find(c => c.name.toLowerCase() === scene.metadata.pov.toLowerCase());

      if (character || (!location && !faction && !powerSystem && povCharacter)) {
        const entity = character || povCharacter;
        return {
          entityType: 'character',
          entityId: entity?.id || null,
          entityName: entity?.name || scene.metadata.pov || 'Character',
          factType: 'other',
          factText: fact,
          status: 'active'
        };
      }

      if (location) {
        return {
          entityType: 'location',
          entityId: location.id,
          entityName: location.name,
          factType: 'location_state',
          factText: fact,
          status: 'active'
        };
      }

      if (faction) {
        return {
          entityType: 'faction',
          entityId: faction.id,
          entityName: faction.name,
          factType: 'faction',
          factText: fact,
          status: 'active'
        };
      }

      if (powerSystem) {
        return {
          entityType: 'powerSystem',
          entityId: powerSystem.id,
          entityName: powerSystem.name,
          factType: 'power_system',
          factText: fact,
          status: 'active'
        };
      }

      return {
        entityType: 'timeline',
        entityId: null,
        entityName: scene.title,
        factType: 'timeline',
        factText: fact,
        status: 'active'
      };
    });
};

/**
 * Custom hook managing AI analysis, prompt contexts, history logs, and interactive chat.
 * Computes active contexts dynamically based on active scene POV character, location, and power systems.
 * Connects with `aiService` relays.
 */
import type { ChatConversation } from '../../types/chatTypes';
import { chatDatabaseService } from '../../services/chatDatabaseService';

export const useAI = (
  activeBookId: string | null,
  activeSceneId: string | null,
  project: ProjectState,
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>,
  setAiRunning: React.Dispatch<React.SetStateAction<boolean>>,
  setAiError: React.Dispatch<React.SetStateAction<string | null>>,
  setRevisionSuggestions: React.Dispatch<React.SetStateAction<any>>,
  setContinuityWarnings: React.Dispatch<React.SetStateAction<any>>,
  setDialogueWarnings: React.Dispatch<React.SetStateAction<any>>,
  setPacingSuggestions: React.Dispatch<React.SetStateAction<string[] | null>>,
  setResearchResults: React.Dispatch<React.SetStateAction<string | null>>,
  pendingMemoryUpdate: MemoryUpdate | null,
  setPendingMemoryUpdate: React.Dispatch<React.SetStateAction<MemoryUpdate | null>>,
  conversations: ChatConversation[],
  setConversations: React.Dispatch<React.SetStateAction<ChatConversation[]>>,
  activeConversationId: string | null,
  setActiveConversationId: React.Dispatch<React.SetStateAction<string | null>>,
  chatMessages: Array<{ role: 'user' | 'model'; content: string }>,
  setChatMessages: React.Dispatch<React.SetStateAction<Array<{ role: 'user' | 'model'; content: string }>>>,
  selectedText: string,
  setSelectedText: React.Dispatch<React.SetStateAction<string>>,
  setActiveContexts: React.Dispatch<React.SetStateAction<string[]>>,
  updateSceneContent: (id: string, content: string) => void
) => {
  const [continuityRunning, setContinuityRunning] = useState(false);
  const [dialogueRunning, setDialogueRunning] = useState(false);
  const [pacingRunning, setPacingRunning] = useState(false);

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
  }, [activeSceneId, project.scenes, project.storyBible, project.plotThreads, setActiveContexts]);

  const clearAISuggestions = () => {
    setRevisionSuggestions(null);
    setContinuityWarnings(null);
    setDialogueWarnings(null);
    setPacingSuggestions(null);
    setResearchResults(null);
    setPendingMemoryUpdate(null);
    setAiError(null);
  };

  // Chat Actions
  const createNewConversation = () => {
    setActiveConversationId(null);
    setChatMessages([]);
    setSelectedText('');
  };

  const selectConversation = (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setActiveConversationId(id);
      setChatMessages(conv.messages);
    }
  };

  const deleteConversation = (id: string) => {
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    chatDatabaseService.deleteConversation(id);
    if (activeConversationId === id) {
      createNewConversation();
    }
  };

  const sendChatMessage = async (content: string) => {
    if (!content.trim()) return;
    
    const userMsg = { role: 'user' as const, content };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setAiRunning(true);
    setAiError(null);

    let currentConvId = activeConversationId;
    let updatedConversations = [...conversations];
    let activeConvObj: ChatConversation;

    if (!currentConvId) {
      currentConvId = `conv_${Date.now()}`;
      const title = content.length > 28 ? content.slice(0, 28) + '...' : content;
      activeConvObj = {
        id: currentConvId,
        title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: updatedMessages
      };
      updatedConversations.unshift(activeConvObj);
      setActiveConversationId(currentConvId);
    } else {
      activeConvObj = {
        id: currentConvId,
        title: conversations.find(c => c.id === currentConvId)?.title || 'Conversation',
        createdAt: conversations.find(c => c.id === currentConvId)?.createdAt || Date.now(),
        updatedAt: Date.now(),
        messages: updatedMessages
      };
      updatedConversations = updatedConversations.map(c => 
        c.id === currentConvId ? activeConvObj : c
      );
    }
    setConversations(updatedConversations);
    chatDatabaseService.saveConversation(activeBookId, activeConvObj);

    try {
      const scene = project.scenes.find(s => s.id === activeSceneId);
      const sceneContent = scene ? scene.content : '';

      const aiResponse = await getAIChatResponse(
        updatedMessages,
        sceneContent,
        selectedText,
        project.settings,
        project,
        activeSceneId
      );

      const finalMessages = [...updatedMessages, { role: 'model' as const, content: aiResponse }];
      setChatMessages(finalMessages);

      const finalConvObj: ChatConversation = {
        ...activeConvObj,
        updatedAt: Date.now(),
        messages: finalMessages
      };

      const finalConversations = updatedConversations.map(c => 
        c.id === currentConvId ? finalConvObj : c
      );
      setConversations(finalConversations);
      chatDatabaseService.saveConversation(activeBookId, finalConvObj);
    } catch (err: any) {
      setAiError(err.message || 'Failed to get response from AI writer agent.');
    } finally {
      setAiRunning(false);
    }
  };

  const replaceSelectedText = (newText: string) => {
    if (!activeSceneId || !selectedText) return;
    const scene = project.scenes.find(s => s.id === activeSceneId);
    if (!scene) return;

    if (!scene.content.includes(selectedText)) {
      notify({
        tone: 'warning',
        title: 'Selection changed',
        message: 'Cannot apply the rewrite because the selected text is no longer found in the scene.'
      });
      return;
    }

    const updatedContent = scene.content.replace(selectedText, newText);
    updateSceneContent(activeSceneId, updatedContent);
    setSelectedText(newText);
  };

  const clearChat = () => {
    createNewConversation();
  };

  // AI Service Integrations
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
    setContinuityRunning(true);
    setContinuityWarnings(null);
    setAiError(null);

    try {
      const bookContext = buildBookContextForScene(project, scene);
      const warnings = await getAIContinuityCheck(scene.content, project.storyBible, scene.metadata, project.settings, bookContext);
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
      setContinuityRunning(false);
      setAiRunning(false);
    }
  };

  const runAIDialogueCheck = async () => {
    if (!activeSceneId) return;
    const scene = project.scenes.find(s => s.id === activeSceneId);
    if (!scene) return;

    setAiRunning(true);
    setDialogueRunning(true);
    setDialogueWarnings(null);
    setAiError(null);

    try {
      const bookContext = buildBookContextForScene(project, scene);
      const warnings = await getAIDialogueCheck(scene.content, project.storyBible, project.settings, bookContext);
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
      setDialogueRunning(false);
      setAiRunning(false);
    }
  };

  const runPacingAnalysis = async () => {
    if (!activeSceneId) return;
    const scene = project.scenes.find(s => s.id === activeSceneId);
    if (!scene) return;

    setAiRunning(true);
    setPacingRunning(true);
    setPacingSuggestions(null);
    setAiError(null);

    try {
      const suggestions = await getAIPacingAnalysis(scene.content, project.settings);
      setPacingSuggestions(suggestions);
    } catch (err: any) {
      setAiError(err.message || 'Failed to analyze pacing.');
    } finally {
      setPacingRunning(false);
      setAiRunning(false);
    }
  };

  const runAllDiagnostics = async () => {
    if (!activeSceneId) return;
    const scene = project.scenes.find(s => s.id === activeSceneId);
    if (!scene) return;

    setAiRunning(true);
    setAiError(null);

    await Promise.allSettled([
      runAIContinuityCheck(),
      runAIDialogueCheck(),
      runPacingAnalysis()
    ]);

    setAiRunning(false);
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
      const newFacts = memory.newFacts || [];
      const proposedFacts = memory.proposedFacts?.length
        ? memory.proposedFacts
        : inferProposedFactsFromMemory(newFacts, scene, project);

      setPendingMemoryUpdate({
        summary: memory.summary || '',
        events: memory.events || [],
        newFacts,
        proposedFacts,
        revealedInfo: memory.revealedInfo || [],
        unresolvedQuestions: memory.unresolvedQuestions || [],
        emotionalChanges: memory.emotionalChanges || [],
        characterDevelopment: memory.characterDevelopment || [],
        timelineUpdates: memory.timelineUpdates || [],
        locationUpdates: memory.locationUpdates || [],
        sceneId,
        status: 'pending'
      });
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate scene memory card.');
    } finally {
      setAiRunning(false);
    }
  };

  const approveMemory = async (selectedFacts?: ProposedContinuityFact[]) => {
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
      if (!scene) return;
      const povCharName = scene?.metadata.pov || '';
      const factsToCommit = selectedFacts ?? pendingMemoryUpdate.proposedFacts ?? inferProposedFactsFromMemory(pendingMemoryUpdate.newFacts, scene, project);
      
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

      const insertedFacts: ContinuityFact[] = [];
      const insertedVersions: BibleItemVersion[] = [];
      let factPersistenceFailed = false;
      let versionPersistenceFailed = false;

      for (const fact of factsToCommit) {
        if (!fact.factText?.trim()) continue;

        const matchedItem = fact.entityId
          ? [...project.storyBible.characters, ...project.storyBible.locations, ...project.storyBible.factions, ...project.storyBible.powerSystems].find((item: any) => item.id === fact.entityId) || null
          : findBibleItemByEntity(project, fact.entityType, fact.entityName);
        const matchedCategory =
          matchedItem && project.storyBible.characters.some(item => item.id === matchedItem.id) ? 'characters' :
          matchedItem && project.storyBible.locations.some(item => item.id === matchedItem.id) ? 'locations' :
          matchedItem && project.storyBible.factions.some(item => item.id === matchedItem.id) ? 'factions' :
          matchedItem && project.storyBible.powerSystems.some(item => item.id === matchedItem.id) ? 'powerSystems' :
          null;
        const entityId = fact.entityId || matchedItem?.id || null;

        const { data: insertedFact, error: factError } = await supabase
          .from('continuity_facts')
          .insert({
            book_id: activeBookId,
            scene_id: scene.id,
            chapter_id: scene.chapterId,
            entity_type: fact.entityType,
            entity_id: entityId,
            entity_name: fact.entityName || matchedItem?.name || fact.entityType,
            fact_type: fact.factType || 'other',
            fact_text: fact.factText,
            status: fact.status || 'active',
            starts_at_scene_id: scene.id,
            ends_at_scene_id: null,
            source: 'memory'
          })
          .select()
          .single();

        if (factError) {
          factPersistenceFailed = true;
          console.warn('Failed to persist continuity fact; keeping it locally for this session.', factError);
          insertedFacts.push({
            id: `local-fact-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            bookId: activeBookId,
            sceneId: scene.id,
            chapterId: scene.chapterId,
            entityType: fact.entityType,
            entityId,
            entityName: fact.entityName || matchedItem?.name || fact.entityType,
            factType: fact.factType || 'other',
            factText: fact.factText,
            status: fact.status || 'active',
            startsAtSceneId: scene.id,
            endsAtSceneId: null,
            source: 'memory',
            createdAt: new Date().toISOString()
          });
        } else {
          insertedFacts.push({
            id: insertedFact.id,
            bookId: insertedFact.book_id,
            sceneId: insertedFact.scene_id || '',
            chapterId: insertedFact.chapter_id || '',
            entityType: insertedFact.entity_type,
            entityId: insertedFact.entity_id,
            entityName: insertedFact.entity_name || '',
            factType: insertedFact.fact_type || '',
            factText: insertedFact.fact_text || '',
            status: insertedFact.status,
            startsAtSceneId: insertedFact.starts_at_scene_id || insertedFact.scene_id || '',
            endsAtSceneId: insertedFact.ends_at_scene_id,
            source: insertedFact.source,
            createdAt: insertedFact.created_at || new Date().toISOString()
          });
        }

        if (matchedItem && entityId && matchedCategory) {
          const { id: _id, name, ...versionData } = matchedItem as any;
          const { data: insertedVersion, error: versionError } = await supabase
            .from('bible_item_versions')
            .insert({
              book_id: activeBookId,
              bible_item_id: entityId,
              category: matchedCategory,
              name,
              data: versionData,
              source_scene_id: scene.id,
              reason: `Memory fact from "${scene.title}"`
            })
            .select()
            .single();

          if (versionError) {
            versionPersistenceFailed = true;
            console.warn('Failed to persist bible version for memory fact.', versionError);
          } else {
            insertedVersions.push({
              id: insertedVersion.id,
              bookId: insertedVersion.book_id,
              bibleItemId: insertedVersion.bible_item_id,
              category: insertedVersion.category,
              name: insertedVersion.name || '',
              data: insertedVersion.data || {},
              sourceSceneId: insertedVersion.source_scene_id,
              reason: insertedVersion.reason || '',
              createdAt: insertedVersion.created_at || new Date().toISOString()
            });
          }
        }
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
          continuityFacts: [...prev.continuityFacts, ...insertedFacts],
          bibleItemVersions: [...prev.bibleItemVersions, ...insertedVersions],
          storyBible: {
            ...prev.storyBible,
            characters: updatedCharacters
          }
        };
      });
      if (factPersistenceFailed) {
        notify({
          tone: 'warning',
          title: 'Ledger facts not saved to database',
          message: 'Facts are visible for this session only. Run the continuity ledger migrations and approve the memory again.'
        });
      }
      if (versionPersistenceFailed) {
        notify({
          tone: 'warning',
          title: 'Profile versions not saved to database',
          message: 'The memory was approved, but profile version history could not be persisted.'
        });
      }
      setPendingMemoryUpdate(null);
    } catch (err) {
      console.error('Failed to approve memory:', err);
    }
  };

  const rejectMemory = () => {
    setPendingMemoryUpdate(null);
  };

  const updateMemoryUpdate = (sceneId: string, updates: Partial<MemoryUpdate>) => {
    setProject(prev => ({
      ...prev,
      memoryUpdates: prev.memoryUpdates.map(m => m.sceneId === sceneId ? { ...m, ...updates } : m)
    }));
  };

  const updateChapterMemory = (chapterId: string, summary: string) => {
    setProject(prev => {
      const existing = prev.chapterMemories || [];
      const found = existing.find(c => c.chapterId === chapterId);
      const updated = found
        ? existing.map(c => c.chapterId === chapterId ? { ...c, summary, lastUpdated: new Date().toISOString() } : c)
        : [...existing, { chapterId, summary, keyMilestones: [], characterArcs: [], lastUpdated: new Date().toISOString() }];
      return { ...prev, chapterMemories: updated };
    });
  };

  const expandSceneBeatsWithAI = async (sceneId: string) => {
    const scene = project.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    setAiRunning(true);
    setAiError(null);
    try {
      const existingBeats = scene.outline?.beats?.map(b => b.text) || [];
      const generatedBeats = await getAISceneBeats(scene.title, scene.outline?.summary || '', existingBeats, project);
      
      if (generatedBeats.length > 0) {
        const newBeatObjects = generatedBeats.map(bText => ({
          id: 'beat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          text: bText,
          completed: false
        }));

        setProject(prev => {
          const updatedScenes = prev.scenes.map(s => {
            if (s.id === sceneId) {
              const currentOutline = s.outline || { summary: '', beats: [] };
              return {
                ...s,
                outline: {
                  ...currentOutline,
                  beats: [...currentOutline.beats, ...newBeatObjects]
                }
              };
            }
            return s;
          });
          return { ...prev, scenes: updatedScenes };
        });

        notify({
          tone: 'success',
          title: 'Beats expanded',
          message: `AI generated ${generatedBeats.length} new plot beats for "${scene.title}".`
        });
      } else {
        notify({
          tone: 'info',
          title: 'No new beats',
          message: 'AI did not generate extra beats.'
        });
      }
    } catch (err: any) {
      console.error('Failed to generate beats with AI:', err);
      setAiError(err.message || 'Error expanding beats with AI');
    } finally {
      setAiRunning(false);
    }
  };

  return {
    continuityRunning,
    dialogueRunning,
    pacingRunning,
    clearAISuggestions,
    sendChatMessage,
    replaceSelectedText,
    clearChat,
    createNewConversation,
    selectConversation,
    deleteConversation,
    runAIRevision,
    runAIContinuityCheck,
    runAIDialogueCheck,
    runPacingAnalysis,
    runAllDiagnostics,
    runResearch,
    triggerMemoryGeneration,
    approveMemory,
    rejectMemory,
    updateMemoryUpdate,
    updateChapterMemory,
    expandSceneBeatsWithAI
  };
};
