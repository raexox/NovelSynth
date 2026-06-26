import React, { useState } from 'react';
import { useStore } from '../../store';
import { Plus, RotateCcw, AlertTriangle } from 'lucide-react';

export const DraftHistory: React.FC = () => {
  const {
    project,
    activeSceneId,
    takeSnapshot,
    restoreSnapshot
  } = useStore();

  const [snapshotDesc, setSnapshotDesc] = useState('');
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);

  const activeScene = project.scenes.find(s => s.id === activeSceneId);
  const activeSnapshots = project.snapshots.filter(snap => snap.sceneId === activeSceneId);
  const selectedSnapshot = project.snapshots.find(snap => snap.id === selectedSnapshotId);

  const handleTakeSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotDesc.trim() || !activeSceneId) return;
    takeSnapshot(snapshotDesc);
    setSnapshotDesc('');
  };

  const handleRestoreSnapshot = (snapId: string) => {
    if (confirm("Restore this snapshot? Your current scene text will be updated.")) {
      restoreSnapshot(snapId);
      setSelectedSnapshotId(null);
    }
  };

  if (!activeScene) return null;

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {selectedSnapshotId === null ? (
        <>
          <form onSubmit={handleTakeSnapshot} style={{ display: 'flex', gap: 6 }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Label this draft..."
              value={snapshotDesc}
              onChange={e => setSnapshotDesc(e.target.value)}
              style={{ fontSize: 11.5, padding: '4px 8px' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={12} /> Snap
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', paddingRight: 2 }}>
            {activeSnapshots.map(snap => (
              <div 
                key={snap.id} 
                className="tree-item"
                style={{ padding: 8, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                onClick={() => setSelectedSnapshotId(snap.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: 11, color: 'var(--text-primary)' }}>{snap.description}</span>
                  <span style={{ fontSize: 8.5, color: 'var(--text-muted)' }}>{new Date(snap.timestamp).toLocaleTimeString()}</span>
                </div>
                <span style={{ fontSize: 9.5, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                  {snap.content.substring(0, 60)}...
                </span>
              </div>
            ))}
            {activeSnapshots.length === 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                No snapshots taken yet. Capture one above.
              </div>
            )}
          </div>
        </>
      ) : (
        /* Diff/Preview block inside left sidebar */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
            <button 
              type="button"
              className="btn btn-secondary" 
              style={{ padding: '2px 6px', fontSize: 10.5 }}
              onClick={() => setSelectedSnapshotId(null)}
            >
              &larr; Back
            </button>
            <button 
              type="button"
              className="btn btn-primary" 
              style={{ padding: '2px 6px', fontSize: 10, backgroundColor: 'var(--color-success)', display: 'flex', gap: 3 }}
              onClick={() => handleRestoreSnapshot(selectedSnapshotId)}
            >
              <RotateCcw size={10} /> Restore
            </button>
          </div>
          {selectedSnapshot && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 4, padding: 6, backgroundColor: 'var(--accent-gold-dim)', borderRadius: 4, border: '1px solid var(--accent-gold-dim)' }}>
                <AlertTriangle size={12} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
                <span style={{ fontSize: 9, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  Snapshot: <strong>{selectedSnapshot.description}</strong> ({new Date(selectedSnapshot.timestamp).toLocaleTimeString()})
                </span>
              </div>
              <div 
                style={{ 
                  padding: 6, 
                  fontSize: 10, 
                  lineHeight: 1.4, 
                  backgroundColor: 'var(--bg-primary)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 4, 
                  maxHeight: 110, 
                  overflowY: 'auto',
                  fontFamily: 'var(--font-serif)'
                }}
              >
                {selectedSnapshot.content}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
