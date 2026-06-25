import React, { useState } from 'react';
import { useStore } from '../store';
import { History, Plus, RotateCcw, AlertTriangle, ArrowLeftRight } from 'lucide-react';

export const VersionHistory: React.FC = () => {
  const { project, activeSceneId, takeSnapshot, restoreSnapshot } = useStore();
  const [snapshotDesc, setSnapshotDesc] = useState('');
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);

  const activeScene = project.scenes.find(s => s.id === activeSceneId);
  const activeSnapshots = project.snapshots.filter(snap => snap.sceneId === activeSceneId);
  const selectedSnapshot = project.snapshots.find(snap => snap.id === selectedSnapshotId);

  const handleTakeSnapshotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotDesc.trim() || !activeSceneId) return;
    takeSnapshot(snapshotDesc);
    setSnapshotDesc('');
  };

  const handleRestore = (snapId: string) => {
    if (confirm("Are you sure you want to restore this draft? Your current scene text will be updated.")) {
      restoreSnapshot(snapId);
      setSelectedSnapshotId(null);
    }
  };

  if (!activeScene) {
    return (
      <div style={{ padding: 16, color: 'var(--text-muted)' }}>
        Select a scene to view version logs.
      </div>
    );
  }

  return (
    <div style={{ padding: 16, backgroundColor: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', width: 300, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <History size={16} style={{ color: 'var(--accent-purple)' }} />
        <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Draft History</span>
      </div>

      {/* Take Snapshot Form */}
      <form onSubmit={handleTakeSnapshotSubmit} style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="Label this draft..."
          value={snapshotDesc}
          onChange={e => setSnapshotDesc(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '8px 10px', display: 'flex', gap: 4 }}>
          <Plus size={14} /> Snap
        </button>
      </form>

      {/* Snapshot List & Details */}
      {selectedSnapshotId === null ? (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="form-label">Snapshots for "{activeScene.title}"</span>
          {activeSnapshots.map(snap => (
            <div 
              key={snap.id} 
              className="tree-item"
              style={{ padding: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', backgroundColor: 'var(--bg-tertiary)' }}
              onClick={() => setSelectedSnapshotId(snap.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>{snap.description}</span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{new Date(snap.timestamp).toLocaleTimeString()}</span>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                {snap.content.substring(0, 60)}...
              </span>
            </div>
          ))}
          {activeSnapshots.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
              No snapshots taken yet. Capture one above.
            </div>
          )}
        </div>
      ) : (
        // Comparison View Details
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '2px 8px', fontSize: 11 }}
              onClick={() => setSelectedSnapshotId(null)}
            >
              &larr; Back to List
            </button>
            <button 
              className="btn btn-primary" 
              style={{ padding: '2px 8px', fontSize: 11, backgroundColor: 'var(--color-success)', display: 'flex', gap: 4 }}
              onClick={() => handleRestore(selectedSnapshotId)}
            >
              <RotateCcw size={12} /> Restore Draft
            </button>
          </div>

          {selectedSnapshot && (
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6, padding: 8, backgroundColor: 'var(--accent-gold-dim)', border: '1px solid var(--accent-gold-dim)', borderRadius: 4 }}>
                <AlertTriangle size={14} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  Showing snapshot: <strong>{selectedSnapshot.description}</strong> taken {new Date(selectedSnapshot.timestamp).toLocaleDateString()} at {new Date(selectedSnapshot.timestamp).toLocaleTimeString()}.
                </span>
              </div>

              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ArrowLeftRight size={12} />
                  Historical Content
                </label>
                <div 
                  className="editor-preview" 
                  style={{ 
                    padding: 10, 
                    fontSize: 12, 
                    lineHeight: 1.5, 
                    backgroundColor: 'var(--bg-tertiary)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 4, 
                    maxHeight: '220px', 
                    overflowY: 'auto' 
                  }}
                >
                  {selectedSnapshot.content}
                </div>
              </div>

              <div>
                <label className="form-label">Current Draft Content</label>
                <div 
                  className="editor-preview" 
                  style={{ 
                    padding: 10, 
                    fontSize: 12, 
                    lineHeight: 1.5, 
                    backgroundColor: 'var(--bg-tertiary)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 4, 
                    maxHeight: '220px', 
                    overflowY: 'auto' 
                  }}
                >
                  {activeScene.content}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
