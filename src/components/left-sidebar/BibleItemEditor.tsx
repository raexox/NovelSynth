import React from 'react';
import { useStore } from '../../store';
import type { Character, Location, Faction, PowerSystem } from '../../types';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button 
        type="button"
        className="btn btn-secondary" 
        style={{ alignSelf: 'flex-start', padding: '2px 8px', fontSize: 10.5, marginBottom: 4 }}
        onClick={() => setBibleItemId(null)}
      >
        &larr; Back to List
      </button>

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
    </div>
  );
};
