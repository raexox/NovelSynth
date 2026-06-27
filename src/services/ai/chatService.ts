import type { ProjectState } from '../../types';
import { callLLM } from './llmClient';

export async function getAIChatResponse(
  chatHistory: Array<{ role: 'user' | 'model'; content: string }>,
  sceneContent: string,
  selectedText: string,
  settings: ProjectState['settings'],
  project?: ProjectState,
  activeSceneId?: string
): Promise<string> {

  const activeScene = project?.scenes.find(s => s.id === activeSceneId);
  const activeChapter = activeScene ? project?.chapters.find(c => c.id === activeScene.chapterId) : null;

  let activeSceneNum = 1;
  let activeChapNum = 1;
  if (project?.chapters && activeChapter) {
    activeChapNum = project.chapters.findIndex(c => c.id === activeChapter.id) + 1;
    const chapScenes = project.scenes.filter(s => s.chapterId === activeChapter.id).sort((a, b) => a.order - b.order);
    const idx = chapScenes.findIndex(s => s.id === activeScene?.id);
    if (idx !== -1) activeSceneNum = idx + 1;
  }

  const activeSceneHeader = `Chapter ${activeChapNum}: "${activeChapter?.title || 'Chapter'}", Scene ${activeSceneNum}: "${activeScene?.title || 'Active Scene'}"`;

  let contextBlock = '';

  if (project) {
    // Extract immediate preceding prose hand-off (last 300 words of active scene content)
    const sceneWords = (sceneContent || '').split(/\s+/).filter(Boolean);
    const recentProseSnippet = sceneWords.length > 0 
      ? `\n\n1b. IMMEDIATE PRECEDING PROSE (MATCH VOICE & RHYTHM):\n"""\n... ${sceneWords.slice(-300).join(' ')}\n"""` 
      : '';

    // Smart Windowing: Full detailed beats for scenes in active chapter; concise summaries for distant chapters
    const outlineStructure = (project.chapters || []).map((chap, cIdx) => {
      const isCurrentChap = chap.id === activeChapter?.id;
      const chapScenes = (project.scenes || [])
        .filter(s => s.chapterId === chap.id)
        .sort((a, b) => a.order - b.order)
        .map((s, sIdx) => {
          const isActive = s.id === activeSceneId ? ' [ACTIVE SCENE]' : '';
          let sceneOutlineDetails = '';
          if (s.outline) {
            if (s.outline.summary) sceneOutlineDetails += `\n     Summary: ${s.outline.summary}`;
            // Include full beats for scenes in the current chapter to avoid prompt bloat while giving rich local context
            if (isCurrentChap && s.outline.beats && s.outline.beats.length > 0) {
              sceneOutlineDetails += `\n     Beats: ${s.outline.beats.map(b => b.text).join(' -> ')}`;
            }
          }
          return `   - Scene ${sIdx + 1}: "${s.title}" (ID: ${s.id})${isActive}${sceneOutlineDetails}`;
        })
        .join('\n');
      return `Chapter ${cIdx + 1}: "${chap.title}"\n${chapScenes || '   (No scenes)'}`;
    }).join('\n\n');

    const factsSummary = (project.continuityFacts || [])
      .map(f => `• [${f.entityName || 'General'}] (${f.factType || 'fact'}): ${f.factText}`)
      .join('\n');

    const sceneMemoriesSummary = (project.memoryUpdates || [])
      .map(m => {
        const sc = project.scenes.find(s => s.id === m.sceneId);
        return `• [Scene: "${sc?.title || 'Scene memory'}"]: ${m.summary}\n  Events: ${(m.events || []).join('; ')}\n  Facts Revealed: ${(m.newFacts || []).join('; ')}`;
      })
      .join('\n');

    const chapterMemoriesSummary = (project.chapterMemories || [])
      .map(c => `• Chapter Summary: ${c.summary}`)
      .join('\n');

    const bibleSummary = `Characters: ${project.storyBible?.characters?.map(c => `${c.name} (${c.role})`).join('; ') || 'None'}. Locations: ${project.storyBible?.locations?.map(l => l.name).join('; ') || 'None'}.`;
    const plotSummary = (project.plotThreads || []).filter(p => p.status === 'active').map(p => p.title).join('; ');

    const focusHeader = (selectedText && selectedText.trim()) 
      ? `- ACTIVE HIGHLIGHTED SELECTION (Author selected this text for editing/focus):\n"""\n${selectedText}\n"""\n\n` 
      : '';

    contextBlock = `=== OPTIMIZED PROJECT CONTEXT ===

${focusHeader}1. CURRENT ACTIVE SCENE MANUSCRIPT (${activeSceneHeader}):
"""
${sceneContent || '(Empty scene content)'}
"""${recentProseSnippet}

2. MANUSCRIPT OUTLINE STRUCTURE (WINDOWED):
${outlineStructure || '(No outline available)'}

3. CONTINUITY LEDGER FACTS:
${factsSummary || '(No recorded continuity facts yet)'}

4. RECORDED SCENE & CHAPTER MEMORIES:
${sceneMemoriesSummary || chapterMemoriesSummary || '(No recorded memories yet)'}

5. STORY BIBLE & ACTIVE PLOT THREADS:
${bibleSummary}
Active Plot Threads: ${plotSummary || 'None'}`;
  } else {
    const focusHeader = (selectedText && selectedText.trim()) 
      ? `- ACTIVE HIGHLIGHTED SELECTION:\n"""\n${selectedText}\n"""\n\n` 
      : '';
    contextBlock = `${focusHeader}- Current Active Scene Manuscript (${activeSceneHeader}):\n"""\n${sceneContent || '(Empty scene)'}\n"""`;
  }

  const systemInstruction = `You are a helpful AI writing assistant, line editor, and developmental coach integrated inside NovelSynth, an advanced writing IDE.

CRITICAL INSTRUCTIONS FOR SCENE QUERIES:
- When the author asks what happens in a scene (e.g., "what happens in scene 3", "summarize scene 3"), check Section 1 for the manuscript text of the current active scene or Section 4 for recorded memories.
- Summarize the ACTUAL existing events and manuscript prose provided for that scene.
- DO NOT generate a new plot outline, draft beats, or creative pitch when asked what happens in an existing scene, UNLESS the author explicitly requests brainstorming, rewriting, or new ideas (e.g., "give me ideas for scene 3" or "create a draft outline for scene 3").

Context Provided:
${contextBlock}

Instructions:
1. Brainstorm creative ideas, give advice, or perform rewrites as requested.
2. If asked what happens in a scene or to summarize a scene, provide an accurate summary based strictly on the provided manuscript content and recorded memories.
3. If asked to rewrite, format the rewritten version clearly in clean Markdown so the user can easily review and copy it.
4. PROPOSED ACTIONS (CRITICAL RULE: Match the action type to author request):
If the author asks you to create/add a character, YOU MUST USE 'type': 'create_character'. DO NOT output 'update_scene_outline' when creating characters or locations!
Explain your suggestions naturally, and append a proposed action JSON block at the VERY END of your message in one of these exact formats:

For Creating Story Bible Characters (USE THIS WHEN AUTHOR ASKS TO ADD/CREATE A CHARACTER):
\`\`\`json:action
{
  "type": "create_character",
  "name": "Exact Character Name",
  "role": "Protagonist / Antagonist / Supporting",
  "personality": "Brief traits...",
  "appearance": "Physical description...",
  "goals": "Main motivation...",
  "history": "Detailed backstory and history...",
  "secrets": "Hidden secrets or twists...",
  "abilities": "Skills or powers..."
}
\`\`\`

For Scene Outlines (ONLY USE WHEN AUTHOR ASKS TO PLOT A SCENE):
\`\`\`json:action
{
  "type": "update_scene_outline",
  "targetScene": "Scene 1",
  "summary": "Proposed rough concept summary",
  "addBeats": ["Proposed beat 1", "Proposed beat 2"]
}
\`\`\`

For Creating Story Bible Locations:
\`\`\`json:action
{
  "type": "create_location",
  "name": "Location Name",
  "description": "Visual details...",
  "culture": "Atmosphere / society...",
  "landmarks": "Key sights..."
}
\`\`\`

For Creating Plot Threads / Mysteries:
\`\`\`json:action
{
  "type": "create_plot_thread",
  "title": "Plot Thread Title",
  "description": "What is at stake or to be resolved...",
  "threadType": "goal | mystery | conflict | question | foreshadow"
}
\`\`\`

5. Keep your advice professional, encouraging, and specific to the project context.`;

  let prompt = "Conversation history:\n\n";
  chatHistory.slice(0, -1).forEach(msg => {
    const speaker = msg.role === 'user' ? 'Author' : 'AI Assistant';
    prompt += speaker + ": " + msg.content + "\n\n";
  });

  const lastMsg = chatHistory[chatHistory.length - 1];
  const lastSpeaker = lastMsg.role === 'user' ? 'Author' : 'AI Assistant';
  prompt += lastSpeaker + ": " + lastMsg.content + "\n\nAI Assistant Response:";

  const result = await callLLM(prompt, settings, systemInstruction, false);
  return typeof result === 'string' ? result : (result.response || result.rawText || '');
}
