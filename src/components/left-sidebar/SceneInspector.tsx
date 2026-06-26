import React from 'react';
import { useStore } from '../../store';
import { User, MapPin, Calendar, Clock, BookOpen, FileText, Save } from 'lucide-react';

export const SceneInspector: React.FC = () => {
  const { project, activeSceneId, updateSceneMetadata, updateScene } = useStore();
  const activeScene = project.scenes.find(s => s.id === activeSceneId);

  if (!activeScene) return null;

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

      {/* Date & Time */}
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
    </div>
  );
};
