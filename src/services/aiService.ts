import type { BookContextForScene } from './continuityContext';
import type { ProjectState, StoryBible, SceneMetadata } from '../types';

/**
 * AI Service Client Relay.
 * Handles downstream API requests to Google Gemini, OpenAI, and OpenRouter.
 * Implements structured formatting prompts for dialogue analysis, pacing metrics, 
 * revision diffs, and manuscript context-aware chat.
 */
// Helper to make API calls to different providers
async function callLLM(
  prompt: string,
  settings: ProjectState['settings'],
  systemInstruction?: string,
  expectJson: boolean = true
): Promise<any> {
  const { apiKey, model, provider, aiTemperature } = settings;

  if (!apiKey || !apiKey.trim()) {
    throw new Error('API key is missing. Please configure your API key in the settings cog in the header.');
  }

  let response: Response;
  let textResult = '';

  try {
    if (provider === 'gemini') {
      const selectedModel = model || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
      
      const generationConfig: any = {
        temperature: aiTemperature
      };
      if (expectJson) {
        generationConfig.responseMimeType = 'application/json';
      }

      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction ? systemInstruction + '\n\n' : ''}Prompt:\n${prompt}` }]
          }
        ],
        generationConfig
      };

      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const rawMessage = errorData.error?.message || '';
        
        if (response.status === 400 && rawMessage.includes('API key')) {
          throw new Error('Invalid API Key: The Gemini key you provided is invalid. Please update it in the settings modal (⚙️).');
        }
        if (response.status === 404) {
          throw new Error(`Model Not Found (404): The Gemini model "${selectedModel}" is invalid or not supported. Check the identifier in settings (⚙️).`);
        }
        if (response.status === 429) {
          throw new Error('Rate Limit Exceeded (429): Too many requests or insufficient quota/credits on your Gemini account.');
        }
        throw new Error(`Gemini API Error (${response.status}): ${rawMessage || 'Unknown error occurred.'}`);
      }

      const resJson = await response.json();
      const candidateParts = resJson.candidates?.[0]?.content?.parts || [];
      textResult = candidateParts.map((p: any) => p.text || '').join('\n').trim();

    } else if (provider === 'openai' || provider === 'openrouter') {
      const url = provider === 'openai' 
        ? 'https://api.openai.com/v1/chat/completions'
        : 'https://openrouter.ai/api/v1/chat/completions';

      const selectedModel = provider === 'openai'
        ? (model || 'gpt-4o-mini')
        : (model || 'google/gemini-2.5-flash');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };

      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://novelsynth.app';
        headers['X-Title'] = 'NovelSynth IDE';
      }

      const messages = [];
      if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
      }
      messages.push({ role: 'user', content: prompt });

      const requestBody: any = {
        model: selectedModel,
        temperature: aiTemperature,
        messages
      };
      if (expectJson) {
        requestBody.response_format = { type: 'json_object' };
      }

      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const rawMessage = errorData.error?.message || errorData.error || '';
        const msgStr = typeof rawMessage === 'object' ? JSON.stringify(rawMessage) : String(rawMessage);
        
        const providerName = provider === 'openai' ? 'OpenAI' : 'OpenRouter';
        
        if (response.status === 401) {
          throw new Error(`Authentication Failed (401): The ${providerName} API key you provided is invalid or expired. Check your settings cog (⚙️).`);
        }
        if (response.status === 404) {
          throw new Error(`Model Not Found (404): The model "${selectedModel}" is invalid or not supported by ${providerName}.`);
        }
        if (response.status === 429) {
          throw new Error(`Rate Limit / Credits Exceeded (429): You have run out of credits or hit a rate limit on your ${providerName} account.`);
        }
        throw new Error(`${providerName} API Error (${response.status}): ${msgStr || 'Unknown error.'}`);
      }

      const resJson = await response.json();
      textResult = resJson.choices?.[0]?.message?.content || '';
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // Clean markdown wrappers if returned by the LLM
    let cleanText = textResult.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json|markdown|text)?\s*/i, '').replace(/```$/, '').trim();
    }

    if (!expectJson) {
      return cleanText || 'I am ready to assist you with your manuscript!';
    }

    if (!cleanText) {
      return { response: 'No response generated by the AI model.' };
    }

    try {
      return JSON.parse(cleanText);
    } catch (e) {
      return { response: cleanText, rawText: cleanText };
    }

  } catch (error: any) {
    console.error('LLM API Call Error:', error);
    const msg = error.message || '';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      throw new Error('Network Connection Failure: Unable to reach the API server. Please check your internet connection or check if your API provider is online.');
    }
    throw error;
  }
}

// 1. Revision service
export async function getAIRevision(
  content: string,
  mode: 'light' | 'style' | 'line' | 'dev',
  settings: ProjectState['settings']
): Promise<{ revised: string; explanation: string; diffHtml: string }> {
  
  const systemInstruction = `You are a developmental novel editor and line editor. Your task is to edit the provided novel text according to the selected mode while STRICTLY preserving the author's voice and unique style. 

The revision modes are:
- "light": Fix spelling, grammar, and punctuation ONLY. Do not change wording.
- "style": Improve sentence rhythm, flow, and remove awkward repetitions. Keep wording changes minimal.
- "line": Polish prose while preserving the voice. Do not write generic AI prose.
- "dev": Do NOT rewrite the text. Instead, write a detailed developmental feedback analysis on pacing, tension, emotional stakes, and scene logic.

Output format:
Return a JSON object with:
{
  "revised": "The edited manuscript text (or original text if dev mode)",
  "explanation": "A summary of what you improved (or the developmental analysis if dev mode)"
}`;

  const prompt = `Selected Mode: ${mode}
Manuscript text:
${content}`;

  const result = await callLLM(prompt, settings, systemInstruction);

  // Generate basic visual diff for UI presentation if not in dev mode
  let diffHtml = '';
  if (mode !== 'dev' && result.revised && result.revised !== content) {
    const wordsOrig = content.split(/\s+/);
    const wordsRev = result.revised.split(/\s+/);
    let i = 0, j = 0;
    
    // Simplistic diff algorithm to show updates inline
    while (i < wordsOrig.length || j < wordsRev.length) {
      if (wordsOrig[i] === wordsRev[j]) {
        diffHtml += (wordsOrig[i] || '') + ' ';
        i++; j++;
      } else {
        let origChunk = '';
        let revChunk = '';
        while (wordsOrig[i] !== wordsRev[j] && (i < wordsOrig.length || j < wordsRev.length)) {
          if (i < wordsOrig.length && wordsOrig[i] !== wordsRev[j]) {
            origChunk += wordsOrig[i] + ' ';
            i++;
          }
          if (j < wordsRev.length && wordsOrig[i] !== wordsRev[j]) {
            revChunk += wordsRev[j] + ' ';
            j++;
          }
        }
        if (origChunk) diffHtml += `<span class="diff-delete">${origChunk.trim()}</span> `;
        if (revChunk) diffHtml += `<span class="diff-insert">${revChunk.trim()}</span> `;
      }
    }
  } else {
    diffHtml = `<div class="diff-no-change">Suggestions are listed below. No inline modifications made.</div>`;
  }

  return {
    revised: result.revised || content,
    explanation: result.explanation || 'No modifications suggested.',
    diffHtml
  };
}

// 2. Continuity check service
export async function getAIContinuityCheck(
  content: string,
  bible: StoryBible,
  metadata: SceneMetadata,
  settings: ProjectState['settings'],
  bookContext?: BookContextForScene
): Promise<Array<{ title: string; content: string; severity: 'low' | 'medium' | 'high' }>> {

  const trimmedChars = (bible.characters || []).map(c => ({
    name: c.name,
    role: c.role,
    traits: c.traits,
    appearance: c.appearance,
    personality: c.personality
  }));
  const trimmedLocs = (bible.locations || []).map(l => ({ name: l.name, description: l.description }));
  const trimmedFactions = (bible.factions || []).map(f => ({ name: f.name, description: f.description }));
  const trimmedSystems = (bible.powerSystems || []).map(p => ({ name: p.name, rules: (p as any).rules || (p as any).description }));

  const systemInstruction = `You are a developmental novel editor and continuity manager. Your task is to audit the active scene draft against the Story Bible details and scene metadata to find any contradictions, timeline errors, character ability clashing, appearance discrepancies, setting/technology clashes, or location mismatches.

Story Bible details provided:
Characters: ${JSON.stringify(trimmedChars)}
Locations: ${JSON.stringify(trimmedLocs)}
Factions: ${JSON.stringify(trimmedFactions)}
Power/Magic Systems: ${JSON.stringify(trimmedSystems)}

Active Scene Metadata:
POV: ${metadata.pov}
Date: ${metadata.date}
Time: ${metadata.time}
Location: ${metadata.location}
Characters present: ${JSON.stringify(metadata.characters)}

Book-aware past canon context:
${bookContext?.summary || 'No approved prior book context available.'}

Output format:
Return a JSON object containing a "warnings" list:
{
  "warnings": [
    {
      "title": "Short title of conflict (e.g. Appearance Contradiction)",
      "content": "Detailed explanation of what contradicts the Story Bible (e.g., Kaelen is described with green hair here, but his bible profile states he has silver hair).",
      "severity": "low" | "medium" | "high"
    }
  ]
}
If no contradictions are found, return an empty warnings list.`;

  const prompt = `Active scene draft:
${content}`;

  const result = await callLLM(prompt, settings, systemInstruction);
  return result.warnings || [];
}

// 3. Dialogue voice check
export async function getAIDialogueCheck(
  content: string,
  bible: StoryBible,
  settings: ProjectState['settings'],
  bookContext?: BookContextForScene
): Promise<Array<{ title: string; quote: string; content: string }>> {

  const trimmedChars = (bible.characters || []).map(c => ({
    name: c.name,
    role: c.role,
    traits: c.traits,
    personality: c.personality,
    speechPatterns: (c as any).speechPatterns || (c as any).speechStyle
  }));

  const systemInstruction = `You are a novel editor and dialogue coach. Audits character dialogue in the scene draft to ensure it aligns with their personality, relationships, speaking style, vocabulary, and emotional states described in the Story Bible.

Story Bible character profiles:
${JSON.stringify(trimmedChars)}

Book-aware past canon context:
${bookContext?.summary || 'No approved prior book context available.'}

Output format:
Return a JSON object containing a "dialogueWarnings" list:
{
  "dialogueWarnings": [
    {
      "title": "Type of voice violation (e.g., Out-of-Character Vocabulary)",
      "quote": "The exact quote from the scene draft",
      "content": "Explanation of why this dialogue is out of character or breaks their established speech patterns."
    }
  ]
}
If all dialogue aligns perfectly with character sheets, return an empty dialogueWarnings list.`;

  const prompt = `Active scene draft:
${content}`;

  const result = await callLLM(prompt, settings, systemInstruction);
  return result.dialogueWarnings || [];
}

// 4. Pacing Analysis service
export async function getAIPacingAnalysis(
  content: string,
  settings: ProjectState['settings']
): Promise<string[]> {

  const systemInstruction = `You are a developmental novel editor analyzing pacing, structures, and sensory balance.

Output format:
Return a JSON object with:
{
  "suggestions": [
    "Pacing evaluation (e.g., speed of action vs exposition, dialogue pacing)",
    "Sensory balance analysis (balance of sight, sound, touch, taste, smell)",
    "Structural suggestions for the scene"
  ]
}`;

  const prompt = `Active scene draft:
${content}`;

  const result = await callLLM(prompt, settings, systemInstruction);
  return result.suggestions || [];
}

// 5. Research Assistant service
export async function getAIResearch(
  query: string,
  settings: ProjectState['settings']
): Promise<string> {

  const systemInstruction = `You are a professional research assistant for historical fiction and worldbuilding. Provide accurate, historical, and factual details on the queried topic. Output results with clean formatting (markdown).

Output format:
Return a JSON object with:
{
  "markdownResults": "### Detailed historical facts...\\n\\n* Key point 1...\\n* Key point 2..."
}`;

  const prompt = `Research Topic: ${query}`;
  const result = await callLLM(prompt, settings, systemInstruction);
  return result.markdownResults || 'No results retrieved.';
}

// 6. Memory Generator service
export async function getAIMemoryGeneration(
  content: string,
  metadata: SceneMetadata,
  settings: ProjectState['settings']
): Promise<any> {

  const systemInstruction = `You are a novel memory summarizer and continuity ledger extractor. Summarize the completed scene to produce a structured record of events, facts, unresolved mysteries, and character development, ready to update character and world histories.

Active Scene Metadata:
POV: ${metadata.pov}
Location: ${metadata.location}
Date/Time: ${metadata.date} / ${metadata.time}

Output format:
Return a JSON object:
{
  "summary": "1-sentence summary of the scene events.",
  "events": ["Event 1", "Event 2", "Event 3"],
  "newFacts": ["New fact revealed 1", "New fact revealed 2"],
  "proposedFacts": [
    {
      "entityType": "character" | "location" | "faction" | "powerSystem" | "object" | "timeline" | "relationship",
      "entityName": "Name of the entity or topic",
      "factType": "appearance | injury | relationship | secret | object_state | location_state | timeline | ability | other",
      "factText": "A concise canonical fact established by this scene.",
      "status": "active"
    }
  ],
  "unresolvedQuestions": ["Mystery or promise left open 1"],
  "emotionalChanges": ["Emotional shift for characters present"],
  "characterDevelopment": ["Developmental impact of this scene"],
  "timelineUpdates": ["Chronology tracking"],
  "locationUpdates": ["Location status updates"]
}

Rules for proposedFacts:
- Every important item in newFacts should also appear as one proposedFacts entry.
- Use concise canonical wording.
- Prefer entityType "character" for character abilities, injuries, secrets, appearance, fears, relationships, goals, and backstory.
- Use entityName exactly as it appears in the scene or metadata when possible.
- If a fact is not tied to a character/location/faction/system, use entityType "timeline".`;

  const prompt = `Completed scene text:
${content}`;

  return await callLLM(prompt, settings, systemInstruction);
}

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
    const outlineStructure = (project.chapters || []).map((chap, cIdx) => {
      const chapScenes = (project.scenes || [])
        .filter(s => s.chapterId === chap.id)
        .sort((a, b) => a.order - b.order)
        .map((s, sIdx) => {
          const isActive = s.id === activeSceneId ? ' [CURRENT ACTIVE SCENE IN EDITOR]' : '';
          return `   - Scene ${sIdx + 1}: "${s.title}" (ID: ${s.id})${isActive}`;
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

    contextBlock = `=== FULL PROJECT CONTEXT ===

${focusHeader}1. CURRENT ACTIVE SCENE MANUSCRIPT (${activeSceneHeader}):
"""
${sceneContent || '(Empty scene content)'}
"""

2. MANUSCRIPT OUTLINE STRUCTURE:
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
4. Keep your advice professional, encouraging, and specific to the project context.`;

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

export async function getAIIntelligentQuery(
  query: string,
  project: ProjectState
): Promise<{ answer: string; keyFindings: string[]; targetSceneId?: string }> {
  const settings = project.settings;

  const scenesSummary = project.scenes
    .map(s => `Scene ID: "${s.id}", Title: "${s.title}":\n${s.content.substring(0, 600)}`)
    .join('\n\n');
  const canonSummary = project.continuityFacts
    .map(f => `Fact (${f.status}): [${f.entityName}] ${f.factText}`)
    .join('\n');
  const bibleSummary = `Characters: ${project.storyBible.characters.map(c => `${c.name} (${c.role})`).join('; ')}. Locations: ${project.storyBible.locations.map(l => l.name).join('; ')}`;

  const systemInstruction = `You are an AI Worldbuilding & Manuscript Intelligence Engine inside NovelSynth.
Your task is to answer the author's question or search query directly by analyzing the provided manuscript scenes, canon ledger facts, and story bible.

Context provided:
=== MANUSCRIPT SCENES ===
${scenesSummary.substring(0, 4500)}

=== CANON FACTS ===
${canonSummary.substring(0, 2500)}

=== STORY BIBLE ===
${bibleSummary}

Output format:
Return a JSON object with:
{
  "answer": "A clear, concise 1-2 sentence direct answer to the author's question.",
  "keyFindings": ["Key evidence snippet 1", "Key evidence snippet 2"],
  "targetSceneId": "ID of the specific scene (e.g. sc-1) where this answer is found, or null"
}`;

  const prompt = `Author Question/Query: "${query}"`;
  const result = await callLLM(prompt, settings, systemInstruction);
  return {
    answer: result.answer || 'Could not synthesize an LLM answer.',
    keyFindings: Array.isArray(result.keyFindings) ? result.keyFindings : [],
    targetSceneId: result.targetSceneId || undefined
  };
}

