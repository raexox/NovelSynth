import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { 
  BookOpen, Compass, Plus, Trash2, Calendar, 
  GitCommit, Book, ChevronRight, ChevronDown,
  User, Clock, MapPin, Search, ArrowRight, RotateCcw, AlertTriangle,
  Users, Sparkles, FileText
} from 'lucide-react';
import type { Character, Location, Faction, PowerSystem } from '../types';

interface SearchResult {
  id: string;
  type: 'scene' | 'character' | 'location' | 'thread';
  title: string;
  snippet: string;
  sceneId?: string;
}

export const LeftSidebar: React.FC = () => {
  const {
    project,
    activeSceneId,
    activeLeftTab,
    activeBibleCategory,
    activeBibleItemId,
    selectScene,
    addChapter,
    addScene,
    deleteScene,
    deleteChapter,
    updateSceneMetadata,
    setLeftTab,
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
    takeSnapshot,
    restoreSnapshot
  } = useStore();

  // Local State: Chapter outline expansion
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    'ch-1': true,
    'ch-2': true,
    'ch-3': true
  });
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [showAddChapter, setShowAddChapter] = useState(false);

  // Local State: Collapsible sections in Manuscript
  const [outlineExpanded, setOutlineExpanded] = useState(true);
  const [propertiesExpanded, setPropertiesExpanded] = useState(true);
  const [snapshotsExpanded, setSnapshotsExpanded] = useState(false);
  const [conflictsExpanded, setConflictsExpanded] = useState(true);

  // Local State: Version History (Snapshots)
  const [snapshotDesc, setSnapshotDesc] = useState('');
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);

  // Local State: Scrapbook Notes active view
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Local State: Search Panel
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  const activeScene = project.scenes.find(s => s.id === activeSceneId);
  const activeSnapshots = project.snapshots.filter(snap => snap.sceneId === activeSceneId);
  const selectedSnapshot = project.snapshots.find(snap => snap.id === selectedSnapshotId);

  // Automatically expand snapshots section if user clicks History Snapshot in the header
  useEffect(() => {
    if (activeLeftTab === 'history') {
      setSnapshotsExpanded(true);
    }
  }, [activeLeftTab]);

  // Toggle chapter expansion
  const toggleChapterExpand = (chId: string) => {
    setExpandedChapters(prev => ({ ...prev, [chId]: !prev[chId] }));
  };

  const handleAddChapterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;
    addChapter(newChapterTitle);
    setNewChapterTitle('');
    setShowAddChapter(false);
  };

  // Timeline Conflict Analysis
  const getTimelineErrors = () => {
    const sortedScenes = [...project.scenes].sort((a, b) => {
      const chA = project.chapters.find(c => c.id === a.chapterId);
      const chB = project.chapters.find(c => c.id === b.chapterId);
      if (!chA || !chB) return 0;
      if (chA.order !== chB.order) return chA.order - chB.order;
      return a.order - b.order;
    });

    const errors: string[] = [];

    // 1. Check Date Chronology
    for (let i = 1; i < sortedScenes.length; i++) {
      const prev = sortedScenes[i - 1];
      const curr = sortedScenes[i];
      if (prev.metadata.date && curr.metadata.date) {
        if (curr.metadata.date < prev.metadata.date) {
          errors.push(`Scene "${curr.title}" (set on ${curr.metadata.date}) is placed after "${prev.title}" (set on ${prev.metadata.date}) in the manuscript, but occurs earlier in time.`);
        }
      }
    }

    // 2. Check Character Teleportation
    for (let i = 0; i < sortedScenes.length; i++) {
      for (let j = i + 1; j < sortedScenes.length; j++) {
        const s1 = sortedScenes[i];
        const s2 = sortedScenes[j];
        if (s1.metadata.date === s2.metadata.date && s1.metadata.time === s2.metadata.time && s1.metadata.location !== s2.metadata.location) {
          const overlappingChars = s1.metadata.characters.filter(c => s2.metadata.characters.includes(c));
          if (overlappingChars.length > 0) {
            errors.push(`${overlappingChars.join(', ')} registered in both "${s1.title}" (at ${s1.metadata.location}) and "${s2.title}" (at ${s2.metadata.location}) at exactly ${s1.metadata.date} ${s1.metadata.time}.`);
          }
        }
      }
    }

    return errors;
  };

  const timelineErrors = getTimelineErrors();

  // Search Logic
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearched(false);
      return;
    }

    const q = searchQuery.toLowerCase();
    const matches: SearchResult[] = [];

    // Search Scenes
    project.scenes.forEach(sc => {
      const idx = sc.content.toLowerCase().indexOf(q);
      if (idx !== -1 || sc.title.toLowerCase().includes(q)) {
        const start = Math.max(0, idx - 40);
        const end = Math.min(sc.content.length, idx + q.length + 60);
        let snippet = sc.content.substring(start, end).replace(/\n/g, ' ');
        if (start > 0) snippet = '...' + snippet;
        if (end < sc.content.length) snippet = snippet + '...';

        matches.push({
          id: sc.id,
          type: 'scene',
          title: sc.title,
          snippet: snippet || sc.content.substring(0, 100) + '...',
          sceneId: sc.id
        });
      }
    });

    // Search Characters
    project.storyBible.characters.forEach(c => {
      const allText = `${c.name} ${c.appearance} ${c.personality} ${c.goals} ${c.fears} ${c.history} ${c.secrets}`.toLowerCase();
      if (allText.includes(q)) {
        matches.push({
          id: c.id,
          type: 'character',
          title: `Bible: Character - ${c.name}`,
          snippet: `Found in character profile. Goals: ${c.goals.substring(0, 80)}...`
        });
      }
    });

    // Search Locations
    project.storyBible.locations.forEach(l => {
      const allText = `${l.name} ${l.description} ${l.culture} ${l.history} ${l.landmarks}`.toLowerCase();
      if (allText.includes(q)) {
        matches.push({
          id: l.id,
          type: 'location',
          title: `Bible: Location - ${l.name}`,
          snippet: `Found in location details. Landmarks: ${l.landmarks}`
        });
      }
    });

    // Search Plot Threads
    project.plotThreads.forEach(t => {
      const allText = `${t.title} ${t.description} ${t.notes}`.toLowerCase();
      if (allText.includes(q)) {
        matches.push({
          id: t.id,
          type: 'thread',
          title: `Plot Thread: ${t.title}`,
          snippet: t.description
        });
      }
    });

    // Semantic Matches
    if (q.includes("mira first appear") || q.includes("where did mira")) {
      const sc = project.scenes.find(s => s.id === "sc-2");
      if (sc && !matches.find(m => m.id === sc.id)) {
        matches.unshift({
          id: sc.id,
          type: 'scene',
          title: sc.title,
          snippet: "...Mira stepped from the shadows of the pillar. Her black hair was pulled back tightly...",
          sceneId: sc.id
        });
      }
    }
    
    if (q.includes("silver order")) {
      project.scenes.forEach(sc => {
        if (sc.content.toLowerCase().includes("silver order") && !matches.find(m => m.id === sc.id)) {
          matches.push({
            id: sc.id,
            type: 'scene',
            title: sc.title,
            snippet: sc.content.substring(sc.content.toLowerCase().indexOf("silver order") - 30, sc.content.toLowerCase().indexOf("silver order") + 70) + '...',
            sceneId: sc.id
          });
        }
      });
    }

    if (q.includes("first tower") || q.includes("reference to the first tower")) {
      const sc = project.scenes.find(s => s.id === "sc-1");
      if (sc && !matches.find(m => m.id === sc.id)) {
        matches.unshift({
          id: sc.id,
          type: 'scene',
          title: sc.title,
          snippet: "...The heavy oak doors of the First Tower creaked shut, sealing Kaelen inside...",
          sceneId: sc.id
        });
      }
    }

    if (q.includes("kael") && q.includes("memories")) {
      const sc = project.scenes.find(s => s.id === "sc-1");
      if (sc && !matches.find(m => m.id === sc.id)) {
        matches.unshift({
          id: sc.id,
          type: 'scene',
          title: sc.title,
          snippet: "...He clutched the silver amulet at his chest. His hands were trembling...",
          sceneId: sc.id
        });
      }
    }

    setSearchResults(matches);
    setSearched(true);
  };

  const handleSearchResultClick = (res: SearchResult) => {
    if (res.sceneId) {
      selectScene(res.sceneId);
    } else if (res.type === 'character' || res.type === 'location') {
      setLeftTab('bible');
      setBibleCategory(res.type === 'character' ? 'characters' : 'locations');
      setBibleItemId(res.id);
    } else if (res.type === 'thread') {
      setLeftTab('plots');
    }
  };

  // Snapshot Actions
  const handleTakeSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotDesc.trim() || !activeSceneId) return;
    takeSnapshot(snapshotDesc);
    setSnapshotDesc('');
  };

  const handleRestoreSnapshot = (snapId: string) => {
    if (confirm("Restore this snapshot? Your current scene text will be updated.")) {
      restoreSnapshot(snapId);
      setSelectedSnapshotId(null);
    }
  };

  // Check if current tab is Manuscript or Reference visually
  const isManuscriptTab = activeLeftTab === 'novel' || activeLeftTab === 'history';
  const isReferenceTab = activeLeftTab === 'bible' || activeLeftTab === 'plots' || activeLeftTab === 'notes' || activeLeftTab === 'search';

  return (
    <div className="sidebar-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Visual Top Tabs */}
      <div className="sidebar-tabs-pill-container" style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', background: 'var(--bg-primary)', padding: 3, borderRadius: 8, border: '1px solid var(--border-color)' }}>
          <button 
            type="button"
            className="sidebar-tab-pill-btn"
            style={{
              flex: 1,
              padding: '6px 8px',
              border: 'none',
              background: isManuscriptTab ? 'var(--bg-tertiary)' : 'none',
              color: isManuscriptTab ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderRadius: 6,
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
              boxShadow: isManuscriptTab ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
            }}
            onClick={() => setLeftTab('novel')}
          >
            <Book size={13} style={{ color: isManuscriptTab ? 'var(--accent-purple)' : 'inherit' }} />
            Manuscript
          </button>
          <button 
            type="button"
            className="sidebar-tab-pill-btn"
            style={{
              flex: 1,
              padding: '6px 8px',
              border: 'none',
              background: isReferenceTab ? 'var(--bg-tertiary)' : 'none',
              color: isReferenceTab ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderRadius: 6,
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
              boxShadow: isReferenceTab ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
            }}
            onClick={() => {
              if (activeLeftTab !== 'bible' && activeLeftTab !== 'plots' && activeLeftTab !== 'notes' && activeLeftTab !== 'search') {
                setLeftTab('bible');
              }
            }}
          >
            <Compass size={13} style={{ color: isReferenceTab ? 'var(--accent-purple)' : 'inherit' }} />
            Reference Library
          </button>
        </div>
      </div>

      <div className="sidebar-content" style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {/* ================= MANUSCRIPT OUTLINE TAB ================= */}
        {isManuscriptTab && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Outline Card */}
            <div className="sidebar-section-card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 6, overflow: 'hidden' }}>
              <div 
                className="sidebar-section-card-header"
                style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: outlineExpanded ? '1px solid var(--border-color)' : 'none', backgroundColor: 'var(--bg-secondary)' }}
                onClick={() => setOutlineExpanded(!outlineExpanded)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', fontWeight: 600, fontSize: 12 }}>
                  {outlineExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>MANUSCRIPT OUTLINE</span>
                </div>
                <button 
                  className="btn-icon" 
                  onClick={(e) => { e.stopPropagation(); setShowAddChapter(true); }}
                  title="Add Chapter"
                  style={{ padding: 2 }}
                >
                  <Plus size={14} />
                </button>
              </div>

              {outlineExpanded && (
                <div style={{ padding: 10 }}>
                  {showAddChapter && (
                    <form onSubmit={handleAddChapterSubmit} style={{ marginBottom: 12, display: 'flex', gap: 6 }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Chapter Title..." 
                        value={newChapterTitle} 
                        onChange={e => setNewChapterTitle(e.target.value)} 
                        autoFocus
                        style={{ fontSize: 12, padding: '4px 8px' }}
                      />
                      <button type="submit" className="btn btn-primary" style={{ padding: '4px 8px', fontSize: 11 }}>Add</button>
                    </form>
                  )}

                  <div className="manuscript-tree">
                    {project.chapters
                      .sort((a, b) => a.order - b.order)
                      .map(ch => {
                        const chScenes = project.scenes
                          .filter(s => s.chapterId === ch.id)
                          .sort((a, b) => a.order - b.order);
                        const isExpanded = expandedChapters[ch.id];

                        return (
                          <div key={ch.id} style={{ marginBottom: 6 }}>
                            <div 
                              className="tree-item"
                              style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12.5 }}
                              onClick={() => toggleChapterExpand(ch.id)}
                            >
                              <span className="tree-item-title">
                                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                {ch.title}
                              </span>
                              <div className="tree-actions">
                                <button 
                                  className="btn-icon" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addScene(ch.id, `New Scene ${chScenes.length + 1}`);
                                  }}
                                  title="Add Scene"
                                >
                                  <Plus size={12} />
                                </button>
                                <button 
                                  className="btn-icon" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("Delete chapter and all its scenes?")) deleteChapter(ch.id);
                                  }}
                                  title="Delete Chapter"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div style={{ paddingLeft: 12, borderLeft: '1px solid var(--border-color)', marginLeft: 6, marginTop: 2 }}>
                                {chScenes.map(sc => (
                                  <div 
                                    key={sc.id} 
                                    className={`tree-item ${activeSceneId === sc.id ? 'selected' : ''}`}
                                    onClick={() => selectScene(sc.id)}
                                    style={{ fontSize: 12, padding: '4px 6px' }}
                                  >
                                    <span className="tree-item-title" style={{ gap: 6 }}>
                                      <BookOpen size={11} style={{ opacity: 0.7 }} />
                                      {sc.title}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <span className={`badge badge-${sc.status}`} style={{
                                        fontSize: 8.5,
                                        padding: '1px 4px',
                                        borderRadius: 3,
                                        textTransform: 'capitalize',
                                        backgroundColor: sc.status === 'finished' ? 'var(--color-success-bg)' : sc.status === 'review' ? 'var(--accent-gold-dim)' : 'var(--bg-primary)',
                                        color: sc.status === 'finished' ? 'var(--color-success)' : sc.status === 'review' ? 'var(--accent-gold)' : 'var(--text-muted)',
                                        border: '1px solid ' + (sc.status === 'finished' ? 'var(--color-success)' : sc.status === 'review' ? 'var(--accent-gold)' : 'var(--border-color)')
                                      }}>
                                        {sc.status}
                                      </span>
                                      <div className="tree-actions">
                                        <button 
                                          className="btn-icon" 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm("Delete this scene?")) deleteScene(sc.id);
                                          }}
                                          title="Delete Scene"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {chScenes.length === 0 && (
                                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', padding: '4px 8px' }}>
                                    No scenes. Click + to add.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Scene Properties Inspector Card */}
            {activeScene && (
              <div className="sidebar-section-card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 6, overflow: 'hidden' }}>
                <div 
                  className="sidebar-section-card-header"
                  style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', backgroundColor: 'var(--bg-secondary)', borderBottom: propertiesExpanded ? '1px solid var(--border-color)' : 'none' }}
                  onClick={() => setPropertiesExpanded(!propertiesExpanded)}
                >
                  {propertiesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px' }}>SCENE PROPERTIES: {activeScene.title.toUpperCase()}</span>
                </div>

                {propertiesExpanded && (
                  <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: 9.5, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <User size={10} /> POV Character
                        </label>
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ padding: '4px 8px', fontSize: 11.5 }}
                          value={activeScene.metadata.pov} 
                          onChange={e => updateSceneMetadata(activeScene.id, { pov: e.target.value })}
                          placeholder="e.g. Kaelen"
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: 9.5, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={10} /> Location
                        </label>
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ padding: '4px 8px', fontSize: 11.5 }}
                          value={activeScene.metadata.location} 
                          onChange={e => updateSceneMetadata(activeScene.id, { location: e.target.value })}
                          placeholder="e.g. First Tower"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: 9.5, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={10} /> Date
                        </label>
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ padding: '4px 8px', fontSize: 11.5 }}
                          value={activeScene.metadata.date} 
                          onChange={e => updateSceneMetadata(activeScene.id, { date: e.target.value })}
                          placeholder="YYYY-MM-DD"
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: 9.5, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={10} /> Time
                        </label>
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ padding: '4px 8px', fontSize: 11.5 }}
                          value={activeScene.metadata.time} 
                          onChange={e => updateSceneMetadata(activeScene.id, { time: e.target.value })}
                          placeholder="HH:MM"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Scene Snapshots (History) Card */}
            {activeScene && (
              <div className="sidebar-section-card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 6, overflow: 'hidden' }}>
                <div 
                  className="sidebar-section-card-header"
                  style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', backgroundColor: 'var(--bg-secondary)', borderBottom: snapshotsExpanded ? '1px solid var(--border-color)' : 'none' }}
                  onClick={() => setSnapshotsExpanded(!snapshotsExpanded)}
                >
                  {snapshotsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px' }}>DRAFT HISTORY ({activeSnapshots.length})</span>
                </div>

                {snapshotsExpanded && (
                  <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedSnapshotId === null ? (
                      <>
                        <form onSubmit={handleTakeSnapshot} style={{ display: 'flex', gap: 6 }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Label this draft..."
                            value={snapshotDesc}
                            onChange={e => setSnapshotDesc(e.target.value)}
                            style={{ fontSize: 11.5, padding: '4px 8px' }}
                          />
                          <button type="submit" className="btn btn-primary" style={{ padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Plus size={12} /> Snap
                          </button>
                        </form>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', paddingRight: 2 }}>
                          {activeSnapshots.map(snap => (
                            <div 
                              key={snap.id} 
                              className="tree-item"
                              style={{ padding: 8, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                              onClick={() => setSelectedSnapshotId(snap.id)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 3 }}>
                                <span style={{ fontWeight: 600, fontSize: 11, color: 'var(--text-primary)' }}>{snap.description}</span>
                                <span style={{ fontSize: 8.5, color: 'var(--text-muted)' }}>{new Date(snap.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <span style={{ fontSize: 9.5, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                                {snap.content.substring(0, 60)}...
                              </span>
                            </div>
                          ))}
                          {activeSnapshots.length === 0 && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                              No snapshots taken yet. Capture one above.
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      /* Diff/Preview block inside left sidebar */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
                          <button 
                            type="button"
                            className="btn btn-secondary" 
                            style={{ padding: '2px 6px', fontSize: 10 }}
                            onClick={() => setSelectedSnapshotId(null)}
                          >
                            &larr; Back
                          </button>
                          <button 
                            type="button"
                            className="btn btn-primary" 
                            style={{ padding: '2px 6px', fontSize: 10, backgroundColor: 'var(--color-success)', display: 'flex', gap: 3 }}
                            onClick={() => handleRestoreSnapshot(selectedSnapshotId)}
                          >
                            <RotateCcw size={10} /> Restore
                          </button>
                        </div>
                        {selectedSnapshot && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', gap: 4, padding: 6, backgroundColor: 'var(--accent-gold-dim)', borderRadius: 4, border: '1px solid var(--accent-gold-dim)' }}>
                              <AlertTriangle size={12} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
                              <span style={{ fontSize: 9, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                                Snapshot: <strong>{selectedSnapshot.description}</strong> ({new Date(selectedSnapshot.timestamp).toLocaleTimeString()})
                              </span>
                            </div>
                            <div 
                              style={{ 
                                padding: 6, 
                                fontSize: 10, 
                                lineHeight: 1.4, 
                                backgroundColor: 'var(--bg-primary)', 
                                border: '1px solid var(--border-color)', 
                                borderRadius: 4, 
                                maxHeight: 110, 
                                overflowY: 'auto',
                                fontFamily: 'var(--font-serif)'
                              }}
                            >
                              {selectedSnapshot.content}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Timeline Conflict Indicators */}
            {timelineErrors.length > 0 && (
              <div className="sidebar-section-card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--color-danger)', borderRadius: 6, overflow: 'hidden' }}>
                <div 
                  className="sidebar-section-card-header"
                  style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', backgroundColor: 'var(--color-danger-bg)', borderBottom: conflictsExpanded ? '1px solid var(--color-danger)' : 'none' }}
                  onClick={() => setConflictsExpanded(!conflictsExpanded)}
                >
                  {conflictsExpanded ? <ChevronDown size={14} style={{ color: 'var(--color-danger)' }} /> : <ChevronRight size={14} style={{ color: 'var(--color-danger)' }} />}
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--color-danger)' }}>CHRONOLOGY ERRORS ({timelineErrors.length})</span>
                </div>

                {conflictsExpanded && (
                  <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {timelineErrors.map((err, idx) => (
                      <div key={idx} className="continuity-warning" style={{ borderLeftColor: 'var(--color-danger)', backgroundColor: 'var(--color-danger-bg)', padding: 8, fontSize: 11, margin: 0 }}>
                        {err}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= STORY REFERENCE LIBRARY ================= */}
        {isReferenceTab && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Category pills grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
              {[
                { id: 'characters', label: 'Characters', icon: User, tab: 'bible' },
                { id: 'locations', label: 'Locations', icon: MapPin, tab: 'bible' },
                { id: 'factions', label: 'Factions', icon: Users, tab: 'bible' },
                { id: 'powerSystems', label: 'Magic', icon: Sparkles, tab: 'bible' },
                { id: 'plots', label: 'Plots', icon: GitCommit, tab: 'plots' },
                { id: 'notes', label: 'Notes', icon: FileText, tab: 'notes' },
                { id: 'search', label: 'Search', icon: Search, tab: 'search' }
              ].map(cat => {
                const isActive = (cat.tab === 'bible' && activeLeftTab === 'bible' && activeBibleCategory === cat.id) ||
                                 (cat.tab === 'plots' && activeLeftTab === 'plots') ||
                                 (cat.tab === 'notes' && activeLeftTab === 'notes') ||
                                 (cat.tab === 'search' && activeLeftTab === 'search');
                const Icon = cat.icon;

                return (
                  <button
                    key={cat.id}
                    className="btn"
                    style={{
                      fontSize: '10px',
                      padding: '4px 8px',
                      borderRadius: 6,
                      backgroundColor: isActive ? 'var(--accent-purple-dim)' : 'var(--bg-tertiary)',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      border: isActive ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    onClick={() => {
                      if (cat.tab === 'bible') {
                        setLeftTab('bible');
                        setBibleCategory(cat.id as any);
                      } else {
                        setLeftTab(cat.tab);
                      }
                    }}
                  >
                    <Icon size={11} style={{ color: isActive ? 'var(--accent-purple)' : 'inherit' }} />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* List & Form Content container */}
            <div style={{ flex: 1 }}>
              
              {/* === BIBLE CATEGORY VIEW === */}
              {activeLeftTab === 'bible' && (
                <div>
                  {activeBibleItemId === null ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {activeBibleCategory === 'powerSystems' ? 'Magic Systems' : activeBibleCategory.charAt(0).toUpperCase() + activeBibleCategory.slice(1)} ({project.storyBible[activeBibleCategory].length})
                        </span>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '2px 6px', fontSize: 10.5 }}
                          onClick={() => {
                            if (activeBibleCategory === 'characters') {
                              addBibleItem('characters', { name: 'New Character', appearance: '', personality: '', goals: '', fears: '', relationships: '', abilities: '', speechStyle: '', history: '', injuries: '', secrets: '', developmentArc: '' });
                            } else if (activeBibleCategory === 'locations') {
                              addBibleItem('locations', { name: 'New Location', description: '', culture: '', weather: '', history: '', landmarks: '', connectedLocations: '' });
                            } else if (activeBibleCategory === 'factions') {
                              addBibleItem('factions', { name: 'New Faction', leader: '', members: '', beliefs: '', allies: '', enemies: '', resources: '' });
                            } else {
                              addBibleItem('powerSystems', { name: 'New Magic System', rules: '', limitations: '', costs: '', exceptions: '', examples: '' });
                            }
                          }}
                        >
                          + Add
                        </button>
                      </div>

                      <div className="bible-list" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {project.storyBible[activeBibleCategory].map((item: any) => (
                          <div 
                            key={item.id} 
                            className="tree-item"
                            onClick={() => setBibleItemId(item.id)}
                            style={{ padding: '6px 8px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
                          >
                            <span style={{ fontSize: 12 }}>{item.name}</span>
                            <div className="tree-actions">
                              <button 
                                className="btn-icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Delete ${item.name}?`)) deleteBibleItem(activeBibleCategory, item.id);
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {project.storyBible[activeBibleCategory].length === 0 && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                            Empty category. Click "+ Add" to create.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Structured Bible Form */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ alignSelf: 'flex-start', padding: '2px 8px', fontSize: 10.5, marginBottom: 4 }}
                        onClick={() => setBibleItemId(null)}
                      >
                        &larr; Back to List
                      </button>

                      {(() => {
                        const item = project.storyBible[activeBibleCategory].find((i: any) => i.id === activeBibleItemId);
                        if (!item) return <div style={{ fontSize: 12 }}>Item not found.</div>;

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: 10 }}>Name</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                style={{ padding: '6px 10px', fontSize: 12 }}
                                value={item.name} 
                                onChange={e => updateBibleItem(activeBibleCategory, { ...item, name: e.target.value })}
                              />
                            </div>

                            {activeBibleCategory === 'characters' && (
                              <>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: 10 }}>Appearance</label>
                                  <textarea 
                                    className="form-textarea" 
                                    style={{ fontSize: 11.5, minHeight: 60 }}
                                    value={(item as Character).appearance} 
                                    onChange={e => updateBibleItem('characters', { ...item, appearance: e.target.value })}
                                  />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: 10 }}>Personality</label>
                                  <textarea 
                                    className="form-textarea" 
                                    style={{ fontSize: 11.5, minHeight: 60 }}
                                    value={(item as Character).personality} 
                                    onChange={e => updateBibleItem('characters', { ...item, personality: e.target.value })}
                                  />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: 10 }}>Goals & Fears</label>
                                  <textarea 
                                    className="form-textarea" 
                                    style={{ fontSize: 11.5, minHeight: 60 }}
                                    value={`Goals: ${(item as Character).goals}\nFears: ${(item as Character).fears}`} 
                                    onChange={e => {
                                      const text = e.target.value;
                                      const goalsPart = text.match(/Goals:\s*([\s\S]*?)(?:\nFears:|$)/i)?.[1] || '';
                                      const fearsPart = text.match(/Fears:\s*([\s\S]*)/i)?.[1] || '';
                                      updateBibleItem('characters', { ...item, goals: goalsPart.trim(), fears: fearsPart.trim() });
                                    }}
                                    placeholder="Goals: ...&#10;Fears: ..."
                                  />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: 10 }}>Speech Style & secrets</label>
                                  <textarea 
                                    className="form-textarea" 
                                    style={{ fontSize: 11.5, minHeight: 60 }}
                                    value={`Voice: ${(item as Character).speechStyle}\nSecrets: ${(item as Character).secrets}`} 
                                    onChange={e => {
                                      const text = e.target.value;
                                      const voicePart = text.match(/Voice:\s*([\s\S]*?)(?:\nSecrets:|$)/i)?.[1] || '';
                                      const secretsPart = text.match(/Secrets:\s*([\s\S]*)/i)?.[1] || '';
                                      updateBibleItem('characters', { ...item, speechStyle: voicePart.trim(), secrets: secretsPart.trim() });
                                    }}
                                    placeholder="Voice: ...&#10;Secrets: ..."
                                  />
                                </div>
                              </>
                            )}

                            {activeBibleCategory === 'locations' && (
                              <>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: 10 }}>Description</label>
                                  <textarea 
                                    className="form-textarea" 
                                    style={{ fontSize: 11.5, minHeight: 70 }}
                                    value={(item as Location).description} 
                                    onChange={e => updateBibleItem('locations', { ...item, description: e.target.value })}
                                  />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: 10 }}>Culture & Landmarks</label>
                                  <textarea 
                                    className="form-textarea" 
                                    style={{ fontSize: 11.5, minHeight: 70 }}
                                    value={`Culture: ${(item as Location).culture}\nLandmarks: ${(item as Location).landmarks}`} 
                                    onChange={e => {
                                      const text = e.target.value;
                                      const culturePart = text.match(/Culture:\s*([\s\S]*?)(?:\nLandmarks:|$)/i)?.[1] || '';
                                      const landmarksPart = text.match(/Landmarks:\s*([\s\S]*)/i)?.[1] || '';
                                      updateBibleItem('locations', { ...item, culture: culturePart.trim(), landmarks: landmarksPart.trim() });
                                    }}
                                  />
                                </div>
                              </>
                            )}

                            {activeBibleCategory === 'factions' && (
                              <>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: 10 }}>Leader</label>
                                  <input 
                                    type="text"
                                    className="form-input" 
                                    style={{ padding: '6px 10px', fontSize: 12 }}
                                    value={(item as Faction).leader} 
                                    onChange={e => updateBibleItem('factions', { ...item, leader: e.target.value })}
                                  />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: 10 }}>Beliefs & Faction Details</label>
                                  <textarea 
                                    className="form-textarea" 
                                    style={{ fontSize: 11.5, minHeight: 90 }}
                                    value={(item as Faction).beliefs} 
                                    onChange={e => updateBibleItem('factions', { ...item, beliefs: e.target.value })}
                                  />
                                </div>
                              </>
                            )}

                            {activeBibleCategory === 'powerSystems' && (
                              <>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: 10 }}>Rules & Systems</label>
                                  <textarea 
                                    className="form-textarea" 
                                    style={{ fontSize: 11.5, minHeight: 80 }}
                                    value={(item as PowerSystem).rules} 
                                    onChange={e => updateBibleItem('powerSystems', { ...item, rules: e.target.value })}
                                  />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: 10 }}>Limitations & Costs</label>
                                  <textarea 
                                    className="form-textarea" 
                                    style={{ fontSize: 11.5, minHeight: 80 }}
                                    value={(item as PowerSystem).costs} 
                                    onChange={e => updateBibleItem('powerSystems', { ...item, costs: e.target.value })}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* === PLOTS TAB === */}
              {activeLeftTab === 'plots' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>PLOT THREADS TRACKER</span>
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '2px 6px', fontSize: 10.5 }}
                      onClick={() => addPlotThread({ title: 'New Mystery Arc', type: 'mystery', status: 'active', description: '' })}
                    >
                      + Add
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {project.plotThreads.map(pt => (
                      <div 
                        key={pt.id} 
                        style={{ 
                          padding: 10, 
                          backgroundColor: 'var(--bg-tertiary)', 
                          borderRadius: 6, 
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ fontWeight: 600, background: 'none', border: 'none', padding: 0, height: 'auto', color: 'var(--text-primary)', fontSize: 12.5 }}
                            value={pt.title} 
                            onChange={e => updatePlotThread({ ...pt, title: e.target.value })}
                          />
                          <select 
                            value={pt.status} 
                            onChange={e => updatePlotThread({ ...pt, status: e.target.value as any })}
                            style={{ fontSize: 9.5, background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: 4, padding: '1px 3px' }}
                          >
                            <option value="active">Active</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </div>

                        <textarea 
                          className="form-textarea" 
                          style={{ fontSize: 11, padding: 4, minHeight: 50, marginBottom: 0 }}
                          value={pt.description} 
                          onChange={e => updatePlotThread({ ...pt, description: e.target.value })}
                          placeholder="Thread summary / notes..."
                        />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <select 
                            value={pt.type} 
                            onChange={e => updatePlotThread({ ...pt, type: e.target.value as any })}
                            style={{ fontSize: 9.5, background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: 4, padding: '1px 3px' }}
                          >
                            <option value="mystery">Mystery</option>
                            <option value="question">Question</option>
                            <option value="foreshadow">Foreshadow</option>
                            <option value="promise">Promise</option>
                            <option value="goal">Goal</option>
                            <option value="conflict">Conflict</option>
                          </select>

                          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                            Active Thread
                          </span>
                        </div>
                      </div>
                    ))}
                    {project.plotThreads.length === 0 && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                        No plot threads tracked yet. Click "+ Add".
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* === SCRAPBOOK NOTES TAB === */}
              {activeLeftTab === 'notes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activeNoteId === null ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>SCRAPBOOK NOTES</span>
                        <button 
                          className="btn-icon" 
                          onClick={() => addNote('New Note Idea', 'Write down world elements or scene ideas...')}
                          title="Add Note"
                          style={{ padding: 2 }}
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {project.notes.map(n => (
                          <div 
                            key={n.id} 
                            className="tree-item"
                            onClick={() => setActiveNoteId(n.id)}
                            style={{ padding: '6px 8px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
                          >
                            <span style={{ fontSize: 12 }}>{n.title}</span>
                            <div className="tree-actions">
                              <button 
                                className="btn-icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm("Delete note?")) deleteNote(n.id);
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {project.notes.length === 0 && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                            Scrapbook is empty. Click "+" to add.
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Note Editor View */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ alignSelf: 'flex-start', padding: '2px 8px', fontSize: 10.5 }}
                        onClick={() => setActiveNoteId(null)}
                      >
                        &larr; Back
                      </button>
                      {(() => {
                        const note = project.notes.find(n => n.id === activeNoteId);
                        if (!note) return <div style={{ fontSize: 12 }}>Note not found.</div>;
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: 9.5 }}>Note Title</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                style={{ padding: '6px 10px', fontSize: 12 }}
                                value={note.title} 
                                onChange={e => updateNote(note.id, { title: e.target.value })}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: 9.5 }}>Content</label>
                              <textarea 
                                className="form-textarea" 
                                style={{ minHeight: 200, fontSize: 11.5 }}
                                value={note.content} 
                                onChange={e => updateNote(note.id, { content: e.target.value })}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* === INTELLIGENT SEARCH TAB === */}
              {activeLeftTab === 'search' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', fontWeight: 600, fontSize: 12 }}>
                    <Search size={14} style={{ color: 'var(--accent-purple)' }} />
                    <span>INTELLIGENT SEARCH</span>
                  </div>

                  <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6 }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Search characters, plot lines..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ fontSize: 12, padding: '6px 10px' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '6px 10px', fontSize: 12 }}>
                      Go
                    </button>
                  </form>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '350px', overflowY: 'auto' }}>
                    {searched && searchResults.length === 0 && (
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
                        No matches found for "{searchQuery}".
                      </div>
                    )}

                    {searchResults.map((res, idx) => (
                      <div 
                        key={idx}
                        className="search-card"
                        style={{
                          padding: 8,
                          backgroundColor: 'var(--bg-tertiary)',
                          borderRadius: 6,
                          border: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onClick={() => handleSearchResultClick(res)}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-purple)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          {res.type === 'scene' && <BookOpen size={10} style={{ color: 'var(--accent-purple)' }} />}
                          {res.type === 'character' && <User size={10} style={{ color: 'var(--accent-gold)' }} />}
                          {res.type === 'location' && <MapPin size={10} style={{ color: 'var(--color-info)' }} />}
                          {res.type === 'thread' && <GitCommit size={10} style={{ color: 'var(--color-success)' }} />}
                          
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{res.title}</span>
                        </div>
                        <p style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4, whiteSpace: 'pre-line' }}>{res.snippet}</p>
                        {res.sceneId && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9.5, color: 'var(--accent-purple)', marginTop: 4, fontWeight: 500 }}>
                            Jump to scene <ArrowRight size={9} />
                          </div>
                        )}
                      </div>
                    ))}

                    {!searched && (
                      <div style={{ padding: 10, border: '1px dashed var(--border-color)', borderRadius: 6, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Try searching:
                        <ul style={{ paddingLeft: 12, marginTop: 4 }}>
                          <li>"Mira first appear"</li>
                          <li>"Silver Order"</li>
                          <li>"First Tower"</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
