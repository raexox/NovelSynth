import type { ProjectState, SceneMetadata } from '../../types';
import { callLLM } from './llmClient';

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
