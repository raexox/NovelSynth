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
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Appearance</label>
              <textarea 
                className="form-textarea" 
                value={(item as Character).appearance} 
                onChange={e => updateBibleItem('characters', { ...item, appearance: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Personality</label>
              <textarea 
                className="form-textarea" 
                value={(item as Character).personality} 
                onChange={e => updateBibleItem('characters', { ...item, personality: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Goals & Fears</label>
              <textarea 
                className="form-textarea" 
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
              <label className="form-label">Speech Style & Secrets</label>
              <textarea 
                className="form-textarea" 
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
