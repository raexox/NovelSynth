import React, { createContext, useContext, useState, useEffect } from 'react';
import type { 
  ProjectState, Chapter, Scene, PlotThread, VersionSnapshot, Note, MemoryUpdate, SceneMetadata 
} from '../types';
import { 
  getAIRevision, 
  getAIContinuityCheck, 
  getAIDialogueCheck, 
  getAIPacingAnalysis, 
  getAIResearch, 
  getAIMemoryGeneration 
} from '../services/aiService';

// Default Sample Data to wow the user out-of-the-box
const INITIAL_STATE: ProjectState = {
  projectName: "The Echoes of Aetheria",
  chapters: [
    { id: "ch-1", title: "Chapter 1: The Whispering Tower", order: 1 },
    { id: "ch-2", title: "Chapter 2: Silver and Iron", order: 2 },
    { id: "ch-3", title: "Chapter 3: The Price of Power", order: 3 }
  ],
  scenes: [
    {
      id: "sc-1",
      chapterId: "ch-1",
      title: "Opening the Grimoire",
      content: `The heavy oak doors of the First Tower creaked shut, sealing Kaelen inside. Dust danced in the shafts of moonlight that pierced the high arched windows. 

He clutched the silver amulet at his chest. His hands were trembling, not from the chill wind that howled through the stone battlements, but from the weight of the book in his satchel. It was the Aether Codex. If the Silver Order discovered he had taken it, his life would be forfeit.

Kaelen placed the book on the obsidian altar. He ran his hand over the gold engravings. "I must find the truth," he whispered. "Before they find me."`,
      order: 1,
      status: "finished",
      wordCount: 112,
      lastSaved: new Date().toISOString(),
      metadata: {
        pov: "Kaelen",
        date: "1245-10-12",
        time: "23:00",
        location: "The First Tower",
        characters: ["Kaelen"]
      }
    },
    {
      id: "sc-2",
      chapterId: "ch-1",
      title: "Mira's Warning",
      content: `Mira stepped from the shadows of the pillar. Her black hair was pulled back tightly, framing eyes that had seen too much war.

"You shouldn't have come here, Kaelen," she said. Her voice was flat, devoid of the warmth they had shared as children.

"I had no choice, Mira," Kaelen replied. "The Archmage is lying to us. The power isn't fading—it's being hoarded."

Mira looked at the altar. "If you open that book, you trigger the alarm. The Silver Order will be here in minutes. Even my sword cannot protect you from ten paladins."`,
      order: 2,
      status: "finished",
      wordCount: 105,
      lastSaved: new Date().toISOString(),
      metadata: {
        pov: "Kaelen",
        date: "1245-10-12",
        time: "23:15",
        location: "The First Tower",
        characters: ["Kaelen", "Mira"]
      }
    },
    {
      id: "sc-3",
      chapterId: "ch-2",
      title: "The Silver Patrol",
      content: `The rain fell in sheets over the lower city, washing the grime of the blacksmith shops into the gutters. Kaelen pulled his hood lower, ducking into an alleyway as a squad of Silver Order paladins marched past, their armor gleaming despite the storm.

"They're looking for the book," Mira murmured, pressing her back against the brick wall. Her hand rested on the pommel of her rapier.

"We need to get to the canal docks," Kaelen said. "The smuggler said he'd wait until midnight."

Wait, what if they search the canals? The Order controls the ports.`,
      order: 1,
      status: "draft",
      wordCount: 98,
      lastSaved: new Date().toISOString(),
      metadata: {
        pov: "Mira",
        date: "1245-10-13",
        time: "21:30",
        location: "Lower City Slums",
        characters: ["Kaelen", "Mira"]
      }
    }
  ],
  storyBible: {
    characters: [
      {
        id: "char-1",
        name: "Kaelen",
        appearance: "Lean, silver hair (formerly black before the Aether surge), stormy grey eyes, wears faded blue robes.",
        personality: "Obsessive, studious, cautious but driven by a deep need for answers. Terrified of failing.",
        goals: "To translate the Aether Codex and discover the truth behind the Great Depletion.",
        fears: "Being consumed by Aether madness; captured by the Silver Order.",
        relationships: "Mira (Childhood friend, now complicated protector), Archmage Eldrin (Mentor turned enemy).",
        abilities: "Aether manipulation, script translation, magical detection.",
        speechStyle: "Formal, precise, occasionally stuttering when anxious.",
        history: "Raised in the lower slums, taken in by the Academy when his magical potential manifested at age nine.",
        injuries: "Aether burns covering his right forearm, which he wraps in linen.",
        secrets: "He is actually the one who triggered the accident that burned the library six years ago.",
        developmentArc: "Must learn that knowledge without connection is empty, shifting from self-preservation to self-sacrifice."
      },
      {
        id: "char-2",
        name: "Mira",
        appearance: "Athletic build, black hair cropped short, sharp facial features, scar across her left cheek.",
        personality: "Pragmatic, cynical, fiercely loyal, hides her emotions behind sarcastic remarks.",
        goals: "To keep Kaelen alive and pay off her family's debt to the faction.",
        fears: "Losing Kaelen; returning to a life of mercenary work in the desert.",
        relationships: "Kaelen (Protected friend, unspoken bond), Silver Order (Former employers, now sworn enemies).",
        abilities: "Master swordsmanship, stealth, tracking, urban survival.",
        speechStyle: "Blunt, short sentences, frequent use of military slang.",
        history: "Served in the border guard before being dishonorably discharged for disobeying an order to execute prisoners.",
        injuries: "Old shoulder wound that stiffens in cold weather.",
        secrets: "She has been secretly feeding information to the Silver Order to keep them away from Kaelen.",
        developmentArc: "Will have to choose between her loyalty to Kaelen and the safety of her remaining family."
      }
    ],
    locations: [
      {
        id: "loc-1",
        name: "The First Tower",
        description: "The ancient stone observatory at the center of the Academy. Houses the forbidden archive.",
        culture: "Reserved for high-ranking scholars; atmosphere is quiet, tense, and smelling of old parchment.",
        weather: "Perpetually cold, winds howling around the spires.",
        history: "Built by the first Archmage over the Aether well, it has stood for four hundred years.",
        landmarks: "The Obsidian Altar, the Grand Astrolabe, the Whispering Archive.",
        connectedLocations: "Academy Grounds, The Lower City."
      },
      {
        id: "loc-2",
        name: "Lower City Slums",
        description: "The crowded, dirty streets beneath the Academy's floating spires. Densely populated.",
        culture: "Working-class laborers, smugglers, and outcasts. Lawless but with a strict code of survival.",
        weather: "Humid, smoky, subject to run-off rain from the upper city.",
        history: "Grew around the canal ports to serve the scholars above.",
        landmarks: "The Iron Docks, Blacksmith Alley, The Drowned Rat Tavern.",
        connectedLocations: "The Academy Gates, The Canals."
      }
    ],
    factions: [
      {
        id: "fac-1",
        name: "Silver Order",
        leader: "High Commander Valerius",
        members: "Knight-Inquisitors, Paladins, Wardens.",
        beliefs: "Magic must be strictly controlled, rationed, and guarded. Unregulated magic leads to Aether madness.",
        allies: "The Grand Academy, The Merchant Guild.",
        enemies: "The Aether Syndicate, outlaws, rogue mages.",
        resources: "Pure silver armor (magic-nullifying), state treasury, legal authority."
      }
    ],
    powerSystems: [
      {
        id: "pow-1",
        name: "Aether Magic",
        rules: "Aether is pulled from the atmosphere. It must pass through a living conduit to manifest as physical force.",
        limitations: "Conduits can only channel a set volume before their nervous system is damaged.",
        costs: "Severe exhaustion, nosebleeds, temporary blindness, and permanent scarring (Aether burns).",
        exceptions: "Ancient artifacts (like the Aether Codex) can channel magic without damaging the user, but require blood activation.",
        examples: "Lighting a flame, scanning magical threads, creating kinetic shockwaves."
      }
    ]
  },
  plotThreads: [
    {
      id: "pt-1",
      title: "Who caused the Great Depletion?",
      description: "The global supply of Aether is shrinking. The Academy blames rogue mages, but Kaelen suspects the Archmage is hoarding it.",
      type: "mystery",
      status: "active",
      startedInSceneId: "sc-1",
      resolvedInSceneId: "",
      notes: "The Codex is said to contain the original formulas of the Aether well."
    },
    {
      id: "pt-2",
      title: "Mira's Secret Deal",
      description: "Mira is secretly communicating with Valerius of the Silver Order to protect Kaelen from execution.",
      type: "promise",
      status: "active",
      startedInSceneId: "sc-2",
      resolvedInSceneId: "",
      notes: "Will Kaelen discover this? How will he react?"
    }
  ],
  snapshots: [
    {
      id: "snap-1",
      sceneId: "sc-1",
      timestamp: "2026-06-25T15:00:00.000Z",
      description: "Initial Draft of Scene 1",
      content: `The doors shut. Kaelen was inside the Tower. It was very dusty. Kaelen held his amulet. It was silver. He was scared because he took the book.
"I need to read this," he said.`
    }
  ],
  notes: [
    {
      id: "note-1",
      title: "Pacing Ideas",
      content: "Ensure Chapter 2 moves faster than Chapter 1. Introduce the smuggler Jax in Chapter 3.",
      lastUpdated: new Date().toISOString()
    }
  ],
  memoryUpdates: [
    {
      sceneId: "sc-1",
      summary: "Kaelen sneaks into the First Tower with the stolen Aether Codex and places it on the obsidian altar, fearing discovery by the Silver Order.",
      events: ["Kaelen enters the First Tower archive.", "He places the Aether Codex on the altar.", "He resolves to find the truth."],
      newFacts: ["Kaelen stole the Aether Codex from the Silver Order.", "The Codex is engraved in gold."],
      revealedInfo: ["Kaelen stole the book to discover the truth before being caught."],
      unresolvedQuestions: ["What lies inside the Aether Codex?", "How will the Academy react to its theft?"],
      emotionalChanges: ["Kaelen is terrified but determined."],
      characterDevelopment: ["Kaelen takes his first active step of rebellion against the Academy."],
      timelineUpdates: ["Set on 1245-10-12 at 23:00."],
      locationUpdates: ["Set in The First Tower observatory."],
      status: "approved"
    }
  ],
  settings: {
    apiKey: "",
    model: "gemini-1.5-flash",
    provider: "gemini",
    aiTemperature: 0.7,
    typewriterMode: false,
    focusMode: false,
    splitView: false
  }
};

// Interface for context state
interface StoreContextType {
  project: ProjectState;
  activeSceneId: string | null;
  activeLeftTab: string;
  activeRightTab: string;
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  activeBibleCategory: 'characters' | 'locations' | 'factions' | 'powerSystems';
  activeBibleItemId: string | null;
  
  // AI States
  aiRunning: boolean;
  revisionSuggestions: { original: string; revised: string; explanation: string; diffHtml: string } | null;
  continuityWarnings: Array<{ title: string; content: string; severity: 'low' | 'medium' | 'high' }> | null;
  dialogueWarnings: Array<{ title: string; content: string; quote: string }> | null;
  activeContexts: string[];
  pacingSuggestions: string[] | null;
  researchResults: string | null;
  pendingMemoryUpdate: MemoryUpdate | null;
  aiError: string | null;
  clearAIError: () => void;

  // Actions
  updateSceneContent: (id: string, content: string) => void;
  selectScene: (id: string) => void;
  addChapter: (title: string) => void;
  addScene: (chapterId: string, title: string) => void;
  deleteScene: (id: string) => void;
  deleteChapter: (id: string) => void;
  updateSceneMetadata: (id: string, metadata: Partial<SceneMetadata>) => void;
  setLeftTab: (tab: string) => void;
  setRightTab: (tab: string) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setBibleCategory: (cat: 'characters' | 'locations' | 'factions' | 'powerSystems') => void;
  setBibleItemId: (id: string | null) => void;
  updateBibleItem: (category: 'characters' | 'locations' | 'factions' | 'powerSystems', item: any) => void;
  addBibleItem: (category: 'characters' | 'locations' | 'factions' | 'powerSystems', item: any) => void;
  deleteBibleItem: (category: 'characters' | 'locations' | 'factions' | 'powerSystems', id: string) => void;
  addPlotThread: (thread: Partial<PlotThread>) => void;
  updatePlotThread: (thread: PlotThread) => void;
  addNote: (title: string, content: string) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  
  // AI Commands
  runAIRevision: (mode: 'light' | 'style' | 'line' | 'dev') => void;
  runAIContinuityCheck: () => void;
  runAIDialogueCheck: () => void;
  runPacingAnalysis: () => void;
  runResearch: (query: string) => void;
  approveMemory: () => void;
  rejectMemory: () => void;
  triggerMemoryGeneration: (sceneId: string) => void;
  clearAISuggestions: () => void;

  // Snapshots
  takeSnapshot: (description: string) => void;
  restoreSnapshot: (id: string) => void;
  
  // Export/Import
  exportProject: () => void;
  importProject: (data: string) => void;
  updateSettings: (settings: Partial<ProjectState['settings']>) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [project, setProject] = useState<ProjectState>(() => {
    const saved = localStorage.getItem('novelsynth_project');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });
  const [activeSceneId, setActiveSceneId] = useState<string | null>(() => {
    return INITIAL_STATE.scenes[2].id; // Default to scene 3 which is in draft
  });
  const [activeLeftTab, setActiveLeftTab] = useState<string>('novel');
  const [activeRightTab, setActiveRightTab] = useState<string>('revision');
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [activeBibleCategory, setActiveBibleCategory] = useState<'characters' | 'locations' | 'factions' | 'powerSystems'>('characters');
  const [activeBibleItemId, setBibleItemId] = useState<string | null>(null);

  // AI & Analysis States
  const [aiRunning, setAiRunning] = useState(false);
  const [revisionSuggestions, setRevisionSuggestions] = useState<StoreContextType['revisionSuggestions']>(null);
  const [continuityWarnings, setContinuityWarnings] = useState<StoreContextType['continuityWarnings']>(null);
  const [dialogueWarnings, setDialogueWarnings] = useState<StoreContextType['dialogueWarnings']>(null);
  const [pacingSuggestions, setPacingSuggestions] = useState<string[] | null>(null);
  const [researchResults, setResearchResults] = useState<string | null>(null);
  const [activeContexts, setActiveContexts] = useState<string[]>([]);
  const [pendingMemoryUpdate, setPendingMemoryUpdate] = useState<MemoryUpdate | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const clearAIError = () => setAiError(null);

  // Auto-Save
  useEffect(() => {
    localStorage.setItem('novelsynth_project', JSON.stringify(project));
  }, [project]);

  // Load Active Contexts based on characters and locations mentioned in active scene
  useEffect(() => {
    if (!activeSceneId) {
      setActiveContexts([]);
      return;
    }
    const scene = project.scenes.find(s => s.id === activeSceneId);
    if (!scene) return;
    
    const contexts: string[] = [];
    contexts.push(`Current Scene: "${scene.title}" Metadata`);
    
    // Scan characters present
    scene.metadata.characters.forEach(charName => {
      const char = project.storyBible.characters.find(c => c.name.toLowerCase() === charName.toLowerCase());
      if (char) contexts.push(`Character Profile: ${char.name}`);
    });

    // Scan location
    const loc = project.storyBible.locations.find(l => l.name.toLowerCase() === scene.metadata.location.toLowerCase());
    if (loc) contexts.push(`Location Profile: ${loc.name}`);

    // Scan magic rules if mentioned
    if (scene.content.toLowerCase().includes('magic') || scene.content.toLowerCase().includes('aether')) {
      project.storyBible.powerSystems.forEach(sys => {
        contexts.push(`Magic System: ${sys.name}`);
      });
    }
    
    // Add active plot threads
    project.plotThreads.forEach(t => {
      if (t.status === 'active') {
        contexts.push(`Active Plot Thread: ${t.title}`);
      }
    });

    setActiveContexts(contexts);
  }, [activeSceneId, project.scenes, project.storyBible, project.plotThreads]);

  const selectScene = (id: string) => {
    setActiveSceneId(id);
    clearAISuggestions();
  };

  const updateSceneContent = (id: string, content: string) => {
    setProject(prev => {
      const updatedScenes = prev.scenes.map(s => {
        if (s.id === id) {
          return {
            ...s,
            content,
            wordCount: content.split(/\s+/).filter(Boolean).length,
            lastSaved: new Date().toISOString()
          };
        }
        return s;
      });
      return { ...prev, scenes: updatedScenes };
    });
  };

  const addChapter = (title: string) => {
    setProject(prev => {
      const newCh: Chapter = {
        id: `ch-${Date.now()}`,
        title,
        order: prev.chapters.length + 1
      };
      return {
        ...prev,
        chapters: [...prev.chapters, newCh]
      };
    });
  };

  const addScene = (chapterId: string, title: string) => {
    const id = `sc-${Date.now()}`;
    setProject(prev => {
      const chapterScenes = prev.scenes.filter(s => s.chapterId === chapterId);
      const newSc: Scene = {
        id,
        chapterId,
        title,
        content: `Start writing your new scene...`,
        order: chapterScenes.length + 1,
        status: 'draft',
        wordCount: 5,
        lastSaved: new Date().toISOString(),
        metadata: {
          pov: prev.storyBible.characters[0]?.name || "Author",
          date: new Date().toISOString().split('T')[0],
          time: "12:00",
          location: prev.storyBible.locations[0]?.name || "Default Location",
          characters: []
        }
      };
      return {
        ...prev,
        scenes: [...prev.scenes, newSc]
      };
    });
    setActiveSceneId(id);
  };

  const deleteScene = (id: string) => {
    setProject(prev => ({
      ...prev,
      scenes: prev.scenes.filter(s => s.id !== id)
    }));
    if (activeSceneId === id) {
      setActiveSceneId(null);
    }
  };

  const deleteChapter = (id: string) => {
    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.filter(c => c.id !== id),
      scenes: prev.scenes.filter(s => s.chapterId !== id)
    }));
    if (project.scenes.find(s => s.chapterId === id)?.id === activeSceneId) {
      setActiveSceneId(null);
    }
  };

  const updateSceneMetadata = (id: string, metadata: Partial<SceneMetadata>) => {
    setProject(prev => {
      const updated = prev.scenes.map(s => {
        if (s.id === id) {
          return {
            ...s,
            metadata: { ...s.metadata, ...metadata }
          };
        }
        return s;
      });
      return { ...prev, scenes: updated };
    });
  };

  const setLeftTab = (tab: string) => setActiveLeftTab(tab);
  const setRightTab = (tab: string) => setActiveRightTab(tab);
  const toggleLeftSidebar = () => setIsLeftSidebarOpen(!isLeftSidebarOpen);
  const toggleRightSidebar = () => setIsRightSidebarOpen(!isRightSidebarOpen);
  const setBibleCategory = (cat: 'characters' | 'locations' | 'factions' | 'powerSystems') => {
    setActiveBibleCategory(cat);
    setBibleItemId(null);
  };

  const updateBibleItem = (category: 'characters' | 'locations' | 'factions' | 'powerSystems', item: any) => {
    setProject(prev => {
      const updatedCategory = (prev.storyBible[category] as any[]).map((i: any) => i.id === item.id ? item : i);
      return {
        ...prev,
        storyBible: {
          ...prev.storyBible,
          [category]: updatedCategory
        }
      };
    });
  };

  const addBibleItem = (category: 'characters' | 'locations' | 'factions' | 'powerSystems', item: any) => {
    const newItem = { ...item, id: `${category.substring(0, 4)}-${Date.now()}` };
    setProject(prev => ({
      ...prev,
      storyBible: {
        ...prev.storyBible,
        [category]: [...prev.storyBible[category], newItem]
      }
    }));
    setBibleItemId(newItem.id);
  };

  const deleteBibleItem = (category: 'characters' | 'locations' | 'factions' | 'powerSystems', id: string) => {
    setProject(prev => ({
      ...prev,
      storyBible: {
        ...prev.storyBible,
        [category]: (prev.storyBible[category] as any[]).filter((i: any) => i.id !== id)
      }
    }));
    if (activeBibleItemId === id) {
      setBibleItemId(null);
    }
  };

  const addPlotThread = (thread: Partial<PlotThread>) => {
    const newThread: PlotThread = {
      id: `pt-${Date.now()}`,
      title: thread.title || "New Plot Thread",
      description: thread.description || "",
      type: thread.type || "mystery",
      status: thread.status || "active",
      startedInSceneId: activeSceneId || "",
      resolvedInSceneId: thread.resolvedInSceneId || "",
      notes: thread.notes || ""
    };
    setProject(prev => ({
      ...prev,
      plotThreads: [...prev.plotThreads, newThread]
    }));
  };

  const updatePlotThread = (thread: PlotThread) => {
    setProject(prev => ({
      ...prev,
      plotThreads: prev.plotThreads.map(t => t.id === thread.id ? thread : t)
    }));
  };

  const addNote = (title: string, content: string) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title,
      content,
      lastUpdated: new Date().toISOString()
    };
    setProject(prev => ({
      ...prev,
      notes: [...prev.notes, newNote]
    }));
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setProject(prev => ({
      ...prev,
      notes: prev.notes.map(n => n.id === id ? { ...n, ...updates, lastUpdated: new Date().toISOString() } : n)
    }));
  };

  const deleteNote = (id: string) => {
    setProject(prev => ({
      ...prev,
      notes: prev.notes.filter(n => n.id !== id)
    }));
  };

  const clearAISuggestions = () => {
    setRevisionSuggestions(null);
    setContinuityWarnings(null);
    setDialogueWarnings(null);
    setPacingSuggestions(null);
    setResearchResults(null);
    setPendingMemoryUpdate(null);
    setAiError(null);
  };

  // AI Service Integrations (calling aiService.ts)
  const runAIRevision = async (mode: 'light' | 'style' | 'line' | 'dev') => {
    if (!activeSceneId) return;
    const scene = project.scenes.find(s => s.id === activeSceneId);
    if (!scene) return;

    setAiRunning(true);
    setRevisionSuggestions(null);
    setAiError(null);

    try {
      const res = await getAIRevision(scene.content, mode, project.settings);
      setRevisionSuggestions({
        ...res,
        original: scene.content
      });
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate AI revision suggestions.');
    } finally {
      setAiRunning(false);
    }
  };

  const runAIContinuityCheck = async () => {
    if (!activeSceneId) return;
    const scene = project.scenes.find(s => s.id === activeSceneId);
    if (!scene) return;

    setAiRunning(true);
    setContinuityWarnings(null);
    setAiError(null);

    try {
      const warnings = await getAIContinuityCheck(scene.content, project.storyBible, scene.metadata, project.settings);
      if (warnings.length === 0) {
        setContinuityWarnings([
          {
            title: 'No Major Inconsistencies Found',
            content: 'The scene aligns nicely with your Story Bible guidelines, active plot threads, and character details.',
            severity: 'low'
          }
        ]);
      } else {
        setContinuityWarnings(warnings);
      }
    } catch (err: any) {
      setAiError(err.message || 'Failed to run continuity check.');
    } finally {
      setAiRunning(false);
    }
  };

  const runAIDialogueCheck = async () => {
    if (!activeSceneId) return;
    const scene = project.scenes.find(s => s.id === activeSceneId);
    if (!scene) return;

    setAiRunning(true);
    setDialogueWarnings(null);
    setAiError(null);

    try {
      const warnings = await getAIDialogueCheck(scene.content, project.storyBible, project.settings);
      if (warnings.length === 0) {
        setDialogueWarnings([
          {
            title: 'Dialogue Voice Preserved',
            quote: 'All dialogue chunks analyzed.',
            content: 'The vocabulary, emotional states, and relationships match the character profiles in the Story Bible.'
          }
        ]);
      } else {
        setDialogueWarnings(warnings);
      }
    } catch (err: any) {
      setAiError(err.message || 'Failed to run dialogue voice check.');
    } finally {
      setAiRunning(false);
    }
  };

  const runPacingAnalysis = async () => {
    if (!activeSceneId) return;
    const scene = project.scenes.find(s => s.id === activeSceneId);
    if (!scene) return;

    setAiRunning(true);
    setPacingSuggestions(null);
    setAiError(null);

    try {
      const suggestions = await getAIPacingAnalysis(scene.content, project.settings);
      setPacingSuggestions(suggestions);
    } catch (err: any) {
      setAiError(err.message || 'Failed to analyze pacing.');
    } finally {
      setAiRunning(false);
    }
  };

  const runResearch = async (query: string) => {
    if (!query) return;
    setAiRunning(true);
    setResearchResults(null);
    setAiError(null);

    try {
      const results = await getAIResearch(query, project.settings);
      setResearchResults(results);
    } catch (err: any) {
      setAiError(err.message || 'Failed to fetch research results.');
    } finally {
      setAiRunning(false);
    }
  };

  const triggerMemoryGeneration = async (sceneId: string) => {
    const scene = project.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    setAiRunning(true);
    setPendingMemoryUpdate(null);
    setAiError(null);

    try {
      const memory = await getAIMemoryGeneration(scene.content, scene.metadata, project.settings);
      setPendingMemoryUpdate({
        ...memory,
        sceneId,
        status: 'pending'
      });
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate scene memory card.');
    } finally {
      setAiRunning(false);
    }
  };

  const approveMemory = () => {
    if (!pendingMemoryUpdate) return;
    
    setProject(prev => {
      const approved = { ...pendingMemoryUpdate, status: 'approved' as const };
      const updatedMemories = [...prev.memoryUpdates.filter(m => m.sceneId !== approved.sceneId), approved];
      
      const scene = prev.scenes.find(s => s.id === approved.sceneId);
      const povCharName = scene?.metadata.pov || '';
      
      const updatedCharacters = prev.storyBible.characters.map(char => {
        if (char.name.toLowerCase() === povCharName.toLowerCase()) {
          return {
            ...char,
            history: char.history + `\n- Scene "${scene?.title}" Memory Summary: ${approved.summary}`
          };
        }
        return char;
      });

      return {
        ...prev,
        memoryUpdates: updatedMemories,
        storyBible: {
          ...prev.storyBible,
          characters: updatedCharacters
        }
      };
    });
    setPendingMemoryUpdate(null);
  };

  const rejectMemory = () => {
    setPendingMemoryUpdate(null);
  };

  // Version Snapshots
  const takeSnapshot = (description: string) => {
    if (!activeSceneId) return;
    const scene = project.scenes.find(s => s.id === activeSceneId);
    if (!scene) return;

    const newSnapshot: VersionSnapshot = {
      id: `snap-${Date.now()}`,
      sceneId: activeSceneId,
      timestamp: new Date().toISOString(),
      description,
      content: scene.content
    };

    setProject(prev => ({
      ...prev,
      snapshots: [newSnapshot, ...prev.snapshots]
    }));
  };

  const restoreSnapshot = (id: string) => {
    const snapshot = project.snapshots.find(s => s.id === id);
    if (!snapshot) return;

    setProject(prev => {
      const updated = prev.scenes.map(s => {
        if (s.id === snapshot.sceneId) {
          return {
            ...s,
            content: snapshot.content,
            wordCount: snapshot.content.split(/\s+/).filter(Boolean).length,
            lastSaved: new Date().toISOString()
          };
        }
        return s;
      });
      return { ...prev, scenes: updated };
    });
  };

  // Import / Export
  const exportProject = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${project.projectName.toLowerCase().replace(/\s+/g, '_')}_project.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importProject = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.projectName && parsed.scenes) {
        setProject(parsed);
        if (parsed.scenes.length > 0) {
          setActiveSceneId(parsed.scenes[0].id);
        }
      } else {
        alert("Invalid project format!");
      }
    } catch (e) {
      alert("Failed to parse project JSON.");
    }
  };

  const updateSettings = (newSettings: Partial<ProjectState['settings']>) => {
    setProject(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  };

  return (
    <StoreContext.Provider value={{
      project,
      activeSceneId,
      activeLeftTab,
      activeRightTab,
      isLeftSidebarOpen,
      isRightSidebarOpen,
      activeBibleCategory,
      activeBibleItemId,
      
      aiRunning,
      revisionSuggestions,
      continuityWarnings,
      dialogueWarnings,
      activeContexts,
      pacingSuggestions,
      researchResults,
      pendingMemoryUpdate,
      aiError,
      clearAIError,

      updateSceneContent,
      selectScene,
      addChapter,
      addScene,
      deleteScene,
      deleteChapter,
      updateSceneMetadata,
      setLeftTab,
      setRightTab,
      toggleLeftSidebar,
      toggleRightSidebar,
      setBibleCategory,
      setBibleItemId,
      updateBibleItem,
      addBibleItem,
      deleteBibleItem,
      addPlotThread,
      updatePlotThread,
      addNote,
      updateNote,
      deleteNote,
      
      runAIRevision,
      runAIContinuityCheck,
      runAIDialogueCheck,
      runPacingAnalysis,
      runResearch,
      approveMemory,
      rejectMemory,
      triggerMemoryGeneration,
      clearAISuggestions,

      takeSnapshot,
      restoreSnapshot,
      exportProject,
      importProject,
      updateSettings
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
