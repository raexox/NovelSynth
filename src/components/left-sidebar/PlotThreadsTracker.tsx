import React from 'react';
import { useStore } from '../../store';

export const PlotThreadsTracker: React.FC = () => {
  const { project, addPlotThread, updatePlotThread } = useStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>PLOT THREADS TRACKER</span>
        <button 
          type="button"
          className="btn btn-primary" 
          style={{ padding: '2px 6px', fontSize: 10.5 }}
          onClick={() => addPlotThread({ title: 'New Mystery Arc', type: 'mystery', status: 'active', description: '' })}
        >
          + Add
        </button>
      </div>

      <div className="plot-threads-grid" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {project.plotThreads.map(pt => (
          <div 
            key={pt.id} 
            style={{ 
              padding: 10, 
              backgroundColor: 'var(--bg-tertiary)', 
              borderRadius: 6, 
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
              <input 
                type="text" 
                className="form-input" 
                style={{ fontWeight: 600, background: 'none', border: 'none', padding: 0, height: 'auto', color: 'var(--text-primary)', fontSize: 12.5 }}
                value={pt.title} 
                onChange={e => updatePlotThread({ ...pt, title: e.target.value })}
              />
              <select 
                value={pt.status} 
                onChange={e => updatePlotThread({ ...pt, status: e.target.value as any })}
                style={{ fontSize: 9.5, background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: 4, padding: '1px 3px' }}
              >
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <textarea 
              className="form-textarea" 
              style={{ fontSize: 11, padding: 4, minHeight: 50, marginBottom: 0 }}
              value={pt.description} 
              onChange={e => updatePlotThread({ ...pt, description: e.target.value })}
              placeholder="Thread summary / notes..."
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <select 
                value={pt.type} 
                onChange={e => updatePlotThread({ ...pt, type: e.target.value as any })}
                style={{ fontSize: 9.5, background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: 4, padding: '1px 3px' }}
              >
                <option value="mystery">Mystery</option>
                <option value="question">Question</option>
                <option value="foreshadow">Foreshadow</option>
                <option value="promise">Promise</option>
                <option value="goal">Goal</option>
                <option value="conflict">Conflict</option>
              </select>

              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                Active Thread
              </span>
            </div>
          </div>
        ))}
        {project.plotThreads.length === 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
            No plot threads tracked yet. Click "+ Add".
          </div>
        )}
      </div>
    </div>
  );
};
