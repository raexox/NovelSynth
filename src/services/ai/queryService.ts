import type { ProjectState } from '../../types';
import { callLLM } from './llmClient';

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
