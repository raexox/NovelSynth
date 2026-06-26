import React from 'react';
import { useStore } from '../../store';
import type { Character, Location, Faction, PowerSystem } from '../../types';
import { ArrowLeft } from 'lucide-react';

export const BibleItemEditor: React.FC = () => {
  const {
    project,
    activeBibleCategory,
    activeBibleItemId,
    setBibleItemId,
    updateBibleItem
  } = useStore();

  const item = project.storyBible[activeBibleCategory].find((i: any) => i.id === activeBibleItemId);
  const textValue = (value: unknown) => typeof value === 'string' ? value : '';

  if (!item) {
    return <div style={{ fontSize: 12, padding: 12 }}>Item not found.</div>;
  }

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
    </div>
  );
};
