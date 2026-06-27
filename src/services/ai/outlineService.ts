import type { ProjectState } from '../../types';
import { callLLM } from './llmClient';

export async function getAISceneBeats(
  sceneTitle: string,
  sceneSummary: string,
  existingBeats: string[],
  project: ProjectState
): Promise<string[]> {
  const settings = project.settings;
  const characters = (project.storyBible.characters || []).map(c => `${c.name} (${c.role || 'character'})`).join(', ');
  const locations = (project.storyBible.locations || []).map(l => l.name).join(', ');

  const systemInstruction = `You are a developmental editor and story architect assisting an author with plotting.
Your goal is to take a high-level scene outline or rough summary and generate 3-5 vivid, sequential plot beats/events that bridge the scene together.

Worldbuilding context:
- Characters: ${characters || 'None specified'}
- Key Locations: ${locations || 'None specified'}

Output format:
Return a JSON object:
{
  "beats": [
    "Short action beat 1",
    "Short action beat 2",
    "Short action beat 3"
  ]
}`;

  const prompt = `Scene Title: "${sceneTitle}"
Rough Summary / Concept: "${sceneSummary || 'Main events of the scene'}"
Existing Beats (if any): ${existingBeats.length > 0 ? existingBeats.join('; ') : 'None'}

Please generate 3-5 intermediate plot beats to make this scene engaging, structured, and clear.`;

  const result = await callLLM(prompt, settings, systemInstruction);
  return Array.isArray(result.beats) ? result.beats : [];
}
