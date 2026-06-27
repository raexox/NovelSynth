import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { User, MapPin, Calendar, Clock, BookOpen, FileText, Save, Plus, X, Edit3 } from 'lucide-react';

export const SceneInspector: React.FC = () => {
  const { project, activeSceneId, updateSceneMetadata, updateScene } = useStore();
  const activeScene = project.scenes.find(s => s.id === activeSceneId);

  const [isCustomPov, setIsCustomPov] = useState(false);
  const [isCustomLoc, setIsCustomLoc] = useState(false);

  const bibleCharacters = project.storyBible?.characters || [];
  const bibleLocations = project.storyBible?.locations || [];

  const currentPov = activeScene?.metadata?.pov || '';
  const currentLocation = activeScene?.metadata?.location || '';

  // Reset custom states when active scene changes
  useEffect(() => {
    setIsCustomPov(false);
    setIsCustomLoc(false);
  }, [activeSceneId]);

  if (!activeScene) return null;

  // Build options list ensuring current value is included
  const povOptions = Array.from(new Set([
    ...bibleCharacters.map(c => c.name),
    ...(currentPov && !bibleCharacters.some(c => c.name === currentPov) ? [currentPov] : [])
  ]));

  const locationOptions = Array.from(new Set([
    ...bibleLocations.map(l => l.name),
    ...(currentLocation && !bibleLocations.some(l => l.name === currentLocation) ? [currentLocation] : [])
  ]));

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Title */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" style={{ fontSize: 9.5, display: 'flex', alignItems: 'center', gap: 4 }}>
          <BookOpen size={10} /> Scene Title
        </label>
        <input 
          type="text" 
          className="form-input" 
          style={{ padding: '4px 8px', fontSize: 11.5 }}
          value={activeScene.title} 
          onChange={e => updateScene(activeScene.id, { title: e.target.value })}
          placeholder="Scene title..."
        />
      </div>

      {/* POV & Location */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {/* POV Character Selector */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <label className="form-label" style={{ fontSize: 9.5, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 0 }}>
              <User size={10} /> POV Character
            </label>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', fontSize: 9, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 2 }}
              onClick={() => setIsCustomPov(!isCustomPov)}
              title={isCustomPov ? "Select from Story Bible" : "Type custom name"}
            >
              {isCustomPov ? <BookOpen size={9} /> : <Edit3 size={9} />}
              <span>{isCustomPov ? 'Bible List' : 'Custom'}</span>
            </button>
          </div>

          {isCustomPov ? (
            <input 
              type="text" 
              className="form-input" 
              style={{ padding: '4px 8px', fontSize: 11.5 }}
              value={currentPov} 
              onChange={e => updateSceneMetadata(activeScene.id, { pov: e.target.value })}
              placeholder="Enter character name..."
              autoFocus
            />
          ) : (
            <select
              className="form-select"
              style={{ padding: '4px 8px', fontSize: 11.5 }}
              value={currentPov}
              onChange={e => {
                if (e.target.value === '__CUSTOM__') {
                  setIsCustomPov(true);
                } else {
                  updateSceneMetadata(activeScene.id, { pov: e.target.value });
                }
              }}
            >
              {povOptions.length === 0 && <option value="">No characters in Bible</option>}
              {povOptions.map((name, idx) => (
                <option key={idx} value={name}>{name}</option>
              ))}
              <option value="__CUSTOM__">+ Enter custom name...</option>
            </select>
          )}
        </div>

        {/* Location Selector */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <label className="form-label" style={{ fontSize: 9.5, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 0 }}>
              <MapPin size={10} /> Location
            </label>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', fontSize: 9, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 2 }}
              onClick={() => setIsCustomLoc(!isCustomLoc)}
              title={isCustomLoc ? "Select from Story Bible" : "Type custom location"}
            >
              {isCustomLoc ? <BookOpen size={9} /> : <Edit3 size={9} />}
              <span>{isCustomLoc ? 'Bible List' : 'Custom'}</span>
            </button>
          </div>

          {isCustomLoc ? (
            <input 
              type="text" 
              className="form-input" 
              style={{ padding: '4px 8px', fontSize: 11.5 }}
              value={currentLocation} 
              onChange={e => updateSceneMetadata(activeScene.id, { location: e.target.value })}
              placeholder="Enter location..."
              autoFocus
            />
          ) : (
            <select
              className="form-select"
              style={{ padding: '4px 8px', fontSize: 11.5 }}
              value={currentLocation}
              onChange={e => {
                if (e.target.value === '__CUSTOM__') {
                  setIsCustomLoc(true);
                } else {
                  updateSceneMetadata(activeScene.id, { location: e.target.value });
                }
              }}
            >
              {locationOptions.length === 0 && <option value="">No locations in Bible</option>}
              {locationOptions.map((name, idx) => (
                <option key={idx} value={name}>{name}</option>
              ))}
              <option value="__CUSTOM__">+ Enter custom location...</option>
            </select>
          )}
        </div>
      </div>

      {/* Date & Time (Optional) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <label className="form-label" style={{ fontSize: 9.5, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 0 }}>
              <Calendar size={10} /> Date <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Opt)</span>
            </label>
            {activeScene.metadata.date && (
              <button
                type="button"
                onClick={() => updateSceneMetadata(activeScene.id, { date: '' })}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                title="Clear date"
              >
                <X size={10} />
              </button>
            )}
          </div>
          <input 
            type="text" 
            className="form-input" 
            style={{ padding: '4px 8px', fontSize: 11.5 }}
            value={activeScene.metadata.date || ''} 
            onChange={e => updateSceneMetadata(activeScene.id, { date: e.target.value })}
            placeholder="Optional date..."
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <label className="form-label" style={{ fontSize: 9.5, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 0 }}>
              <Clock size={10} /> Time <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Opt)</span>
            </label>
            {activeScene.metadata.time && (
              <button
                type="button"
                onClick={() => updateSceneMetadata(activeScene.id, { time: '' })}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                title="Clear time"
              >
                <X size={10} />
              </button>
            )}
          </div>
          <input 
            type="text" 
            className="form-input" 
            style={{ padding: '4px 8px', fontSize: 11.5 }}
            value={activeScene.metadata.time || ''} 
            onChange={e => updateSceneMetadata(activeScene.id, { time: e.target.value })}
            placeholder="Optional time..."
          />
        </div>
      </div>

      {/* Status */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" style={{ fontSize: 9.5, display: 'flex', alignItems: 'center', gap: 4 }}>
          Status
        </label>
        <select
          className="form-select"
          style={{ padding: '4px 8px', fontSize: 11.5 }}
          value={activeScene.status}
          onChange={e => updateScene(activeScene.id, { status: e.target.value as any })}
        >
          <option value="draft">Draft</option>
          <option value="review">Under Review</option>
          <option value="finished">Finished</option>
        </select>
      </div>

      {/* Metadata Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
        <div style={{ background: 'var(--bg-primary)', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 8.5, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
            <FileText size={9} /> Word Count
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
            {activeScene.wordCount || 0} words
          </div>
        </div>
        <div style={{ background: 'var(--bg-primary)', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 8.5, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
            <Save size={9} /> Last Saved
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
            {activeScene.lastSaved ? new Date(activeScene.lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
          </div>
        </div>
      </div>

      {/* Scene Outline & Beats Summary */}
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Scene Plot Beats
        </div>
        {activeScene.outline?.beats && activeScene.outline.beats.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {activeScene.outline.beats.map((b, i) => (
              <div key={b.id} style={{ fontSize: 11, color: b.completed ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: b.completed ? 'line-through' : 'none', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{i+1}.</span>
                <span>{b.text}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No plot beats defined. Switch to Outline Studio to add beats.
          </div>
        )}
      </div>
    </div>
  );
};
