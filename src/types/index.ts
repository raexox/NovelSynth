import type { ThemeId } from '../theme/themes';

export interface SceneMetadata {
  pov: string;
  date: string;
  time: string;
  location: string;
  characters: string[];
}

export interface Scene {
  id: string;
  chapterId: string;
  title: string;
  content: string;
  order: number;
  status: 'draft' | 'review' | 'finished';
  wordCount: number;
  lastSaved: string;
  metadata: SceneMetadata;
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
}

// Story Bible Types
export interface Character {
  id: string;
  name: string;
  age?: string;
  role?: string;
  appearance: string;
  personality: string;
  goals: string;
  fears: string;
  keyFacts?: string;
  continuityNotes?: string;
  relationships: string;
  abilities: string;
  speechStyle: string;
  history: string;
  injuries: string;
  secrets: string;
  developmentArc: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  culture: string;
  weather: string;
  history: string;
  landmarks: string;
  connectedLocations: string;
}

export interface Faction {
  id: string;
  name: string;
  leader: string;
  members: string;
  beliefs: string;
  allies: string;
  enemies: string;
  resources: string;
}

export interface PowerSystem {
  id: string;
  name: string;
  rules: string;
  limitations: string;
  costs: string;
  exceptions: string;
  examples: string;
}

export interface StoryBible {
  characters: Character[];
  locations: Location[];
  factions: Faction[];
  powerSystems: PowerSystem[];
}

export type BibleCategory = 'characters' | 'locations' | 'factions' | 'powerSystems';
export type ContinuityEntityType = 'character' | 'location' | 'faction' | 'powerSystem' | 'object' | 'timeline' | 'relationship';
export type ContinuityFactStatus = 'active' | 'superseded' | 'resolved' | 'contradicted';
export type ContinuityFactSource = 'memory' | 'bible_edit';

export interface ContinuityFact {
  id: string;
  bookId?: string;
  sceneId: string;
  chapterId: string;
  entityType: ContinuityEntityType;
  entityId?: string | null;
  entityName: string;
  factType: string;
  factText: string;
  status: ContinuityFactStatus;
  startsAtSceneId: string;
  endsAtSceneId?: string | null;
  source: ContinuityFactSource;
  createdAt: string;
}

export interface ProposedContinuityFact {
  entityType: ContinuityEntityType;
  entityId?: string | null;
  entityName: string;
  factType: string;
  factText: string;
  status?: ContinuityFactStatus;
}

export interface BibleItemVersion {
  id: string;
  bookId?: string;
  bibleItemId: string;
  category: BibleCategory;
  name: string;
  data: Record<string, any>;
  sourceSceneId?: string | null;
  reason: string;
  createdAt: string;
}

// Plot Threads
export interface PlotThread {
  id: string;
  title: string;
  description: string;
  type: 'mystery' | 'question' | 'foreshadow' | 'promise' | 'goal' | 'conflict';
  status: 'active' | 'resolved';
  startedInSceneId: string;
  resolvedInSceneId: string;
  notes: string;
}

// Version History
export interface VersionSnapshot {
  id: string;
  sceneId: string;
  timestamp: string;
  description: string;
  content: string;
}

// Notes Scrapbook
export interface Note {
  id: string;
  title: string;
  content: string;
  lastUpdated: string;
}

// Memory System
export interface MemoryUpdate {
  sceneId: string;
  summary: string;
  events: string[];
  newFacts: string[];
  proposedFacts?: ProposedContinuityFact[];
  revealedInfo: string[];
  unresolvedQuestions: string[];
  emotionalChanges: string[];
  characterDevelopment: string[];
  timelineUpdates: string[];
  locationUpdates: string[];
  status: 'pending' | 'approved' | 'rejected';
}

export interface ChapterMemory {
  chapterId: string;
  summary: string;
  keyMilestones: string[];
  characterArcs: string[];
  lastUpdated: string;
}

// Full Project State
export interface ProjectState {
  projectName: string;
  chapters: Chapter[];
  scenes: Scene[];
  storyBible: StoryBible;
  plotThreads: PlotThread[];
  snapshots: VersionSnapshot[];
  notes: Note[];
  memoryUpdates: MemoryUpdate[];
  chapterMemories?: ChapterMemory[];
  continuityFacts: ContinuityFact[];
  bibleItemVersions: BibleItemVersion[];
  settings: {
    apiKey: string;
    model: string;
    provider: 'gemini' | 'openai' | 'openrouter';
    aiTemperature: number;
    typewriterMode: boolean;
    focusMode: boolean;
    splitView: boolean;
    theme: ThemeId;
    genre?: string;
    description?: string;
    targetWordCount?: number;
    coverImageUrl?: string;
  };
}
