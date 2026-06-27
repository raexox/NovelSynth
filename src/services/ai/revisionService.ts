import type { ProjectState } from '../../types';
import { callLLM } from './llmClient';

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
