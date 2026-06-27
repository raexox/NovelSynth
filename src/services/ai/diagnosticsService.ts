import type { BookContextForScene } from '../continuityContext';
import type { ProjectState, StoryBible, SceneMetadata } from '../../types';
import { callLLM } from './llmClient';

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
