/**
 * Utility to parse, normalize, and infer AI Chat Actions.
 * Ensures character creations, location creations, and plot threads are accurately
 * categorized even if the LLM outputted an ambiguous or defaulted action type.
 */

export interface NormalizedAiAction {
  type: 'create_character' | 'create_location' | 'create_faction' | 'create_power_system' | 'create_lore' | 'create_plot_thread' | 'add_note' | 'update_scene_outline' | 'replace_line' | 'line_edit';
  targetScene?: string;
  targetText?: string;
  replacementText?: string;
  edits?: Array<{ targetText: string; replacementText: string }>;
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
    .replace(/^(?:Below|Here)\s+(?:is|are)\s+the\s+(?:proposed\s+)?(?:JSON\s+action\s+blocks?|lore\s+entries)[\s\S]*?\n\n?/i, '')
    .replace(/^The content you provided will be added[\s\S]*?\n\n?/i, '')
    .replace(/^Each entry is wrapped in its own[\s\S]*?\n\n?/i, '')
    .trim();

  const userLower = userPrompt.toLowerCase();
  const rawLower = rawContent.toLowerCase();

  // Helper function to normalize an individual action object
  const normalizeSingleAction = (actObj: any): NormalizedAiAction => {
    const action = { ...actObj };
    let inferredType = String(action.type || '').toLowerCase();

    const actionText = `${action.name || ''} ${action.description || ''} ${action.rules || ''} ${action.history || ''}`.toLowerCase();
    
    const isLineEditIntent =
      inferredType === 'replace_line' ||
      inferredType === 'line_edit' ||
      Boolean(action.targetText && action.replacementText) ||
      Boolean(Array.isArray(action.edits) && action.edits.length > 0);

    const isExplicitMagicContent = 
      actionText.includes('magic system') ||
      actionText.includes('power system') ||
      actionText.includes('natural resonance') ||
      actionText.includes('schools of magic') ||
      actionText.includes('affinity') ||
      actionText.includes('casting rules') ||
      (action.name && action.name.toLowerCase().includes('magic'));

    const isLoreIntent = 
      !isExplicitMagicContent && (
        userLower.includes('world history') ||
        userLower.includes('historical era') ||
        userLower.includes('timeline') ||
        userLower.includes('world lore') ||
        inferredType === 'create_lore' ||
        inferredType === 'add_lore'
      );

    const isPowerSystemIntent = 
      isExplicitMagicContent ||
      userLower.includes('magic system') ||
      userLower.includes('power system') ||
      inferredType === 'create_power_system' ||
      inferredType === 'add_power_system' ||
      inferredType === 'create_magic' ||
      inferredType === 'add_magic' ||
      Boolean(action.rules && !action.era);

    const isFactionIntent =
      userLower.includes('faction') ||
      inferredType === 'create_faction' ||
      Boolean(action.leader || action.beliefs);

    const isCharacterIntent = 
      userLower.includes('character') || 
      rawLower.includes('quick-start profile') ||
      Boolean(action.name && !action.landmarks && !action.culture && !action.rules && !action.era) ||
      Boolean(action.role || action.personality || action.goals || action.appearance);

    const isLocationIntent = 
      userLower.includes('location') || 
      Boolean(action.name && (action.landmarks || action.culture)) ||
      Boolean(action.description && action.landmarks);

    const isPlotThreadIntent = 
      userLower.includes('plot thread') || 
      userLower.includes('mystery') ||
      Boolean(action.threadType);

    if (isLineEditIntent) {
      inferredType = 'replace_line';
    } else if (isExplicitMagicContent) {
    } else if (isLoreIntent && inferredType !== 'create_character' && inferredType !== 'create_location') {
      inferredType = 'create_lore';
    } else if (isPowerSystemIntent && inferredType !== 'create_character' && inferredType !== 'create_location') {
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

    if (inferredType === 'create_lore') {
      if (!action.name || action.name === 'Lore Entry' || action.name === 'New Lore Entry') {
        const nameMatch = rawContent.match(/(?:Era Title|Lore Title|Title|Name):\s*\*?\*?([A-Za-z0-9\s\(\)]+)\*?\*?/i) || userPrompt.match(/(?:named|called)\s+"?([A-Za-z0-9\s]+)"?/i);
        if (nameMatch && nameMatch[1].trim().length > 2) action.name = nameMatch[1].trim();
        else action.name = 'World History & Lore';
      }
      if (!action.description) {
        const filteredBody = cleanContent.replace(/^The content you provided will be added[\s\S]*?\n?/i, '').trim();
        action.description = filteredBody || userPrompt;
      }
    } else if (inferredType === 'create_power_system') {
      if (!action.name || action.name === 'Magic System' || action.name === 'New Magic System') {
        const nameMatch = rawContent.match(/(?:System Name|Magic System|Title|Name):\s*\*?\*?([A-Za-z0-9\s\(\)]+)\*?\*?/i) || userPrompt.match(/(?:named|called)\s+"?([A-Za-z0-9\s]+)"?/i);
        if (nameMatch && nameMatch[1].trim().length > 2) action.name = nameMatch[1].trim();
        else action.name = 'Magic & Power System';
      }
      if (!action.rules) {
        const filteredBody = cleanContent.replace(/^The content you provided will be added[\s\S]*?\n?/i, '').trim();
        action.rules = filteredBody || userPrompt;
      }
    }

    if (inferredType === 'create_character') {
      if (!action.name || action.name === 'Character Name' || action.name === 'New Character') {
        const nameMatch = rawContent.match(/(?:Name|Character):\s*\*?\*?([A-Za-z0-9\s]+)\*?\*?/i) || userPrompt.match(/(?:named|called)\s+"?([A-Z][a-z]+)"?/i);
        if (nameMatch) action.name = nameMatch[1].trim();
      }
    }

    action.type = inferredType;
    return action as NormalizedAiAction;
  };

  const normalizedActions: NormalizedAiAction[] = rawActions.map(normalizeSingleAction);

  // Fallback if no explicit JSON blocks were found in AI response
  if (normalizedActions.length === 0) {
    let fallbackAction: any = null;

    // Only fallback for explicit character/location creation if structured quotes are present in user prompt
    if (userLower.includes('character') && (userLower.includes('add') || userLower.includes('create'))) {
      const nameMatch = userPrompt.match(/(?:named|called)\s+"([A-Z][a-z]+)"/i);
      if (nameMatch) {
        fallbackAction = {
          type: 'create_character',
          name: nameMatch[1],
          role: 'Supporting',
          personality: 'Extracted from AI chat response',
          goals: userPrompt
        };
      }
    } else if (userLower.includes('location') && (userLower.includes('add') || userLower.includes('create'))) {
      const nameMatch = userPrompt.match(/(?:named|called)\s+"([A-Z][a-z]+)"/i);
      if (nameMatch) {
        fallbackAction = {
          type: 'create_location',
          name: nameMatch[1],
          description: 'Extracted from AI chat response'
        };
      }
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
