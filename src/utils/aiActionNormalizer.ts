/**
 * Utility to parse, normalize, and infer AI Chat Actions.
 * Ensures character creations, location creations, and plot threads are accurately
 * categorized even if the LLM outputted an ambiguous or defaulted action type.
 */

export interface NormalizedAiAction {
  type: 'create_character' | 'create_location' | 'create_faction' | 'create_power_system' | 'create_lore' | 'create_plot_thread' | 'add_note' | 'update_scene_outline';
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
  rules?: string;
  limitations?: string;
  costs?: string;
  exceptions?: string;
  examples?: string;
  leader?: string;
  beliefs?: string;
  members?: string;
  allies?: string;
  enemies?: string;
  resources?: string;
  title?: string;
  threadType?: string;
  content?: string;
}

export function parseAndNormalizeAiAction(
  rawContent: string,
  userPrompt: string = ''
): { cleanContent: string; action: NormalizedAiAction | null; actions: NormalizedAiAction[] } {
  if (!rawContent) return { cleanContent: '', action: null, actions: [] };

  const rawActions: any[] = [];
  let cleanContent = rawContent;

  // Global regex to match any json action blocks (e.g., ```json:action or ```json)
  const blockRegex = /```(?:json:action|json)?\s*\n([\s\S]*?)\n```/gi;
  let blockMatch;

  while ((blockMatch = blockRegex.exec(rawContent)) !== null) {
    const jsonStr = blockMatch[1].trim();
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        rawActions.push(...parsed);
      } else if (parsed && typeof parsed === 'object') {
        rawActions.push(parsed);
      }
    } catch (e) {
      // Ignore invalid JSON blocks or unrelated code snippets
    }
  }

  // Strip all matching json code blocks from display content
  cleanContent = rawContent.replace(blockRegex, '').trim();

  // Strip common AI intro meta phrases if left floating in cleanContent
  cleanContent = cleanContent
    .replace(/^(?:Below|Here)\s+is\s+the\s+(?:proposed\s+)?JSON\s+action\s+block[\s\S]*?\n\n?/i, '')
    .replace(/^The content you provided will be added to the lore bible[\s\S]*?\n\n?/i, '')
    .trim();

  const userLower = userPrompt.toLowerCase();
  const rawLower = rawContent.toLowerCase();

  // Helper function to normalize an individual action object
  const normalizeSingleAction = (actObj: any): NormalizedAiAction => {
    const action = { ...actObj };
    let inferredType = String(action.type || '').toLowerCase();

    const isPowerSystemIntent = 
      userLower.includes('lore bible') ||
      userLower.includes('world history') ||
      userLower.includes('magic system') ||
      userLower.includes('power system') ||
      inferredType === 'create_lore' ||
      inferredType === 'add_lore' ||
      Boolean(action.rules);

    const isFactionIntent =
      userLower.includes('faction') ||
      inferredType === 'create_faction' ||
      Boolean(action.leader || action.beliefs);

    const isCharacterIntent = 
      userLower.includes('character') || 
      rawLower.includes('quick-start profile') ||
      Boolean(action.name && !action.landmarks && !action.culture && !action.rules) ||
      Boolean(action.role || action.personality || action.goals || action.appearance);

    const isLocationIntent = 
      userLower.includes('location') || 
      Boolean(action.name && (action.landmarks || action.culture)) ||
      Boolean(action.description && action.landmarks);

    const isPlotThreadIntent = 
      userLower.includes('plot thread') || 
      userLower.includes('mystery') ||
      Boolean(action.threadType);

    if (isPowerSystemIntent && inferredType !== 'create_character' && inferredType !== 'create_location') {
      inferredType = 'create_power_system';
    } else if (isFactionIntent) {
      inferredType = 'create_faction';
    } else if (isCharacterIntent && inferredType !== 'create_location') {
      inferredType = 'create_character';
    } else if (isLocationIntent) {
      inferredType = 'create_location';
    } else if (isPlotThreadIntent) {
      inferredType = 'create_plot_thread';
    }

    if (inferredType === 'create_power_system' || inferredType === 'create_lore') {
      inferredType = 'create_power_system';
      if (!action.name || action.name === 'Magic System' || action.name === 'New Magic System') {
        const nameMatch = rawContent.match(/(?:System Name|Lore Title|Title|Name):\s*\*?\*?([A-Za-z0-9\s\(\)]+)\*?\*?/i) || userPrompt.match(/(?:named|name|lore|history)\s+([A-Za-z0-9\s]+)/i);
        if (nameMatch) action.name = nameMatch[1].trim();
        else action.name = 'World History & Lore';
      }
      if (!action.rules) {
        const filteredBody = cleanContent.replace(/^The content you provided will be added[\s\S]*?\n?/i, '').trim();
        action.rules = filteredBody || userPrompt;
      }
    }

    if (inferredType === 'create_character') {
      if (!action.name || action.name === 'Character Name' || action.name === 'New Character') {
        const nameMatch = rawContent.match(/(?:Name|Character):\s*\*?\*?([A-Za-z0-9\s]+)\*?\*?/i) || userPrompt.match(/(?:named|name)\s+([A-Z][a-z]+)/i);
        if (nameMatch) action.name = nameMatch[1].trim();
      }
    }

    action.type = inferredType;
    return action as NormalizedAiAction;
  };

  const normalizedActions: NormalizedAiAction[] = rawActions.map(normalizeSingleAction);

  // Fallback if no JSON blocks were found at all
  if (normalizedActions.length === 0) {
    let fallbackAction: any = null;
    if (userLower.includes('character') && (userLower.includes('add') || userLower.includes('create') || userLower.includes('come up with'))) {
      const nameMatch = userPrompt.match(/(?:named|name|character)\s+([A-Z][a-z]+)/i);
      fallbackAction = {
        type: 'create_character',
        name: nameMatch ? nameMatch[1] : 'New Character',
        role: 'Supporting',
        personality: 'Extracted from AI chat response',
        goals: userPrompt
      };
    } else if (userLower.includes('location') && (userLower.includes('add') || userLower.includes('create'))) {
      const nameMatch = userPrompt.match(/(?:named|name|location)\s+([A-Z][a-z]+)/i);
      fallbackAction = {
        type: 'create_location',
        name: nameMatch ? nameMatch[1] : 'New Location',
        description: 'Extracted from AI chat response'
      };
    } else if (
      (userLower.includes('lore') || userLower.includes('history') || userLower.includes('magic') || userLower.includes('power system') || userLower.includes('world history')) &&
      (userLower.includes('add') || userLower.includes('create') || userLower.includes('bible') || userLower.includes('lore bible'))
    ) {
      const nameMatch = userPrompt.match(/(?:add these things to the lore bible:|lore bible:|world history|named|name)\s*\*?\*?([A-Za-z0-9\s]+?)(?:\*?\*?\n|$|\()/i);
      const filteredBody = cleanContent.replace(/^The content you provided will be added[\s\S]*?\n?/i, '').trim();
      fallbackAction = {
        type: 'create_power_system',
        name: nameMatch && nameMatch[1].trim().length > 2 ? nameMatch[1].trim() : 'World History & Lore',
        rules: filteredBody || userPrompt
      };
    }

    if (fallbackAction) {
      normalizedActions.push(normalizeSingleAction(fallbackAction));
    }
  }

  return {
    cleanContent,
    action: normalizedActions.length > 0 ? normalizedActions[0] : null,
    actions: normalizedActions
  };
}
