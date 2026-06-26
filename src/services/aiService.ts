import type { ProjectState, StoryBible, SceneMetadata } from '../types';

// Helper to make API calls to different providers
async function callLLM(
  prompt: string,
  settings: ProjectState['settings'],
  systemInstruction?: string
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
      
      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction ? systemInstruction + '\n\n' : ''}Prompt:\n${prompt}` }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: aiTemperature
        }
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
      textResult = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '';

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

      const requestBody = {
        model: selectedModel,
        response_format: { type: 'json_object' },
        temperature: aiTemperature,
        messages
      };

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
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }

    return JSON.parse(cleanText);

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
  settings: ProjectState['settings']
): Promise<Array<{ title: string; content: string; severity: 'low' | 'medium' | 'high' }>> {

  const systemInstruction = `You are a developmental novel editor and continuity manager. Your task is to audit the active scene draft against the Story Bible details and scene metadata to find any contradictions, timeline errors, character ability clashing, appearance discrepancies, setting/technology clashes, or location mismatches.

Story Bible details provided:
Characters: ${JSON.stringify(bible.characters)}
Locations: ${JSON.stringify(bible.locations)}
Factions: ${JSON.stringify(bible.factions)}
Power/Magic Systems: ${JSON.stringify(bible.powerSystems)}

Active Scene Metadata:
POV: ${metadata.pov}
Date: ${metadata.date}
Time: ${metadata.time}
Location: ${metadata.location}
Characters present: ${JSON.stringify(metadata.characters)}

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
  settings: ProjectState['settings']
): Promise<Array<{ title: string; quote: string; content: string }>> {

  const systemInstruction = `You are a novel editor and dialogue coach. Audits character dialogue in the scene draft to ensure it aligns with their personality, relationships, speaking style, vocabulary, and emotional states described in the Story Bible.

Story Bible character profiles:
${JSON.stringify(bible.characters)}

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

  const systemInstruction = `You are a novel memory summarizer. Summarize the completed scene to produce a structured record of events, facts, unresolved mysteries, and character development, ready to update character and world histories.

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
  "unresolvedQuestions": ["Mystery or promise left open 1"],
  "emotionalChanges": ["Emotional shift for characters present"],
  "characterDevelopment": ["Developmental impact of this scene"],
  "timelineUpdates": ["Chronology tracking"],
  "locationUpdates": ["Location status updates"]
}`;

  const prompt = `Completed scene text:
${content}`;

  return await callLLM(prompt, settings, systemInstruction);
}

export async function getAIChatResponse(
  chatHistory: Array<{ role: 'user' | 'model'; content: string }>,
  sceneContent: string,
  selectedText: string,
  settings: ProjectState['settings']
): Promise<string> {

  const systemInstruction = `You are a helpful AI writing assistant, line editor, and brainstorming coach integrated inside NovelSynth, an advanced writing IDE.
Your goal is to help the author brainstorm ideas, outline plots, rewrite sections of their manuscript, or provide developmental suggestions.

Context:
- Current Scene Manuscript:
"""
${sceneContent || '(Empty scene)'}
"""
${selectedText ? `- Active Highlighted Selection (discussed context):\n"""\n${selectedText}\n"""` : ''}

Instructions:
1. Brainstorm creative ideas, give advice, or perform rewrites as requested.
2. If asked to rewrite, format the rewritten version clearly so the user can easily review it.
3. Keep your advice professional, encouraging, and specific to the scene context.
4. Output format MUST be a JSON object containing a single field "response" which is a markdown string.

Example Output format:
{
  "response": "### Brainstormed Names\\n\\n1. **Smuggler A**: description...\\n2. **Smuggler B**: description..."
}`;

  let prompt = "Conversation history:\n\n";
  chatHistory.slice(0, -1).forEach(msg => {
    const speaker = msg.role === 'user' ? 'Author' : 'AI Assistant';
    prompt += speaker + ": " + msg.content + "\n\n";
  });

  const lastMsg = chatHistory[chatHistory.length - 1];
  const lastSpeaker = lastMsg.role === 'user' ? 'Author' : 'AI Assistant';
  prompt += lastSpeaker + ": " + lastMsg.content + "\n\nAI Assistant Response:";

  const result = await callLLM(prompt, settings, systemInstruction);
  return result.response || '';
}
