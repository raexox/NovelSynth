import React, { createContext, useContext, useState, useEffect } from 'react';
import type { 
  ProjectState, Chapter, Scene, PlotThread, VersionSnapshot, Note, MemoryUpdate, SceneMetadata 
} from '../types';

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
    model: "Gemini 3.5 Flash",
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
  };

  // AI Simulator Engines
  const runAIRevision = (mode: 'light' | 'style' | 'line' | 'dev') => {
    if (!activeSceneId) return;
    const scene = project.scenes.find(s => s.id === activeSceneId);
    if (!scene) return;

    setAiRunning(true);
    setRevisionSuggestions(null);

    setTimeout(() => {
      let revised = scene.content;
      let explanation = "";

      if (mode === 'light') {
        // Fix only spelling/grammar
        revised = scene.content
          .replace("Kaelen write a letter", "Kaelen wrote a letter")
          .replace("Wait, what if they search", "Wait, what if they search")
          .replace("swordsmanship , stealth", "swordsmanship, stealth")
          .replace("devoid of the warmth", "devoid of the warmth");
        explanation = "Light edit mode: Fixed minor punctuation spacing and resolved the subject-verb agreement issue without altering your voice.";
      } else if (mode === 'style') {
        // Style edits: rhythm & flow
        revised = scene.content
          .replace("The rain fell in sheets over the lower city, washing the grime of the blacksmith shops into the gutters.", "Rain sheeted over the lower city, washing charcoal dust and anvil grime straight into the overflowing gutters.")
          .replace("Wait, what if they search the canals? The Order controls the ports.", "But searching the canals remained a lethal risk. The Order held the locks tight.");
        explanation = "Style edit mode: Enhanced sensory details (charcoal dust, anvil grime) and elevated sentence structures for a punchier rhythm, while preserving Kaelen's anxiety.";
      } else if (mode === 'line') {
        // Line edit: polish prose, preserve voice
        revised = scene.content
          .replace("Wait, what if they search the canals? The Order controls the ports.", "And if they swept the canals? The Order held the locks like a vice. There would be no escape.")
          .replace("Kaelen pulled his hood lower, ducking into an alleyway", "Kaelen dragged his sodden wool hood down to his chin, pressing into the narrow throat of an alleyway");
        explanation = "Line edit mode: Tightened pacing by rendering actions with active verbs and intensifying the emotional stakes of the scene without introducing generic phrases.";
      } else {
        // Dev edit: suggestion only
        explanation = "Developmental Analysis:\n- **Pacing**: The scene is currently tense but brief. Expanding Kaelen's physical reaction to the rain can ground the reader in the environment.\n- **Tension**: High, but we need to see Mira's internal conflict. Consider showing her fingers twitching on the hilt of her sword.\n- **Sensory Details**: The smell of coal smoke, the clinking of steel plate in the distance, and the slick mud underfoot could enrich the setting.";
        revised = scene.content;
      }

      // Compute diff HTML simple simulation
      let diffHtml = "";
      if (revised === scene.content) {
        diffHtml = `<div class="diff-no-change">No textual edits suggested. Check the developmental feedback below.</div>`;
      } else {
        // Basic diff simulator (adds highlight classes)
        const wordsOrig = scene.content.split(' ');
        const wordsRev = revised.split(' ');
        let i = 0, j = 0;
        while (i < wordsOrig.length || j < wordsRev.length) {
          if (wordsOrig[i] === wordsRev[j]) {
            diffHtml += (wordsOrig[i] || '') + ' ';
            i++; j++;
          } else {
            // Found difference
            let origChunk = "";
            let revChunk = "";
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
      }

      setRevisionSuggestions({
        original: scene.content,
        revised,
        explanation,
        diffHtml
      });
      setAiRunning(false);
    }, 1000);
  };

  const runAIContinuityCheck = () => {
    if (!activeSceneId) return;
    const scene = project.scenes.find(s => s.id === activeSceneId);
    if (!scene) return;

    setAiRunning(true);
    setContinuityWarnings(null);

    setTimeout(() => {
      const warnings = [];
      const content = scene.content.toLowerCase();

      // Look for Kaelen name and Aether rules
      if (content.includes("kaelen") && content.includes("altar")) {
        // Suppose there is a contradiction in Scene 1
        if (scene.id === "sc-1" && scene.content.includes("creaked shut")) {
          // No warning, matching perfectly
        }
      }

      // Check for character appearance contradiction
      if (scene.id === "sc-2" && scene.content.includes("black hair")) {
        // Mira has black hair in bible. Perfect.
      }

      // Insert mock warning if user writes something contradicting the Story Bible
      if (content.includes("blond") && content.includes("mira")) {
        warnings.push({
          title: "Appearance Contradiction",
          content: "You described Mira with 'blond' hair in this scene, but her Story Bible profile states her hair is black.",
          severity: "medium" as const
        });
      }

      if (content.includes("sword") && content.includes("kaelen")) {
        warnings.push({
          title: "Ability Contradiction",
          content: "Kaelen is shown preparing for physical sword combat, but his Story Bible abilities list only Aether manipulation and script translation, explicitly stating he lacks martial training.",
          severity: "low" as const
        });
      }

      // Check if scene metadata location/characters mismatch content
      const missingChars = project.storyBible.characters
        .filter(c => content.includes(c.name.toLowerCase()) && !scene.metadata.characters.includes(c.name));
      if (missingChars.length > 0) {
        warnings.push({
          title: "Timeline Chronology & Presence",
          content: `Characters ${missingChars.map(c => c.name).join(', ')} appear in the dialogue/text, but are not registered in the Scene Metadata's present characters list. This can break downstream timeline tracking.`,
          severity: "medium" as const
        });
      }

      // Check for location weather conflicts
      if (scene.metadata.location === "The First Tower" && content.includes("sweltering desert heat")) {
        warnings.push({
          title: "Location Contradiction",
          content: "This scene mentions 'sweltering desert heat' in the First Tower, but the location profile describes it as 'perpetually cold with winds howling'.",
          severity: "high" as const
        });
      }

      if (warnings.length === 0) {
        warnings.push({
          title: "No Major Inconsistencies Found",
          content: "The scene aligns nicely with your Story Bible guidelines, active plot threads, and character details.",
          severity: "low" as const
        });
      }

      setContinuityWarnings(warnings);
      setAiRunning(false);
    }, 1200);
  };

  const runAIDialogueCheck = () => {
    if (!activeSceneId) return;
    const scene = project.scenes.find(s => s.id === activeSceneId);
    if (!scene) return;

    setAiRunning(true);
    setDialogueWarnings(null);

    setTimeout(() => {
      const warnings = [];
      const content = scene.content;

      // Scan dialogue quotes
      const quotes = content.match(/"([^"]*)"/g) || [];

      quotes.forEach(quote => {
        const text = quote.replace(/"/g, '').toLowerCase();
        
        // Mira is blunt. If she sounds too flowery:
        if (content.includes("Mira") && text.includes("perchance") || text.includes("exquisite")) {
          warnings.push({
            title: "Out-of-Character Vocabulary",
            quote,
            content: "Mira is speaking in a flowery, academic style. Her speech style in the Story Bible is described as 'blunt, short sentences, frequent use of military slang'."
          });
        }

        // Kaelen is formal. If he uses modern slang:
        if (text.includes("hey") || text.includes("what's up") || text.includes("cool")) {
          warnings.push({
            title: "Anachronistic / Informal Speech",
            quote,
            content: "Kaelen's dialogue uses modern slang. His profile states he uses a formal and precise speech style, and becomes hesitant when anxious."
          });
        }
      });

      if (warnings.length === 0) {
        warnings.push({
          title: "Dialogue Voice Preserved",
          quote: "All dialogue chunks analyzed.",
          content: "The vocabulary, emotional states, and relationships match the character profiles in the Story Bible."
        });
      }

      setDialogueWarnings(warnings);
      setAiRunning(false);
    }, 1000);
  };

  const runPacingAnalysis = () => {
    if (!activeSceneId) return;
    const scene = project.scenes.find(s => s.id === activeSceneId);
    if (!scene) return;

    setAiRunning(true);
    setTimeout(() => {
      const p = [];
      if (scene.wordCount < 150) {
        p.push("Pacing: Very Fast. This scene operates mostly as a quick dialogue exchange. Consider expanding on the environment and inner monologue to heighten the stakes.");
      } else {
        p.push("Pacing: Balanced. Good ratio of dialogue, action, and exposition.");
      }
      p.push("Sensory Balance: Sound (heavy doors creaking, wind howling) and Sight (moonlight shafts, dust dancing) are well represented. Consider adding touch (the freezing cold of the obsidian altar) or smell (old parchment, ozone).");
      setPacingSuggestions(p);
      setAiRunning(false);
    }, 800);
  };

  const runResearch = (query: string) => {
    if (!query) return;
    setAiRunning(true);
    setTimeout(() => {
      let results = "";
      const q = query.toLowerCase();
      if (q.includes("blacksmith") || q.includes("forge")) {
        results = "### Medieval Blacksmithing Reference\n\n* **Fuel**: Charcoal was primary (coal only later in the medieval period). Required constant bellows operation to maintain heat (approx. 1200°C to weld iron).\n* **Process**: Heating in the forge hearth, hammering on the anvil, re-heating. Quenching in water or oil to harden steel.\n* **Key Terms**: Tuyere (nozzle for bellows air), Slag (waste impurities), Scale (flaky iron oxide that flies off during hammering).";
      } else if (q.includes("canal") || q.includes("port")) {
        results = "### Canal Locks & Port Systems\n\n* **Locks**: Early locks were 'pound locks' consisting of wooden gates. Controlled by lockkeepers.\n* **Smuggling Tactics**: Concealed compartments in flat-bottomed barges, bribery of toll collectors, slipping through at high tide or under cover of fog.";
      } else {
        results = `### Quick Reference for "${query}"\n\nSimulated research retrieval: In medieval history, similar topics involved guild restrictions, specific resource management (rationing), and regional patrols. If you're building lore, consider detailing who collects the taxes or manages local transport routes.`;
      }
      setResearchResults(results);
      setAiRunning(false);
    }, 1000);
  };

  // Memory Generation when Scene is completed
  const triggerMemoryGeneration = (sceneId: string) => {
    const scene = project.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    const newMemory: MemoryUpdate = {
      sceneId,
      summary: `In the rainy lower city, Kaelen and Mira seek out an alleyway to avoid a Silver Order paladin patrol, discussing a smuggler's ship at the canal docks.`,
      events: [
        "Kaelen and Mira escape to the lower city slums.",
        "They evade a squad of Silver Order paladins marching in the rain.",
        "Kaelen explains their plan to meet a smuggler at midnight at the canal docks."
      ],
      newFacts: [
        "The Silver Order is searching the lower city for the stolen Aether Codex.",
        "A smuggler is waiting for them at midnight."
      ],
      revealedInfo: [
        "The Order controls the locks and ports, putting their escape plan at extreme risk."
      ],
      unresolvedQuestions: [
        "Will the smuggler stay true to his word?",
        "How will they bypass the Silver Order blockades at the canal gates?"
      ],
      emotionalChanges: [
        "Kaelen's fear increases as the net tightens. Mira remains pragmatic but tense."
      ],
      characterDevelopment: [
        "Mira shows increasing concern for Kaelen, highlighting her secret conflict."
      ],
      timelineUpdates: [
        "Scene set on 1245-10-13 at 21:30."
      ],
      locationUpdates: [
        "Lower City Slums profile holds notes on rain runoff from Academy spires."
      ],
      status: 'pending'
    };

    setPendingMemoryUpdate(newMemory);
  };

  const approveMemory = () => {
    if (!pendingMemoryUpdate) return;
    
    // Add memory to list
    setProject(prev => {
      // Create new memories list
      const approved = { ...pendingMemoryUpdate, status: 'approved' as const };
      const updatedMemories = [...prev.memoryUpdates.filter(m => m.sceneId !== approved.sceneId), approved];
      
      // Update character relationships/injuries if relevant in memory updates
      // This simulates updating the Story Bible automatically!
      const updatedCharacters = prev.storyBible.characters.map(char => {
        if (char.name === "Kaelen") {
          return {
            ...char,
            history: char.history + "\n- Evaded the Silver Order patrol in the lower city slums."
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
