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
  appearance: string;
  personality: string;
  goals: string;
  fears: string;
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
  revealedInfo: string[];
  unresolvedQuestions: string[];
  emotionalChanges: string[];
  characterDevelopment: string[];
  timelineUpdates: string[];
  locationUpdates: string[];
  status: 'pending' | 'approved' | 'rejected';
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
  settings: {
    apiKey: string;
    model: string;
    provider: 'gemini' | 'openai' | 'openrouter';
    aiTemperature: number;
    typewriterMode: boolean;
    focusMode: boolean;
    splitView: boolean;
    genre?: string;
    description?: string;
    targetWordCount?: number;
  };
}
