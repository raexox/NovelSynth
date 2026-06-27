import React, { useEffect, useMemo, useState } from 'react';
import {
  Clock,
  Database,
  FileText,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
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

type CanonView = 'facts' | 'memories';
type FactStatusFilter = ContinuityFactStatus | 'all';
type EntityFilter = ContinuityEntityType | 'all';

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

const statuses: FactStatusFilter[] = ['active', 'superseded', 'resolved', 'contradicted', 'all'];
const entityTypes: EntityFilter[] = ['all', 'character', 'location', 'faction', 'powerSystem', 'object', 'timeline', 'relationship'];
const sources: ContinuityFactSource[] = ['memory', 'bible_edit'];

const categoryByEntityType: Partial<Record<ContinuityEntityType, BibleCategory>> = {
  character: 'characters',
  location: 'locations',
  faction: 'factions',
  powerSystem: 'powerSystems'
};

const makeEmptyDraft = (activeSceneId: string | null): FactDraft => ({
  sceneId: activeSceneId || '',
  chapterId: '',
  entityType: 'character',
  entityId: null,
  entityName: '',
  factType: '',
  factText: '',
  status: 'active',
  startsAtSceneId: activeSceneId || '',
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

const getSourceSceneTitle = (fact: ContinuityFact, scenes: ReturnType<typeof sortScenesByBookOrder>) => {
  const scene = scenes.find(s => s.id === fact.sceneId || s.id === fact.startsAtSceneId);
  return scene?.title || 'No source scene';
};

const textIncludes = (value: unknown, query: string) => String(value || '').toLowerCase().includes(query);
const stringList = (value: unknown) => Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];

export const CanonLedger: React.FC = () => {
  const {
    project,
    activeSceneId,
    addContinuityFact,
    updateContinuityFact,
    deleteContinuityFact,
    selectScene
  } = useStore();

  const [view, setView] = useState<CanonView>('facts');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FactStatusFilter>('active');
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all');
  const [selectedFactId, setSelectedFactId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState<FactDraft>(() => makeEmptyDraft(activeSceneId));
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const orderedScenes = useMemo(() => sortScenesByBookOrder(project), [project]);
  const selectedFact = selectedFactId
    ? project.continuityFacts.find(fact => fact.id === selectedFactId) || null
    : null;

  useEffect(() => {
    if (!selectedFact) return;
    setDraft(toDraft(selectedFact));
    setIsCreating(false);
    setDeleteConfirmOpen(false);
  }, [selectedFact]);

  const linkedCategory = categoryByEntityType[draft.entityType];
  const linkedItems = linkedCategory ? project.storyBible[linkedCategory] : [];

  const filteredFacts = project.continuityFacts
    .filter(fact => statusFilter === 'all' || fact.status === statusFilter)
    .filter(fact => entityFilter === 'all' || fact.entityType === entityFilter)
    .filter(fact => {
      const normalizedQuery = query.trim().toLowerCase();
      if (!normalizedQuery) return true;
      return [
        fact.entityName,
        fact.entityType,
        fact.factType,
        fact.factText,
        getSourceSceneTitle(fact, orderedScenes)
      ].some(value => textIncludes(value, normalizedQuery));
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredMemories = project.memoryUpdates
    .filter(memory => {
      const normalizedQuery = query.trim().toLowerCase();
      if (!normalizedQuery) return true;
      const sourceScene = project.scenes.find(scene => scene.id === memory.sceneId);
      return [
        sourceScene?.title || '',
        memory.summary,
        stringList(memory.events).join(' '),
        stringList(memory.newFacts).join(' '),
        stringList(memory.unresolvedQuestions).join(' ')
      ].some(value => textIncludes(value, normalizedQuery));
    })
    .sort((a, b) => {
      const sceneA = orderedScenes.findIndex(scene => scene.id === a.sceneId);
      const sceneB = orderedScenes.findIndex(scene => scene.id === b.sceneId);
      return sceneB - sceneA;
    });

  const openCreate = () => {
    setSelectedFactId(null);
    setDraft(makeEmptyDraft(activeSceneId));
    setIsCreating(true);
    setDeleteConfirmOpen(false);
    setView('facts');
  };

  const updateDraft = <K extends keyof FactDraft>(key: K, value: FactDraft[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const updateSceneDraft = (sceneId: string) => {
    const scene = project.scenes.find(s => s.id === sceneId);
    setDraft(prev => ({
      ...prev,
      sceneId,
      chapterId: scene?.chapterId || '',
      startsAtSceneId: prev.startsAtSceneId || sceneId
    }));
  };

  const updateLinkedItem = (itemId: string) => {
    const linkedItem = linkedItems.find((item: any) => item.id === itemId);
    setDraft(prev => ({
      ...prev,
      entityId: itemId || null,
      entityName: linkedItem?.name || prev.entityName
    }));
  };

  const handleSave = async () => {
    const normalizedDraft: FactDraft = {
      ...draft,
      entityName: draft.entityName.trim(),
      factType: draft.factType.trim(),
      factText: draft.factText.trim(),
      entityId: draft.entityId || null,
      endsAtSceneId: draft.endsAtSceneId || null
    };

    if (!normalizedDraft.entityName || !normalizedDraft.factText) return;

    if (isCreating) {
      const inserted = await addContinuityFact(normalizedDraft);
      setIsCreating(false);
      setSelectedFactId(inserted?.id || null);
      return;
    }

    if (selectedFact) {
      await updateContinuityFact(selectedFact.id, normalizedDraft);
    }
  };

  const handleDelete = async () => {
    if (!selectedFact) return;
    await deleteContinuityFact(selectedFact.id);
    setSelectedFactId(null);
    setIsCreating(false);
    setDeleteConfirmOpen(false);
  };

  const editorOpen = isCreating || selectedFact;

  return (
    <div className="canon-ledger">
      <div className="sidebar-mini-toolbar reference-toolbar">
        <div>
          <div className="sidebar-mini-title">Canon Ledger</div>
          <div className="sidebar-mini-meta">
            {project.continuityFacts.length} fact{project.continuityFacts.length === 1 ? '' : 's'} · {project.memoryUpdates.length} memories
          </div>
        </div>
        <button type="button" className="btn btn-primary sidebar-action-button" onClick={openCreate}>
          <Plus size={13} />
          Fact
        </button>
      </div>

      <div className="canon-view-tabs">
        {([
          ['facts', Database, 'Facts'],
          ['memories', FileText, 'Memories']
        ] as const).map(([tab, Icon, label]) => (
          <button
            key={tab}
            type="button"
            className={`canon-view-tab ${view === tab ? 'active' : ''}`}
            onClick={() => setView(tab)}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      <label className="canon-search">
        <Search size={13} />
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={view === 'facts' ? 'Search canon facts...' : 'Search memories...'}
        />
      </label>

      {view === 'facts' && (
        <>
          <div className="ledger-filter-row canon-filter-row">
            {statuses.map(status => (
              <button
                key={status}
                type="button"
                className={`ledger-filter-btn ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>

          <select
            className="form-select canon-select"
            value={entityFilter}
            onChange={event => setEntityFilter(event.target.value as EntityFilter)}
          >
            {entityTypes.map(entityType => (
              <option key={entityType} value={entityType}>{entityType}</option>
            ))}
          </select>

          <div className="ledger-list canon-list">
            {filteredFacts.length === 0 && (
              <div className="ledger-empty">No matching continuity facts.</div>
            )}
            {filteredFacts.map(fact => (
              <button
                key={fact.id}
                type="button"
                className={`ledger-card canon-fact-card ${selectedFactId === fact.id ? 'selected' : ''}`}
                onClick={() => setSelectedFactId(fact.id)}
              >
                <div className="ledger-card-title">
                  <span>{fact.entityName || fact.entityType}</span>
                  <span className={`ledger-status ledger-status-${fact.status}`}>{fact.status}</span>
                </div>
                <div className="canon-card-meta">{fact.factType || fact.entityType} · {fact.source}</div>
                <div className="ledger-card-body">{fact.factText}</div>
                <div className="canon-card-meta">
                  <Clock size={11} />
                  {getSourceSceneTitle(fact, orderedScenes)}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {view === 'memories' && (
        <div className="ledger-list canon-list">
          {filteredMemories.length === 0 && (
            <div className="ledger-empty">No matching scene memories.</div>
          )}
          {filteredMemories.map(memory => {
            const sourceScene = project.scenes.find(scene => scene.id === memory.sceneId);
            return (
              <div key={memory.sceneId} className="ledger-card canon-memory-card">
                <div className="ledger-card-title">
                  <span>{sourceScene?.title || 'Unknown scene'}</span>
                  <span className={`ledger-status ledger-status-${memory.status === 'approved' ? 'active' : 'superseded'}`}>
                    {memory.status}
                  </span>
                </div>
                <div className="ledger-card-body">{memory.summary || 'No summary recorded.'}</div>
                {stringList(memory.newFacts).length > 0 && (
                  <div className="canon-memory-section">
                    <strong>Facts</strong>
                    {stringList(memory.newFacts).slice(0, 4).map((fact, index) => (
                      <span key={`${memory.sceneId}-fact-${index}`}>{fact}</span>
                    ))}
                  </div>
                )}
                {sourceScene && (
                  <button type="button" className="ledger-source-btn" onClick={() => selectScene(sourceScene.id)}>
                    <Clock size={11} />
                    {sourceScene.title}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editorOpen && view === 'facts' && (
        <div className="canon-editor-panel">
          <div className="bible-ledger-header">
            <div>
              <div className="sidebar-mini-title">{isCreating ? 'New Continuity Fact' : 'Edit Continuity Fact'}</div>
              <div className="sidebar-mini-meta">Controls what future continuity checks treat as canon.</div>
            </div>
            <button
              type="button"
              className="btn-icon"
              onClick={() => {
                setSelectedFactId(null);
                setIsCreating(false);
              }}
              aria-label="Close fact editor"
            >
              <X size={15} />
            </button>
          </div>

          <div className="canon-form-grid">
            <div className="form-group">
              <label className="form-label">Entity Type</label>
              <select
                className="form-select"
                value={draft.entityType}
                onChange={event => {
                  updateDraft('entityType', event.target.value as ContinuityEntityType);
                  updateDraft('entityId', null);
                }}
              >
                {entityTypes.filter(type => type !== 'all').map(entityType => (
                  <option key={entityType} value={entityType}>{entityType}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={draft.status}
                onChange={event => updateDraft('status', event.target.value as ContinuityFactStatus)}
              >
                {statuses.filter(status => status !== 'all').map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {linkedCategory && (
            <div className="form-group">
              <label className="form-label">Linked Bible Item</label>
              <select
                className="form-select"
                value={draft.entityId || ''}
                onChange={event => updateLinkedItem(event.target.value)}
              >
                <option value="">None</option>
                {linkedItems.map((item: any) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Entity Name</label>
            <input
              className="form-input"
              value={draft.entityName}
              onChange={event => updateDraft('entityName', event.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Fact Type</label>
            <input
              className="form-input"
              value={draft.factType}
              onChange={event => updateDraft('factType', event.target.value)}
              placeholder="appearance, ability, relationship, timeline..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Fact Text</label>
            <textarea
              className="form-textarea"
              value={draft.factText}
              onChange={event => updateDraft('factText', event.target.value)}
            />
          </div>

          <div className="canon-form-grid">
            <div className="form-group">
              <label className="form-label">Source Scene</label>
              <select
                className="form-select"
                value={draft.sceneId}
                onChange={event => updateSceneDraft(event.target.value)}
              >
                <option value="">None</option>
                {orderedScenes.map(scene => (
                  <option key={scene.id} value={scene.id}>{scene.title}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Source</label>
              <select
                className="form-select"
                value={draft.source}
                onChange={event => updateDraft('source', event.target.value as ContinuityFactSource)}
              >
                {sources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="canon-form-grid">
            <div className="form-group">
              <label className="form-label">Starts At</label>
              <select
                className="form-select"
                value={draft.startsAtSceneId}
                onChange={event => updateDraft('startsAtSceneId', event.target.value)}
              >
                <option value="">Beginning</option>
                {orderedScenes.map(scene => (
                  <option key={scene.id} value={scene.id}>{scene.title}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Ends At</label>
              <select
                className="form-select"
                value={draft.endsAtSceneId || ''}
                onChange={event => updateDraft('endsAtSceneId', event.target.value || null)}
              >
                <option value="">Still active</option>
                {orderedScenes.map(scene => (
                  <option key={scene.id} value={scene.id}>{scene.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="canon-editor-actions">
            {!isCreating && (
              <button
                type="button"
                className="btn btn-danger sidebar-icon-label-btn"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 size={13} />
                Delete
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary sidebar-icon-label-btn"
              onClick={() => updateDraft('status', 'superseded')}
            >
              <Pencil size={13} />
              Supersede
            </button>
            <button
              type="button"
              className="btn btn-primary sidebar-icon-label-btn"
              onClick={handleSave}
              disabled={!draft.entityName.trim() || !draft.factText.trim()}
            >
              <Save size={13} />
              Save
            </button>
          </div>

          {deleteConfirmOpen && (
            <div className="inline-confirm-panel">
              <div>
                <strong>Delete this fact?</strong>
                <span>This removes it from future continuity context.</span>
              </div>
              <div className="inline-confirm-actions">
                <button type="button" className="btn btn-secondary sidebar-icon-label-btn" onClick={() => setDeleteConfirmOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger sidebar-icon-label-btn" onClick={handleDelete}>
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
