import React from 'react';
import { useStore } from '../../store';
import { User, MapPin, Calendar, Clock } from 'lucide-react';

export const SceneInspector: React.FC = () => {
  const { project, activeSceneId, updateSceneMetadata } = useStore();
  const activeScene = project.scenes.find(s => s.id === activeSceneId);

  if (!activeScene) return null;

  return (
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
  );
};
