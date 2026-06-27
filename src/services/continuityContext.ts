import type { ContinuityFact, MemoryUpdate, ProjectState, Scene } from '../types';

export interface BookContextForScene {
  facts: ContinuityFact[];
  memories: MemoryUpdate[];
  recentMemories: MemoryUpdate[];
  factsCount: number;
  memoriesCount: number;
  recentMemoryCount: number;
  summary: string;
}

const scenePosition = (project: ProjectState, sceneId: string) => {
  const scene = project.scenes.find(s => s.id === sceneId);
  if (!scene) return Number.MAX_SAFE_INTEGER;

  const chapter = project.chapters.find(c => c.id === scene.chapterId);
  const chapterOrder = chapter?.order ?? Number.MAX_SAFE_INTEGER;
  return chapterOrder * 100000 + scene.order;
};

export const sortScenesByBookOrder = (project: ProjectState) => {
  return [...project.scenes].sort((a, b) => scenePosition(project, a.id) - scenePosition(project, b.id));
};

export const isSceneAtOrBefore = (project: ProjectState, sceneId: string, targetSceneId: string) => {
  return scenePosition(project, sceneId) <= scenePosition(project, targetSceneId);
};

export const isSceneBefore = (project: ProjectState, sceneId: string, targetSceneId: string) => {
  return scenePosition(project, sceneId) < scenePosition(project, targetSceneId);
};

export const getActiveContinuityFactsForScene = (project: ProjectState, sceneId: string) => {
  return project.continuityFacts.filter(fact => {
    const startsAt = fact.startsAtSceneId || fact.sceneId;
    const hasStarted = startsAt ? isSceneAtOrBefore(project, startsAt, sceneId) : true;
    const hasEnded = fact.endsAtSceneId ? isSceneBefore(project, fact.endsAtSceneId, sceneId) : false;
    return hasStarted && !hasEnded && fact.status === 'active';
  });
};

export const getApprovedMemoriesBeforeScene = (project: ProjectState, sceneId: string) => {
  return project.memoryUpdates
    .filter(memory => memory.status === 'approved' && isSceneBefore(project, memory.sceneId, sceneId))
    .sort((a, b) => scenePosition(project, a.sceneId) - scenePosition(project, b.sceneId));
};

export const buildBookContextForScene = (project: ProjectState, scene: Scene): BookContextForScene => {
  const facts = getActiveContinuityFactsForScene(project, scene.id);
  const memories = getApprovedMemoriesBeforeScene(project, scene.id);
  const recentMemories = memories.slice(-5);

  const currentChapter = project.chapters.find(c => c.id === scene.chapterId);
  const priorChapterMemories = (project.chapterMemories || []).filter(cm => {
    const chap = project.chapters.find(c => c.id === cm.chapterId);
    return chap && currentChapter && chap.order < currentChapter.order;
  });

  const factLines = facts.slice(0, 80).map(fact => {
    const label = [fact.entityName, fact.factType].filter(Boolean).join(' / ');
    return `- ${label || fact.entityType}: ${fact.factText}`;
  });

  const chapterRecapLines = priorChapterMemories.map(cm => {
    const chap = project.chapters.find(c => c.id === cm.chapterId);
    return `[Chapter Recap: ${chap?.title || 'Prior Chapter'}] ${cm.summary}`;
  });

  const memoryLines = recentMemories.map(memory => {
    const sourceScene = project.scenes.find(s => s.id === memory.sceneId);
    return `- ${sourceScene?.title || 'Recent scene'}: ${memory.summary}`;
  });

  // Extract immediate preceding prose hand-off (last 350 words of active scene content)
  const words = (scene.content || '').split(/\s+/).filter(Boolean);
  const recentWords = words.slice(-350).join(' ');
  const proseHandOff = recentWords.length > 0 ? `=== IMMEDIATE PRECEDING PROSE (MATCH TONE & VOICE) ===\n"""\n... ${recentWords}\n"""` : '';

  // Smart Entity Spotlighting: prioritize active POV, location, and scene characters
  const activePov = (scene.metadata?.pov || '').toLowerCase();
  const activeLoc = (scene.metadata?.location || '').toLowerCase();
  const activeChars = (scene.metadata?.characters || []).map(c => c.toLowerCase());

  const spotlightedCharacters = project.storyBible.characters.filter(c => 
    c.name.toLowerCase() === activePov || activeChars.includes(c.name.toLowerCase())
  );
  const spotlightedLocations = project.storyBible.locations.filter(l => 
    l.name.toLowerCase() === activeLoc
  );

  const bibleSpotlightLines = [
    ...spotlightedCharacters.map(c => `- [Character Profile: ${c.name}] Role: ${c.role || 'N/A'}. Personality: ${c.personality || 'N/A'}. Goals: ${c.goals || 'N/A'}. Speech: ${c.speechStyle || 'N/A'}`),
    ...spotlightedLocations.map(l => `- [Location Profile: ${l.name}] Description: ${l.description || 'N/A'}. Weather/Atmosphere: ${l.weather || 'N/A'}`)
  ];

  return {
    facts,
    memories,
    recentMemories,
    factsCount: facts.length,
    memoriesCount: memories.length,
    recentMemoryCount: recentMemories.length,
    summary: [
      `Context mode: Optimized Book-Aware Hierarchical Engine.`,
      proseHandOff,
      bibleSpotlightLines.length ? `=== ACTIVE SCENE BIBLE SPOTLIGHT ===\n${bibleSpotlightLines.join('\n')}` : '',
      factLines.length ? `=== ACTIVE CONTINUITY FACTS (${facts.length}) ===\n${factLines.join('\n')}` : 'Continuity facts: none active yet.',
      chapterRecapLines.length ? `=== PRIOR CHAPTER RECAPS ===\n${chapterRecapLines.join('\n')}` : '',
      memoryLines.length ? `=== RECENT SCENE MEMORIES ===\n${memoryLines.join('\n')}` : 'Prior memory summaries: none approved yet.'
    ].filter(Boolean).join('\n\n')
  };
};

export const findBibleItemByEntity = (project: ProjectState, entityType: string, entityName: string) => {
  const normalizedName = entityName.trim().toLowerCase();
  if (!normalizedName) return null;

  const category =
    entityType === 'character' ? 'characters' :
    entityType === 'location' ? 'locations' :
    entityType === 'faction' ? 'factions' :
    entityType === 'powerSystem' ? 'powerSystems' :
    null;

  if (!category) return null;
  return project.storyBible[category].find((item: any) => item.name.toLowerCase() === normalizedName) || null;
};
