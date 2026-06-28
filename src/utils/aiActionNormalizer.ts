/**
 * Utility to parse, normalize, and infer AI Chat Actions.
 * Ensures character creations, location creations, and plot threads are accurately
 * categorized even if the LLM outputted an ambiguous or defaulted action type.
 */

export interface NormalizedAiAction {
  type: 'create_character' | 'create_location' | 'create_plot_thread' | 'add_note' | 'update_scene_outline';
  targetScene?: string;
  summary?: string;
  addBeats?: string[];
  location?: string;
  pov?: string;
  name?: string;
  age?: string;
  role?: string;
  personality?: string;
  appearance?: string;
  goals?: string;
  history?: string;
  secrets?: string;
  description?: string;
  landmarks?: string;
  title?: string;
  threadType?: string;
  content?: string;
}

export function parseAndNormalizeAiAction(
  rawContent: string,
  userPrompt: string = ''
): { cleanContent: string; action: NormalizedAiAction | null } {
  if (!rawContent) return { cleanContent: '', action: null };

  let action: any = null;
  let cleanContent = rawContent;

  const actionRegex = /```json:action\n([\s\S]*?)\n```/i;
  const match = rawContent.match(actionRegex);

  if (match && match[1]) {
    try {
      action = JSON.parse(match[1]);
      cleanContent = rawContent.replace(actionRegex, '').trim();
    } catch (e) {
      console.warn('Failed to parse json:action block', e);
    }
  }

  const userLower = userPrompt.toLowerCase();
  const rawLower = rawContent.toLowerCase();

  // If no JSON block was found, check if user explicitly asked to create a character or location
  if (!action) {
    if (userLower.includes('character') && (userLower.includes('add') || userLower.includes('create') || userLower.includes('come up with'))) {
      const nameMatch = userPrompt.match(/(?:named|name|character)\s+([A-Z][a-z]+)/i);
      action = {
        type: 'create_character',
        name: nameMatch ? nameMatch[1] : 'New Character',
        role: 'Supporting',
        personality: 'Extracted from AI chat response',
        goals: userPrompt
      };
    } else if (userLower.includes('location') && (userLower.includes('add') || userLower.includes('create'))) {
      const nameMatch = userPrompt.match(/(?:named|name|location)\s+([A-Z][a-z]+)/i);
      action = {
        type: 'create_location',
        name: nameMatch ? nameMatch[1] : 'New Location',
        description: 'Extracted from AI chat response'
      };
    }
  }

  if (!action || typeof action !== 'object') {
    return { cleanContent, action: null };
  }

  // Smart Type Correction / Normalization
  let inferredType = String(action.type || '').toLowerCase();

  const isCharacterIntent = 
    userLower.includes('character') || 
    rawLower.includes('quick-start profile') ||
    Boolean(action.name && !action.landmarks && !action.culture) ||
    Boolean(action.role || action.personality || action.goals || action.appearance);

  const isLocationIntent = 
    userLower.includes('location') || 
    Boolean(action.name && (action.landmarks || action.culture)) ||
    Boolean(action.description && action.landmarks);

  const isPlotThreadIntent = 
    userLower.includes('plot thread') || 
    userLower.includes('mystery') ||
    Boolean(action.threadType);

  if (isCharacterIntent && inferredType !== 'create_location') {
    inferredType = 'create_character';
  } else if (isLocationIntent) {
    inferredType = 'create_location';
  } else if (isPlotThreadIntent) {
    inferredType = 'create_plot_thread';
  }

  // If character creation is detected, extract character fields from assistant markdown if missing
  if (inferredType === 'create_character') {
    if (!action.name || action.name === 'Character Name' || action.name === 'New Character') {
      const nameMatch = rawContent.match(/(?:Name|Character):\s*\*?\*?([A-Za-z0-9\s]+)\*?\*?/i) || userPrompt.match(/(?:named|name)\s+([A-Z][a-z]+)/i);
      if (nameMatch) action.name = nameMatch[1].trim();
    }
    if (!action.age) {
      const ageMatch = rawContent.match(/(?:Age|Years old):\s*\*?\*?([A-Za-z0-9\s]+)\*?\*?/i) || userPrompt.match(/(\d+)\s*(?:years old|year old|yo)/i);
      if (ageMatch) {
        const val = ageMatch[1].trim();
        action.age = /^\d+$/.test(val) ? `${val} years old` : val;
      }
    }
    if (!action.role || action.role.includes('Protagonist / Antagonist')) {
      const roleMatch = rawContent.match(/Role:\s*\*?\*?([A-Za-z0-9\s\(\)]+)\*?\*?/i);
      if (roleMatch) action.role = roleMatch[1].trim();
    }
    if (!action.personality) {
      const traitMatch = rawContent.match(/Personality:\s*\*?\*?([^\n]+)/i);
      if (traitMatch) action.personality = traitMatch[1].trim();
    }
    if (!action.history) {
      const historyMatch = rawContent.match(/(?:History|Backstory|Background):\s*\*?\*?([^\n]+(?:\n[^\n]+){0,3})/i);
      if (historyMatch) {
        action.history = historyMatch[1].trim();
      } else {
        // Fallback: use main assistant body paragraphs as backstory/history
        const paragraphs = cleanContent.split('\n\n').filter(p => !p.startsWith('#') && !p.startsWith('-') && p.length > 40);
        if (paragraphs.length > 0) {
          action.history = paragraphs.join('\n\n');
        }
      }
    }
    if (!action.secrets) {
      const secretsMatch = rawContent.match(/(?:Secrets|Secret|Pact|Hidden):\s*\*?\*?([^\n]+(?:\n[^\n]+){0,2})/i);
      if (secretsMatch) action.secrets = secretsMatch[1].trim();
    }
    if (!action.appearance) {
      const appMatch = rawContent.match(/(?:Appearance|Physically|Look):\s*\*?\*?([^\n]+(?:\n[^\n]+){0,2})/i);
      if (appMatch) action.appearance = appMatch[1].trim();
    }
  }

  action.type = inferredType;
  return { cleanContent, action: action as NormalizedAiAction };
}
