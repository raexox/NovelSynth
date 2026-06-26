import { useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { 
  getAIRevision, 
  getAIContinuityCheck, 
  getAIDialogueCheck, 
  getAIPacingAnalysis, 
  getAIResearch, 
  getAIMemoryGeneration,
  getAIChatResponse 
} from '../../services/aiService';
import type { ProjectState, MemoryUpdate } from '../../types';
import { notify } from '../../services/notifications';

/**
 * Custom hook managing AI analysis, prompt contexts, history logs, and interactive chat.
 * Computes active contexts dynamically based on active scene POV character, location, and power systems.
 * Connects with `aiService` relays.
 */
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
  chatMessages: Array<{ role: 'user' | 'model'; content: string }>,
  setChatMessages: React.Dispatch<React.SetStateAction<Array<{ role: 'user' | 'model'; content: string }>>>,
  selectedText: string,
  setSelectedText: React.Dispatch<React.SetStateAction<string>>,
  setActiveContexts: React.Dispatch<React.SetStateAction<string[]>>,
  updateSceneContent: (id: string, content: string) => void
) => {
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
  const sendChatMessage = async (content: string) => {
    if (!content.trim()) return;
    
    const updatedMessages = [...chatMessages, { role: 'user' as const, content }];
    setChatMessages(updatedMessages);
    setAiRunning(true);
    setAiError(null);

    try {
      const scene = project.scenes.find(s => s.id === activeSceneId);
      const sceneContent = scene ? scene.content : '';

      const aiResponse = await getAIChatResponse(
        updatedMessages,
        sceneContent,
        selectedText,
        project.settings
      );

      setChatMessages([...updatedMessages, { role: 'model' as const, content: aiResponse }]);
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
    setChatMessages([]);
    setSelectedText('');
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
    setContinuityWarnings(null);
    setAiError(null);

    try {
      const warnings = await getAIContinuityCheck(scene.content, project.storyBible, scene.metadata, project.settings);
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
      setAiRunning(false);
    }
  };

  const runAIDialogueCheck = async () => {
    if (!activeSceneId) return;
    const scene = project.scenes.find(s => s.id === activeSceneId);
    if (!scene) return;

    setAiRunning(true);
    setDialogueWarnings(null);
    setAiError(null);

    try {
      const warnings = await getAIDialogueCheck(scene.content, project.storyBible, project.settings);
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
      setAiRunning(false);
    }
  };

  const runPacingAnalysis = async () => {
    if (!activeSceneId) return;
    const scene = project.scenes.find(s => s.id === activeSceneId);
    if (!scene) return;

    setAiRunning(true);
    setPacingSuggestions(null);
    setAiError(null);

    try {
      const suggestions = await getAIPacingAnalysis(scene.content, project.settings);
      setPacingSuggestions(suggestions);
    } catch (err: any) {
      setAiError(err.message || 'Failed to analyze pacing.');
    } finally {
      setAiRunning(false);
    }
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
      setPendingMemoryUpdate({
        ...memory,
        sceneId,
        status: 'pending'
      });
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate scene memory card.');
    } finally {
      setAiRunning(false);
    }
  };

  const approveMemory = async () => {
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
      const povCharName = scene?.metadata.pov || '';
      
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
          storyBible: {
            ...prev.storyBible,
            characters: updatedCharacters
          }
        };
      });
      setPendingMemoryUpdate(null);
    } catch (err) {
      console.error('Failed to approve memory:', err);
    }
  };

  const rejectMemory = () => {
    setPendingMemoryUpdate(null);
  };

  return {
    clearAISuggestions,
    sendChatMessage,
    replaceSelectedText,
    clearChat,
    runAIRevision,
    runAIContinuityCheck,
    runAIDialogueCheck,
    runPacingAnalysis,
    runResearch,
    triggerMemoryGeneration,
    approveMemory,
    rejectMemory
  };
};
