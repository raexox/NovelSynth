import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  BookOpen, Compass, Plus, Trash2, Calendar, 
  GitCommit, Edit3, Book, CheckCircle2, ChevronRight, ChevronDown 
} from 'lucide-react';
import type { Character, Location, Faction, PowerSystem } from '../types';

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
  } = useStore();

  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Toggle chapter expansion
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    'ch-1': true,
    'ch-2': true,
    'ch-3': true
  });

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

  // Timeline Analysis: detect impossible chronology
  const getTimelineErrors = () => {
    const sortedScenes = [...project.scenes].sort((a, b) => {
      // Find chapter order first, then scene order
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
          errors.push(`Chronological Error: Scene "${curr.title}" (set on ${curr.metadata.date}) is placed after "${prev.title}" (set on ${prev.metadata.date}) in the manuscript, but occurs earlier in time.`);
        }
      }
    }

    // 2. Check Character Teleportation (same date/time, different locations)
    for (let i = 0; i < sortedScenes.length; i++) {
      for (let j = i + 1; j < sortedScenes.length; j++) {
        const s1 = sortedScenes[i];
        const s2 = sortedScenes[j];
        if (s1.metadata.date === s2.metadata.date && s1.metadata.time === s2.metadata.time && s1.metadata.location !== s2.metadata.location) {
          // Find characters present in both
          const overlappingChars = s1.metadata.characters.filter(c => s2.metadata.characters.includes(c));
          if (overlappingChars.length > 0) {
            errors.push(`Teleportation Warning: ${overlappingChars.join(', ')} registered in both "${s1.title}" (at ${s1.metadata.location}) and "${s2.title}" (at ${s2.metadata.location}) at exactly ${s1.metadata.date} ${s1.metadata.time}.`);
          }
        }
      }
    }

    return errors;
  };

  const timelineErrors = getTimelineErrors();

  return (
    <div className="sidebar">
      {/* Sidebar Navigation Icons */}
      <div className="sidebar-tabs">
        <button 
          className={`sidebar-tab-btn ${activeLeftTab === 'novel' ? 'active' : ''}`}
          onClick={() => setLeftTab('novel')}
          title="Manuscript Chapters"
        >
          <Book size={14} />
          Novel
        </button>
        <button 
          className={`sidebar-tab-btn ${activeLeftTab === 'bible' ? 'active' : ''}`}
          onClick={() => setLeftTab('bible')}
          title="Story Bible"
        >
          <Compass size={14} />
          Bible
        </button>
        <button 
          className={`sidebar-tab-btn ${activeLeftTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setLeftTab('timeline')}
          title="Timeline Chronology"
        >
          <Calendar size={14} />
          Timeline
        </button>
        <button 
          className={`sidebar-tab-btn ${activeLeftTab === 'plots' ? 'active' : ''}`}
          onClick={() => setLeftTab('plots')}
          title="Plot Threads"
        >
          <GitCommit size={14} />
          Plots
        </button>
        <button 
          className={`sidebar-tab-btn ${activeLeftTab === 'notes' ? 'active' : ''}`}
          onClick={() => setLeftTab('notes')}
          title="Scratchpad Notes"
        >
          <Edit3 size={14} />
          Notes
        </button>
      </div>

      <div className="sidebar-content">
        {/* ================= MANUSCRIPT TAB ================= */}
        {activeLeftTab === 'novel' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="sidebar-title">Manuscript Outline</span>
              <button className="btn-icon" onClick={() => setShowAddChapter(true)} title="Add Chapter">
                <Plus size={16} />
              </button>
            </div>

            {showAddChapter && (
              <form onSubmit={handleAddChapterSubmit} style={{ marginBottom: 12, display: 'flex', gap: 6 }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Chapter Title..." 
                  value={newChapterTitle} 
                  onChange={e => setNewChapterTitle(e.target.value)} 
                  autoFocus
                />
                <button type="submit" className="btn btn-primary" style={{padding: '4px 8px'}}>Add</button>
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
                    <div key={ch.id} style={{ marginBottom: 8 }}>
                      <div 
                        className="tree-item"
                        style={{ fontWeight: 600, color: 'var(--text-primary)' }}
                        onClick={() => toggleChapterExpand(ch.id)}
                      >
                        <span className="tree-item-title">
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
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
                        <div style={{ paddingLeft: 16 }}>
                          {chScenes.map(sc => (
                            <div 
                              key={sc.id} 
                              className={`tree-item ${activeSceneId === sc.id ? 'selected' : ''}`}
                              onClick={() => selectScene(sc.id)}
                            >
                              <span className="tree-item-title">
                                <BookOpen size={12} style={{ opacity: 0.7 }} />
                                {sc.title}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className={`badge badge-${sc.status}`} style={{
                                  fontSize: 9,
                                  padding: '2px 4px',
                                  borderRadius: 3,
                                  backgroundColor: sc.status === 'finished' ? 'var(--color-success-bg)' : sc.status === 'review' ? 'var(--accent-gold-dim)' : 'var(--bg-tertiary)',
                                  color: sc.status === 'finished' ? 'var(--color-success)' : sc.status === 'review' ? 'var(--accent-gold)' : 'var(--text-muted)'
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
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {chScenes.length === 0 && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 8px' }}>
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

        {/* ================= STORY BIBLE TAB ================= */}
        {activeLeftTab === 'bible' && (
          <div>
            <span className="sidebar-title">Story Bible</span>
            
            {/* Category Toggle */}
            <div style={{ display: 'flex', gap: 2, margin: '8px 0 12px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: 6 }}>
              {(['characters', 'locations', 'factions', 'powerSystems'] as const).map(cat => (
                <button
                  key={cat}
                  className={`btn`}
                  style={{
                    flex: 1,
                    fontSize: 9,
                    padding: '4px 2px',
                    backgroundColor: activeBibleCategory === cat ? 'var(--accent-purple)' : 'var(--bg-tertiary)',
                    color: activeBibleCategory === cat ? 'white' : 'var(--text-secondary)'
                  }}
                  onClick={() => setBibleCategory(cat)}
                >
                  {cat === 'powerSystems' ? 'Magic' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            {/* List & Form Split */}
            {activeBibleItemId === null ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>
                    {activeBibleCategory.charAt(0).toUpperCase() + activeBibleCategory.slice(1)} ({project.storyBible[activeBibleCategory].length})
                  </span>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '2px 6px', fontSize: 11 }}
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

                <div className="bible-list">
                  {project.storyBible[activeBibleCategory].map((item: any) => (
                    <div 
                      key={item.id} 
                      className="tree-item"
                      onClick={() => setBibleItemId(item.id)}
                    >
                      <span>{item.name}</span>
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
                </div>
              </div>
            ) : (
              // Structured Edit Form
              <div className="bible-item-editor" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ alignSelf: 'flex-start', padding: '2px 8px', fontSize: 11, marginBottom: 6 }}
                  onClick={() => setBibleItemId(null)}
                >
                  &larr; Back to List
                </button>

                {(() => {
                  const item = project.storyBible[activeBibleCategory].find((i: any) => i.id === activeBibleItemId);
                  if (!item) return <div>Item not found.</div>;

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div className="form-group">
                        <label className="form-label">Name</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={item.name} 
                          onChange={e => updateBibleItem(activeBibleCategory, { ...item, name: e.target.value })}
                        />
                      </div>

                      {activeBibleCategory === 'characters' && (
                        <>
                          <div className="form-group">
                            <label className="form-label">Appearance</label>
                            <textarea 
                              className="form-textarea" 
                              value={(item as Character).appearance} 
                              onChange={e => updateBibleItem('characters', { ...item, appearance: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Personality</label>
                            <textarea 
                              className="form-textarea" 
                              value={(item as Character).personality} 
                              onChange={e => updateBibleItem('characters', { ...item, personality: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Goals</label>
                            <textarea 
                              className="form-textarea" 
                              value={(item as Character).goals} 
                              onChange={e => updateBibleItem('characters', { ...item, goals: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Fears</label>
                            <textarea 
                              className="form-textarea" 
                              value={(item as Character).fears} 
                              onChange={e => updateBibleItem('characters', { ...item, fears: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Relationships</label>
                            <textarea 
                              className="form-textarea" 
                              value={(item as Character).relationships} 
                              onChange={e => updateBibleItem('characters', { ...item, relationships: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Abilities</label>
                            <textarea 
                              className="form-textarea" 
                              value={(item as Character).abilities} 
                              onChange={e => updateBibleItem('characters', { ...item, abilities: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Speech Style</label>
                            <textarea 
                              className="form-textarea" 
                              value={(item as Character).speechStyle} 
                              onChange={e => updateBibleItem('characters', { ...item, speechStyle: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Secrets</label>
                            <textarea 
                              className="form-textarea" 
                              value={(item as Character).secrets} 
                              onChange={e => updateBibleItem('characters', { ...item, secrets: e.target.value })}
                            />
                          </div>
                        </>
                      )}

                      {activeBibleCategory === 'locations' && (
                        <>
                          <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea 
                              className="form-textarea" 
                              value={(item as Location).description} 
                              onChange={e => updateBibleItem('locations', { ...item, description: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Culture</label>
                            <textarea 
                              className="form-textarea" 
                              value={(item as Location).culture} 
                              onChange={e => updateBibleItem('locations', { ...item, culture: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Weather</label>
                            <input 
                              type="text"
                              className="form-input" 
                              value={(item as Location).weather} 
                              onChange={e => updateBibleItem('locations', { ...item, weather: e.target.value })}
                            />
                          </div>
                        </>
                      )}

                      {activeBibleCategory === 'factions' && (
                        <>
                          <div className="form-group">
                            <label className="form-label">Leader</label>
                            <input 
                              type="text"
                              className="form-input" 
                              value={(item as Faction).leader} 
                              onChange={e => updateBibleItem('factions', { ...item, leader: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Beliefs</label>
                            <textarea 
                              className="form-textarea" 
                              value={(item as Faction).beliefs} 
                              onChange={e => updateBibleItem('factions', { ...item, beliefs: e.target.value })}
                            />
                          </div>
                        </>
                      )}

                      {activeBibleCategory === 'powerSystems' && (
                        <>
                          <div className="form-group">
                            <label className="form-label">Rules</label>
                            <textarea 
                              className="form-textarea" 
                              value={(item as PowerSystem).rules} 
                              onChange={e => updateBibleItem('powerSystems', { ...item, rules: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Limitations & Costs</label>
                            <textarea 
                              className="form-textarea" 
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

        {/* ================= TIMELINE TAB ================= */}
        {activeLeftTab === 'timeline' && (
          <div>
            <span className="sidebar-title">Chronology Manager</span>
            
            {/* Timeline Conflict Indicators */}
            {timelineErrors.length > 0 ? (
              <div style={{ marginTop: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase' }}>Chronological Conflicts ({timelineErrors.length})</span>
                {timelineErrors.map((err, idx) => (
                  <div key={idx} className="continuity-warning" style={{ borderLeftColor: 'var(--color-danger)', backgroundColor: 'var(--color-danger-bg)', padding: 8, fontSize: 12, marginTop: 4 }}>
                    {err}
                  </div>
                ))}
              </div>
            ) : (
              <div className="continuity-warning" style={{ borderLeftColor: 'var(--color-success)', backgroundColor: 'var(--color-success-bg)', margin: '8px 0 12px 0', padding: 8, color: 'var(--color-success)' }}>
                <CheckCircle2 size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                No timeline conflicts detected.
              </div>
            )}

            <div className="timeline-flow" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {project.scenes
                .map(sc => {
                  const ch = project.chapters.find(c => c.id === sc.chapterId);
                  return { ...sc, chapterTitle: ch?.title || 'Unknown Chapter' };
                })
                .map(sc => (
                  <div 
                    key={sc.id} 
                    className="timeline-node" 
                    style={{ 
                      padding: 10, 
                      backgroundColor: activeSceneId === sc.id ? 'var(--accent-purple-dim)' : 'var(--bg-tertiary)', 
                      borderRadius: 4, 
                      border: activeSceneId === sc.id ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                    onClick={() => selectScene(sc.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>{sc.title}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sc.chapterTitle.split(':')[0]}</span>
                    </div>

                    <div className="form-group" style={{ marginBottom: 6 }}>
                      <label className="form-label" style={{ fontSize: 9 }}>POV Character</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ padding: '3px 6px', fontSize: 11 }}
                        value={sc.metadata.pov} 
                        onChange={e => updateSceneMetadata(sc.id, { pov: e.target.value })}
                        onClick={e => e.stopPropagation()}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: 9 }}>Date</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ padding: '3px 6px', fontSize: 11 }}
                          value={sc.metadata.date} 
                          onChange={e => updateSceneMetadata(sc.id, { date: e.target.value })}
                          onClick={e => e.stopPropagation()}
                          placeholder="YYYY-MM-DD"
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: 9 }}>Time</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ padding: '3px 6px', fontSize: 11 }}
                          value={sc.metadata.time} 
                          onChange={e => updateSceneMetadata(sc.id, { time: e.target.value })}
                          onClick={e => e.stopPropagation()}
                          placeholder="HH:MM"
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: 9 }}>Location</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ padding: '3px 6px', fontSize: 11 }}
                        value={sc.metadata.location} 
                        onChange={e => updateSceneMetadata(sc.id, { location: e.target.value })}
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ================= PLOT THREADS TAB ================= */}
        {activeLeftTab === 'plots' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="sidebar-title">Plot Threads Tracker</span>
              <button 
                className="btn btn-primary" 
                style={{ padding: '2px 6px', fontSize: 11 }}
                onClick={() => addPlotThread({ title: 'New Mystery Arc', type: 'mystery', status: 'active' })}
              >
                + Add Thread
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {project.plotThreads.map(pt => (
                <div 
                  key={pt.id} 
                  style={{ 
                    padding: 10, 
                    backgroundColor: 'var(--bg-tertiary)', 
                    borderRadius: 4, 
                    border: '1px solid var(--border-color)' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ fontWeight: 600, background: 'none', border: 'none', padding: 0, height: 'auto', color: 'var(--text-primary)' }}
                      value={pt.title} 
                      onChange={e => updatePlotThread({ ...pt, title: e.target.value })}
                    />
                    <select 
                      value={pt.status} 
                      onChange={e => updatePlotThread({ ...pt, status: e.target.value as any })}
                      style={{ fontSize: 10, background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: 3, padding: '2px 4px' }}
                    >
                      <option value="active">Active</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  <textarea 
                    className="form-textarea" 
                    style={{ fontSize: 11, padding: 4, minHeight: 70, marginBottom: 6 }}
                    value={pt.description} 
                    onChange={e => updatePlotThread({ ...pt, description: e.target.value })}
                    placeholder="Brief description..."
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <select 
                      value={pt.type} 
                      onChange={e => updatePlotThread({ ...pt, type: e.target.value as any })}
                      style={{ fontSize: 10, background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: 3, padding: '2px 4px' }}
                    >
                      <option value="mystery">Mystery</option>
                      <option value="question">Question</option>
                      <option value="foreshadow">Foreshadowing</option>
                      <option value="promise">Promise</option>
                      <option value="goal">Goal</option>
                      <option value="conflict">Conflict</option>
                    </select>

                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                      Started in Scene 1
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= NOTES TAB ================= */}
        {activeLeftTab === 'notes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="sidebar-title">Scrapbook Notes</span>
              <button 
                className="btn-icon" 
                onClick={() => addNote('New Note Idea', 'Write down world elements or scenes ideas...')}
                title="Add Note"
              >
                <Plus size={16} />
              </button>
            </div>

            {activeNoteId === null ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {project.notes.map(n => (
                  <div 
                    key={n.id} 
                    className="tree-item"
                    onClick={() => setActiveNoteId(n.id)}
                  >
                    <span>{n.title}</span>
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
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                    Notes are empty. Click + to add.
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ alignSelf: 'flex-start', padding: '2px 8px', fontSize: 11 }}
                  onClick={() => setActiveNoteId(null)}
                >
                  &larr; Back to Notes
                </button>
                {(() => {
                  const note = project.notes.find(n => n.id === activeNoteId);
                  if (!note) return <div>Note not found.</div>;
                  return (
                    <>
                      <div className="form-group">
                        <label className="form-label">Note Title</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={note.title} 
                          onChange={e => updateNote(note.id, { title: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Content</label>
                        <textarea 
                          className="form-textarea" 
                          style={{ minHeight: 180 }}
                          value={note.content} 
                          onChange={e => updateNote(note.id, { content: e.target.value })}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
