import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store';
import type { Character, Location, Faction, PowerSystem } from '../../types';
import { ArrowLeft, Clock, Database, GitBranch } from 'lucide-react';

export const BibleItemEditor: React.FC = () => {
  const {
    project,
    activeBibleCategory,
    activeBibleItemId,
    setBibleItemId,
    updateBibleItem,
    createBibleItemVersion,
    loadBibleItemVersions,
    selectScene
  } = useStore();
  const [factFilter, setFactFilter] = useState<'active' | 'superseded' | 'all'>('active');

  const item = project.storyBible[activeBibleCategory].find((i: any) => i.id === activeBibleItemId);
  const textValue = (value: unknown) => typeof value === 'string' ? value : '';
  const initialItemRef = useRef<any | null>(null);
  const storyBibleRef = useRef(project.storyBible);

  storyBibleRef.current = project.storyBible;

  useEffect(() => {
    if (!item || !activeBibleItemId) return;

    initialItemRef.current = JSON.parse(JSON.stringify(item));

    return () => {
      const initialItem = initialItemRef.current;
      const currentItem = (storyBibleRef.current[activeBibleCategory] as any[]).find(i => i.id === activeBibleItemId);
      if (!initialItem || !currentItem || initialItem.id !== activeBibleItemId) return;

      const initialSerialized = JSON.stringify(initialItem);
      const currentSerialized = JSON.stringify(currentItem);
      if (initialSerialized === currentSerialized) return;

      const { id: _id, name, ...data } = initialItem;
      createBibleItemVersion({
        bookId: undefined,
        bibleItemId: activeBibleItemId,
        category: activeBibleCategory,
        name,
        data,
        sourceSceneId: null,
        reason: 'Manual Story Bible edit'
      });
    };
  }, [activeBibleCategory, activeBibleItemId]);

  if (!item) {
    return <div style={{ fontSize: 12, padding: 12 }}>Item not found.</div>;
  }

  const itemVersions = loadBibleItemVersions(item.id);
  const itemFacts = project.continuityFacts
    .filter(fact => fact.entityId === item.id || fact.entityName.toLowerCase() === item.name.toLowerCase())
    .filter(fact => factFilter === 'all' ? true : fact.status === factFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="bible-editor">
      <button 
        type="button"
        className="btn btn-secondary sidebar-icon-label-btn" 
        onClick={() => setBibleItemId(null)}
      >
        <ArrowLeft size={13} />
        Back
      </button>

      <div className="bible-editor-fields">
        <div className="form-group" style={{ marginBottom: 0 }}>
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
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Age</label>
                <input
                  type="text"
                  className="form-input"
                  value={textValue((item as Character).age)}
                  onChange={e => updateBibleItem('characters', { ...item, age: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Role</label>
                <input
                  type="text"
                  className="form-input"
                  value={textValue((item as Character).role)}
                  onChange={e => updateBibleItem('characters', { ...item, role: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Appearance</label>
              <textarea 
                className="form-textarea" 
                value={textValue((item as Character).appearance)}
                onChange={e => updateBibleItem('characters', { ...item, appearance: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Personality</label>
              <textarea 
                className="form-textarea" 
                value={textValue((item as Character).personality)}
                onChange={e => updateBibleItem('characters', { ...item, personality: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Goals</label>
              <textarea 
                className="form-textarea" 
                value={textValue((item as Character).goals)}
                onChange={e => updateBibleItem('characters', { ...item, goals: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Fears</label>
              <textarea 
                className="form-textarea" 
                value={textValue((item as Character).fears)}
                onChange={e => updateBibleItem('characters', { ...item, fears: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Key Facts</label>
              <textarea 
                className="form-textarea" 
                value={textValue((item as Character).keyFacts)}
                onChange={e => updateBibleItem('characters', { ...item, keyFacts: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Relationships</label>
              <textarea 
                className="form-textarea" 
                value={textValue((item as Character).relationships)}
                onChange={e => updateBibleItem('characters', { ...item, relationships: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Abilities & Limitations</label>
              <textarea 
                className="form-textarea" 
                value={textValue((item as Character).abilities)}
                onChange={e => updateBibleItem('characters', { ...item, abilities: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Speech Style</label>
              <textarea 
                className="form-textarea" 
                value={textValue((item as Character).speechStyle)}
                onChange={e => updateBibleItem('characters', { ...item, speechStyle: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">History</label>
              <textarea 
                className="form-textarea" 
                value={textValue((item as Character).history)}
                onChange={e => updateBibleItem('characters', { ...item, history: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Injuries & Physical Limits</label>
              <textarea 
                className="form-textarea" 
                value={textValue((item as Character).injuries)}
                onChange={e => updateBibleItem('characters', { ...item, injuries: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Secrets</label>
              <textarea 
                className="form-textarea" 
                value={textValue((item as Character).secrets)}
                onChange={e => updateBibleItem('characters', { ...item, secrets: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Development Arc</label>
              <textarea 
                className="form-textarea" 
                value={textValue((item as Character).developmentArc)}
                onChange={e => updateBibleItem('characters', { ...item, developmentArc: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Continuity Notes</label>
              <textarea 
                className="form-textarea" 
                value={textValue((item as Character).continuityNotes)}
                onChange={e => updateBibleItem('characters', { ...item, continuityNotes: e.target.value })}
              />
            </div>
          </>
        )}

        {activeBibleCategory === 'locations' && (
          <>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description</label>
              <textarea 
                className="form-textarea" 
                value={(item as Location).description} 
                onChange={e => updateBibleItem('locations', { ...item, description: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Culture & Landmarks</label>
              <textarea 
                className="form-textarea" 
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
              <label className="form-label">Leader</label>
              <input 
                type="text"
                className="form-input" 
                value={(item as Faction).leader} 
                onChange={e => updateBibleItem('factions', { ...item, leader: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Beliefs & Faction Details</label>
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
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Rules & Systems</label>
              <textarea 
                className="form-textarea" 
                value={(item as PowerSystem).rules} 
                onChange={e => updateBibleItem('powerSystems', { ...item, rules: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
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

      <div className="bible-editor-fields">
        <div className="bible-ledger-header">
          <div>
            <div className="sidebar-mini-title">Continuity Ledger</div>
            <div className="sidebar-mini-meta">Canon facts connected to this Bible item.</div>
          </div>
          <Database size={14} />
        </div>
        <div className="ledger-filter-row">
          {(['active', 'superseded', 'all'] as const).map(filter => (
            <button
              key={filter}
              type="button"
              className={`ledger-filter-btn ${factFilter === filter ? 'active' : ''}`}
              onClick={() => setFactFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="ledger-list">
          {itemFacts.length === 0 && (
            <div className="ledger-empty">No {factFilter === 'all' ? '' : factFilter} ledger facts for this item yet.</div>
          )}
          {itemFacts.map(fact => {
            const sourceScene = project.scenes.find(scene => scene.id === fact.sceneId);
            return (
              <div key={fact.id} className="ledger-card">
                <div className="ledger-card-title">
                  <span>{fact.factType || fact.entityType}</span>
                  <span className={`ledger-status ledger-status-${fact.status}`}>{fact.status}</span>
                </div>
                <div className="ledger-card-body">{fact.factText}</div>
                {sourceScene && (
                  <button
                    type="button"
                    className="ledger-source-btn"
                    onClick={() => selectScene(sourceScene.id)}
                  >
                    <Clock size={11} />
                    {sourceScene.title}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bible-editor-fields">
        <div className="bible-ledger-header">
          <div>
            <div className="sidebar-mini-title">Profile Versions</div>
            <div className="sidebar-mini-meta">Snapshots captured when this profile changes.</div>
          </div>
          <GitBranch size={14} />
        </div>
        <div className="ledger-list">
          {itemVersions.length === 0 && (
            <div className="ledger-empty">No profile versions recorded yet.</div>
          )}
          {itemVersions.map(version => {
            const sourceScene = version.sourceSceneId ? project.scenes.find(scene => scene.id === version.sourceSceneId) : null;
            return (
              <div key={version.id} className="ledger-card">
                <div className="ledger-card-title">
                  <span>{version.reason || 'Profile version'}</span>
                  <span>{new Date(version.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="ledger-card-body">
                  Saved previous version of {version.name || item.name}.
                </div>
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
      </div>
    </div>
  );
};
