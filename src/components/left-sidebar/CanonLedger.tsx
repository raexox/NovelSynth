import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  Edit3,
  ExternalLink,
  FileText,
  Filter,
  Layers,
  Pencil,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  User,
  X
} from 'lucide-react';
import { useStore } from '../../store';
import type {
  BibleCategory,
  ContinuityEntityType,
  ContinuityFact,
  ContinuityFactSource,
  ContinuityFactStatus
} from '../../types';
import { sortScenesByBookOrder } from '../../services/continuityContext';

type FactDraft = Pick<
  ContinuityFact,
  | 'sceneId'
  | 'chapterId'
  | 'entityType'
  | 'entityId'
  | 'entityName'
  | 'factType'
  | 'factText'
  | 'status'
  | 'startsAtSceneId'
  | 'endsAtSceneId'
  | 'source'
>;

const statuses: ContinuityFactStatus[] = ['active', 'superseded', 'resolved', 'contradicted'];
const entityTypes: ContinuityEntityType[] = ['character', 'location', 'faction', 'lore', 'powerSystem', 'object', 'timeline', 'relationship'];

const categoryByEntityType: Partial<Record<ContinuityEntityType, BibleCategory>> = {
  character: 'characters',
  location: 'locations',
  faction: 'factions',
  lore: 'lore',
  powerSystem: 'powerSystems'
};

const makeEmptyDraft = (sceneId: string | null): FactDraft => ({
  sceneId: sceneId || '',
  chapterId: '',
  entityType: 'character',
  entityId: null,
  entityName: '',
  factType: 'general',
  factText: '',
  status: 'active',
  startsAtSceneId: sceneId || '',
  endsAtSceneId: null,
  source: 'bible_edit'
});

const toDraft = (fact: ContinuityFact): FactDraft => ({
  sceneId: fact.sceneId || '',
  chapterId: fact.chapterId || '',
  entityType: fact.entityType,
  entityId: fact.entityId || null,
  entityName: fact.entityName || '',
  factType: fact.factType || '',
  factText: fact.factText || '',
  status: fact.status,
  startsAtSceneId: fact.startsAtSceneId || fact.sceneId || '',
  endsAtSceneId: fact.endsAtSceneId || null,
  source: fact.source
});

const stringList = (value: unknown) => Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];

export const CanonLedger: React.FC = () => {
  const {
    project,
    activeSceneId,
    addContinuityFact,
    updateContinuityFact,
    deleteContinuityFact,
    updateMemoryUpdate,
    updateChapterMemory,
    selectScene
  } = useStore();

  // Selection state: 'all' or specific chapterId / sceneId
  const [selectedTreeId, setSelectedTreeId] = useState<string>('all');
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Accordion state for structure tree
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  // Fact modal/editing drawer state
  const [selectedFactId, setSelectedFactId] = useState<string | null>(null);
  const [isCreatingFact, setIsCreatingFact] = useState(false);
  const [factDraft, setFactDraft] = useState<FactDraft>(() => makeEmptyDraft(activeSceneId));
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Inline editing state for memory summaries & chapter recaps
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editingSceneSummary, setEditingSceneSummary] = useState<string>('');
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingChapterSummary, setEditingChapterSummary] = useState<string>('');

  const orderedScenes = useMemo(() => sortScenesByBookOrder(project), [project]);
  const selectedFact = selectedFactId
    ? project.continuityFacts.find(fact => fact.id === selectedFactId) || null
    : null;

  useEffect(() => {
    if (!selectedFact) return;
    setFactDraft(toDraft(selectedFact));
    setIsCreatingFact(false);
    setDeleteConfirmOpen(false);
  }, [selectedFact]);

  // Expand active chapter by default on mount
  useEffect(() => {
    if (activeSceneId) {
      const scene = project.scenes.find(s => s.id === activeSceneId);
      if (scene?.chapterId) {
        setExpandedChapters(prev => ({ ...prev, [scene.chapterId]: true }));
      }
    }
  }, [activeSceneId, project.scenes]);

  const linkedCategory = categoryByEntityType[factDraft.entityType];
  const linkedItems = linkedCategory ? project.storyBible[linkedCategory] : [];

  // Extract list of unique entity names across story bible and continuity facts
  const knownEntities = useMemo(() => {
    const map = new Map<string, string>(); // name -> type
    project.storyBible.characters.forEach(c => map.set(c.name, 'character'));
    project.storyBible.locations.forEach(l => map.set(l.name, 'location'));
    project.storyBible.factions.forEach(f => map.set(f.name, 'faction'));
    (project.storyBible.lore || []).forEach(m => map.set(m.name, 'lore'));
    (project.storyBible.powerSystems || []).forEach(p => map.set(p.name, 'powerSystem'));
    project.continuityFacts.forEach(f => {
      if (f.entityName && !map.has(f.entityName)) {
        map.set(f.entityName, f.entityType);
      }
    });
    return Array.from(map.entries()).map(([name, type]) => ({ name, type })).sort((a, b) => a.name.localeCompare(b.name));
  }, [project]);

  const toggleChapterExpand = (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedChapters(prev => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const openCreateFact = (targetSceneId?: string) => {
    setSelectedFactId(null);
    setFactDraft(makeEmptyDraft(targetSceneId || activeSceneId));
    setIsCreatingFact(true);
    setDeleteConfirmOpen(false);
  };

  const handleSaveFact = async () => {
    const normalizedDraft: FactDraft = {
      ...factDraft,
      entityName: factDraft.entityName.trim(),
      factType: factDraft.factType.trim() || 'general',
      factText: factDraft.factText.trim(),
      entityId: factDraft.entityId || null,
      endsAtSceneId: factDraft.endsAtSceneId || null
    };

    if (!normalizedDraft.entityName || !normalizedDraft.factText) return;

    if (isCreatingFact) {
      const inserted = await addContinuityFact(normalizedDraft);
      setIsCreatingFact(false);
      setSelectedFactId(inserted?.id || null);
      return;
    }

    if (selectedFact) {
      await updateContinuityFact(selectedFact.id, normalizedDraft);
    }
  };

  const handleDeleteFact = async () => {
    if (!selectedFact) return;
    await deleteContinuityFact(selectedFact.id);
    setSelectedFactId(null);
    setIsCreatingFact(false);
    setDeleteConfirmOpen(false);
  };

  const startEditingSceneMemory = (sceneId: string, currentSummary: string) => {
    setEditingSceneId(sceneId);
    setEditingSceneSummary(currentSummary);
  };

  const saveSceneMemorySummary = (sceneId: string) => {
    if (editingSceneSummary.trim()) {
      updateMemoryUpdate(sceneId, { summary: editingSceneSummary.trim() });
    }
    setEditingSceneId(null);
  };

  const startEditingChapterMemory = (chapterId: string, currentSummary: string) => {
    setEditingChapterId(chapterId);
    setEditingChapterSummary(currentSummary);
  };

  const saveChapterMemorySummary = (chapterId: string) => {
    if (editingChapterSummary.trim()) {
      updateChapterMemory(chapterId, editingChapterSummary.trim());
    }
    setEditingChapterId(null);
  };

  // Filter logic for which scenes to display on right workspace
  const displayedScenes = useMemo(() => {
    let list = orderedScenes;

    // Filter by Tree Selection
    if (selectedTreeId.startsWith('chap_')) {
      const chapId = selectedTreeId.replace('chap_', '');
      list = list.filter(s => s.chapterId === chapId);
    } else if (selectedTreeId.startsWith('scene_')) {
      const sceneId = selectedTreeId.replace('scene_', '');
      list = list.filter(s => s.id === sceneId);
    }

    // Filter by Entity Selection
    if (selectedEntityFilter !== 'all') {
      const entLower = selectedEntityFilter.toLowerCase();
      list = list.filter(scene => {
        const memory = project.memoryUpdates.find(m => m.sceneId === scene.id);
        const sceneFacts = project.continuityFacts.filter(f => f.sceneId === scene.id || f.startsAtSceneId === scene.id);
        const inFacts = sceneFacts.some(f => f.entityName.toLowerCase() === entLower);
        const inMemory = memory && (
          memory.summary.toLowerCase().includes(entLower) ||
          stringList(memory.events).some(e => e.toLowerCase().includes(entLower))
        );
        const inMetadata = scene.metadata?.characters?.some(c => c.toLowerCase() === entLower) || scene.metadata?.location?.toLowerCase() === entLower;
        return inFacts || inMemory || inMetadata;
      });
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(scene => {
        const memory = project.memoryUpdates.find(m => m.sceneId === scene.id);
        const sceneFacts = project.continuityFacts.filter(f => f.sceneId === scene.id || f.startsAtSceneId === scene.id);
        return scene.title.toLowerCase().includes(q) ||
          (memory && memory.summary.toLowerCase().includes(q)) ||
          sceneFacts.some(f => f.factText.toLowerCase().includes(q) || f.entityName.toLowerCase().includes(q));
      });
    }

    return list;
  }, [orderedScenes, selectedTreeId, selectedEntityFilter, searchQuery, project]);

  const factEditorOpen = isCreatingFact || selectedFact;

  return (
    <div className="canon-studio-root" style={{ display: 'flex', width: '100%', height: '100%', background: 'var(--bg-secondary, #121820)', color: 'var(--text-primary, #fff)', overflow: 'hidden' }}>
      
      {/* LEFT COLUMN: Structure Tree & Filters (~300px) */}
      <div style={{ width: 320, borderRight: '1px solid var(--border-color, rgba(255,255,255,0.08))', background: 'var(--bg-tertiary, #161d27)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header & Controls */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Database size={16} color="var(--accent-purple, #a855f7)" />
              <span>Canon & Memory Studio</span>
            </div>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => openCreateFact()} style={{ fontSize: 11, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={12} /> Fact
            </button>
          </div>

          {/* Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-primary, #0d1117)', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-color, rgba(255,255,255,0.1))', marginBottom: 10 }}>
            <Search size={13} color="var(--text-muted)" />
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search canon & memories..."
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 12, outline: 'none', width: '100%' }}
            />
          </div>

          {/* Entity Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={12} color="var(--text-muted)" />
            <select
              className="form-select"
              value={selectedEntityFilter}
              onChange={e => setSelectedEntityFilter(e.target.value)}
              style={{ fontSize: 12, padding: '4px 8px', width: '100%' }}
            >
              <option value="all">🌐 All Entities (Whole Book)</option>
              {knownEntities.map(ent => (
                <option key={ent.name} value={ent.name}>
                  {ent.type === 'character' ? '👤' : ent.type === 'location' ? '📍' : '🛡️'} {ent.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tree Selector List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          
          {/* "All Manuscript" Option */}
          <div
            onClick={() => setSelectedTreeId('all')}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 6,
              background: selectedTreeId === 'all' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
              color: selectedTreeId === 'all' ? 'var(--accent-purple-light, #c084fc)' : 'var(--text-primary)',
              border: '1px solid',
              borderColor: selectedTreeId === 'all' ? 'var(--accent-purple, #a855f7)' : 'transparent'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={14} />
              <span>Full Manuscript Canon</span>
            </div>
            <span style={{ fontSize: 11, opacity: 0.7 }}>{project.scenes.length} scenes</span>
          </div>

          {/* Chapters & Scenes Tree */}
          {project.chapters.sort((a, b) => a.order - b.order).map(chapter => {
            const chapScenes = project.scenes.filter(s => s.chapterId === chapter.id).sort((a, b) => a.order - b.order);
            const isChapSelected = selectedTreeId === `chap_${chapter.id}`;
            const isExpanded = expandedChapters[chapter.id] ?? true;

            return (
              <div key={chapter.id} style={{ marginBottom: 4 }}>
                {/* Chapter Row */}
                <div
                  onClick={() => setSelectedTreeId(`chap_${chapter.id}`)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isChapSelected ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                    color: isChapSelected ? 'var(--accent-purple-light, #c084fc)' : 'var(--text-primary)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span onClick={e => toggleChapterExpand(chapter.id, e)} style={{ display: 'flex', padding: 2 }}>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                    <BookOpen size={13} color="var(--accent-purple)" />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{chapter.title}</span>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{chapScenes.length}</span>
                </div>

                {/* Sub-Scenes List */}
                {isExpanded && (
                  <div style={{ paddingLeft: 20, marginTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {chapScenes.map(scene => {
                      const isSceneSelected = selectedTreeId === `scene_${scene.id}`;
                      const memory = project.memoryUpdates.find(m => m.sceneId === scene.id);

                      return (
                        <div
                          key={scene.id}
                          onClick={() => setSelectedTreeId(`scene_${scene.id}`)}
                          style={{
                            padding: '5px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: isSceneSelected ? 'var(--bg-primary, #0d1117)' : 'transparent',
                            color: isSceneSelected ? '#ffffff' : 'var(--text-muted)',
                            borderLeft: '2px solid',
                            borderLeftColor: isSceneSelected ? 'var(--accent-purple, #a855f7)' : 'transparent'
                          }}
                        >
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{scene.title}</span>
                          <span style={{
                            fontSize: 9,
                            padding: '1px 5px',
                            borderRadius: 3,
                            background: scene.status === 'finished' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                            color: scene.status === 'finished' ? '#4ade80' : '#fde047'
                          }}>
                            {scene.status === 'finished' ? 'Done' : 'Draft'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Unified Canon Cards Workspace (~70% width) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary, #0d1117)' }}>
        
        {/* Active Workspace Banner */}
        <div style={{ padding: '12px 20px', background: 'var(--bg-tertiary, #161d27)', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              {selectedTreeId === 'all' && 'Full Manuscript Canon Ledger'}
              {selectedTreeId.startsWith('chap_') && `Chapter: ${project.chapters.find(c => c.id === selectedTreeId.replace('chap_', ''))?.title || 'Unknown'}`}
              {selectedTreeId.startsWith('scene_') && `Scene: ${project.scenes.find(s => s.id === selectedTreeId.replace('scene_', ''))?.title || 'Unknown'}`}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Showing {displayedScenes.length} scene card{displayedScenes.length === 1 ? '' : 's'}
              {selectedEntityFilter !== 'all' && ` filtered for entity "${selectedEntityFilter}"`}
            </div>
          </div>

          <button type="button" className="btn btn-primary sidebar-action-button" onClick={() => openCreateFact()}>
            <Plus size={13} /> Add Canon Fact
          </button>
        </div>

        {/* Scrollable Unified Cards List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {displayedScenes.length === 0 && (
            <div className="ledger-empty" style={{ padding: 40, textAlign: 'center' }}>
              No matching scenes or canon facts found for the current filter selection.
            </div>
          )}

          {/* Render Chapter Recaps if viewing a chapter or whole book */}
          {selectedTreeId.startsWith('chap_') && (() => {
            const chapId = selectedTreeId.replace('chap_', '');
            const chapter = project.chapters.find(c => c.id === chapId);
            const chapterMemory = (project.chapterMemories || []).find(cm => cm.chapterId === chapId);
            const isEditingChap = editingChapterId === chapId;

            return (
              <div style={{ border: '1px solid var(--accent-purple, #a855f7)', borderRadius: 8, background: 'rgba(168, 85, 247, 0.08)', padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--accent-purple-light)' }}>
                    <BookOpen size={16} />
                    <span>Chapter Recap & High-Level Plot Milestone</span>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEditingChapterMemory(chapId, chapterMemory?.summary || '')} style={{ fontSize: 11, padding: '2px 8px' }}>
                    <Edit3 size={12} /> {chapterMemory?.summary ? 'Edit Recap' : '+ Add Recap'}
                  </button>
                </div>

                {isEditingChap ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    <textarea
                      className="form-textarea"
                      value={editingChapterSummary}
                      onChange={e => setEditingChapterSummary(e.target.value)}
                      rows={3}
                      placeholder="Type a high-level summary of major plot developments in this chapter..."
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingChapterId(null)}>Cancel</button>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => saveChapterMemorySummary(chapId)}>Save Recap</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {chapterMemory?.summary || <span style={{ fontStyle: 'italic', opacity: 0.7 }}>No chapter-level recap recorded yet. Click "+ Add Recap" to write one for high-level AI continuity.</span>}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Unified Scene Memory & Fact Cards */}
          {displayedScenes.map(scene => {
            const memory = project.memoryUpdates.find(m => m.sceneId === scene.id);
            const sceneFacts = project.continuityFacts.filter(f => f.sceneId === scene.id || f.startsAtSceneId === scene.id);
            const isEditingScene = editingSceneId === scene.id;

            return (
              <div key={scene.id} style={{ border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: 8, background: 'var(--bg-tertiary, #161d27)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                
                {/* Card Header: Scene Title & Status */}
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#ffffff' }}>{scene.title}</span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 12,
                      textTransform: 'uppercase',
                      background: scene.status === 'finished' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                      color: scene.status === 'finished' ? '#4ade80' : '#fde047',
                      border: '1px solid',
                      borderColor: scene.status === 'finished' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'
                    }}>
                      {scene.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => openCreateFact(scene.id)}
                      style={{ fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Plus size={12} /> Fact
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => selectScene(scene.id)}
                      style={{ fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Clock size={12} /> Open Scene
                    </button>
                  </div>
                </div>

                {/* Card Body: Summary & Facts */}
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  
                  {/* Section 1: Memory Summary */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        📝 Scene Summary / Memory
                      </span>
                      {memory?.summary && !isEditingScene && (
                        <button type="button" className="btn-icon" onClick={() => startEditingSceneMemory(scene.id, memory.summary)} title="Edit summary">
                          <Pencil size={12} />
                        </button>
                      )}
                    </div>

                    {isEditingScene ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <textarea
                          className="form-textarea"
                          value={editingSceneSummary}
                          onChange={e => setEditingSceneSummary(e.target.value)}
                          rows={3}
                          style={{ fontSize: 13 }}
                        />
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingSceneId(null)}>Cancel</button>
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => saveSceneMemorySummary(scene.id)}>Save Summary</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, background: 'var(--bg-primary, #0d1117)', padding: 12, borderRadius: 6, border: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                        {memory?.summary || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No scene memory recorded. Mark scene status as "Finished" to auto-generate or add manually.</span>}
                      </div>
                    )}
                  </div>

                  {/* Section 2: Established Canon Facts */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                      📜 Established Canon Facts ({sceneFacts.length})
                    </div>

                    {sceneFacts.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {sceneFacts.map(fact => (
                          <div
                            key={fact.id}
                            onClick={() => setSelectedFactId(fact.id)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 6,
                              background: 'var(--bg-primary, #0d1117)',
                              border: '1px solid',
                              borderColor: selectedFactId === fact.id ? 'var(--accent-purple, #a855f7)' : 'var(--border-color, rgba(255,255,255,0.06))',
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              cursor: 'pointer'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--accent-purple-light, #c084fc)' }}>
                                  [{fact.entityName || fact.entityType}]
                                </span>
                                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: fact.status === 'active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: fact.status === 'active' ? '#4ade80' : '#f87171' }}>
                                  {fact.status}
                                </span>
                              </div>
                              <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{fact.factText}</div>
                            </div>

                            <Pencil size={12} color="var(--text-muted)" style={{ marginTop: 4, flexShrink: 0 }} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--text-muted)', background: 'var(--bg-primary, #0d1117)', padding: '8px 12px', borderRadius: 6 }}>
                        No specific canon facts logged for this scene yet. Click "+ Fact" above to log a new worldbuilding fact.
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FACT EDITOR DRAWER / SLIDE-OVER */}
      {factEditorOpen && (
        <div style={{ width: 340, borderLeft: '1px solid var(--border-color, rgba(255,255,255,0.1))', background: 'var(--bg-tertiary, #161d27)', display: 'flex', flexDirection: 'column', padding: 16, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{isCreatingFact ? 'New Continuity Fact' : 'Edit Canon Fact'}</div>
            <button type="button" className="btn-icon" onClick={() => { setSelectedFactId(null); setIsCreatingFact(false); }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11 }}>Entity Type</label>
              <select
                className="form-select"
                value={factDraft.entityType}
                onChange={e => setFactDraft(prev => ({ ...prev, entityType: e.target.value as ContinuityEntityType, entityId: null }))}
              >
                {entityTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11 }}>Status</label>
              <select
                className="form-select"
                value={factDraft.status}
                onChange={e => setFactDraft(prev => ({ ...prev, status: e.target.value as ContinuityFactStatus }))}
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11 }}>Entity Name</label>
              <input
                className="form-input"
                value={factDraft.entityName}
                onChange={e => setFactDraft(prev => ({ ...prev, entityName: e.target.value }))}
                placeholder="e.g. Mara Venn, Iron Gate..."
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11 }}>Fact Statement</label>
              <textarea
                className="form-textarea"
                value={factDraft.factText}
                onChange={e => setFactDraft(prev => ({ ...prev, factText: e.target.value }))}
                rows={4}
                placeholder="State the precise canonical rule or event..."
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11 }}>Source Scene</label>
              <select
                className="form-select"
                value={factDraft.sceneId}
                onChange={e => setFactDraft(prev => ({ ...prev, sceneId: e.target.value }))}
              >
                <option value="">None / General</option>
                {orderedScenes.map(scene => (
                  <option key={scene.id} value={scene.id}>{scene.title}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {!isCreatingFact && (
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setDeleteConfirmOpen(true)} style={{ flex: 1 }}>
                  <Trash2 size={13} /> Delete
                </button>
              )}
              <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveFact} disabled={!factDraft.entityName.trim() || !factDraft.factText.trim()} style={{ flex: 2 }}>
                <Save size={13} /> Save Fact
              </button>
            </div>

            {deleteConfirmOpen && (
              <div style={{ padding: 10, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 6, marginTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f87171', marginBottom: 6 }}>Confirm deletion?</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDeleteConfirmOpen(false)}>Cancel</button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={handleDeleteFact}>Confirm Delete</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
