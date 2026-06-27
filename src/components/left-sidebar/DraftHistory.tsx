import React, { useState } from 'react';
import { useStore } from '../../store';
import { Plus, RotateCcw, AlertTriangle, X, ArrowLeftRight, FileText, Clock } from 'lucide-react';

type DraftReviewTab = 'diff' | 'snapshot' | 'current';

const escapeHtml = (text: string) => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const buildWordDiffHtml = (snapshotText: string, currentText: string) => {
  const oldWords = snapshotText.split(/(\s+)/);
  const newWords = currentText.split(/(\s+)/);
  const rows = oldWords.length + 1;
  const cols = newWords.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = oldWords.length - 1; i >= 0; i--) {
    for (let j = newWords.length - 1; j >= 0; j--) {
      dp[i][j] = oldWords[i] === newWords[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  let i = 0;
  let j = 0;
  let html = '';

  while (i < oldWords.length && j < newWords.length) {
    if (oldWords[i] === newWords[j]) {
      html += escapeHtml(oldWords[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      html += `<span class="draft-diff-delete">${escapeHtml(oldWords[i])}</span>`;
      i++;
    } else {
      html += `<span class="draft-diff-insert">${escapeHtml(newWords[j])}</span>`;
      j++;
    }
  }

  while (i < oldWords.length) {
    html += `<span class="draft-diff-delete">${escapeHtml(oldWords[i])}</span>`;
    i++;
  }

  while (j < newWords.length) {
    html += `<span class="draft-diff-insert">${escapeHtml(newWords[j])}</span>`;
    j++;
  }

  return html || '<span class="draft-review-muted">No text to compare.</span>';
};

export const DraftHistory: React.FC = () => {
  const {
    project,
    activeSceneId,
    takeSnapshot,
    restoreSnapshot
  } = useStore();

  const [snapshotDesc, setSnapshotDesc] = useState('');
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [reviewTab, setReviewTab] = useState<DraftReviewTab>('diff');
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);

  const activeScene = project.scenes.find(s => s.id === activeSceneId);
  const activeSnapshots = project.snapshots.filter(snap => snap.sceneId === activeSceneId);
  const selectedSnapshot = project.snapshots.find(snap => snap.id === selectedSnapshotId);

  const handleTakeSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotDesc.trim() || !activeSceneId) return;
    takeSnapshot(snapshotDesc);
    setSnapshotDesc('');
  };

  const openSnapshotReview = (snapId: string) => {
    setSelectedSnapshotId(snapId);
    setReviewTab('diff');
    setRestoreConfirmOpen(false);
  };

  const handleRestoreSnapshot = () => {
    if (!selectedSnapshotId) return;
    restoreSnapshot(selectedSnapshotId);
    setRestoreConfirmOpen(false);
    setSelectedSnapshotId(null);
  };

  if (!activeScene) return null;

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                onClick={() => openSnapshotReview(snap.id)}
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

      {selectedSnapshot && (
        <div className="draft-review-overlay" role="dialog" aria-modal="true" aria-labelledby="draft-review-title">
          <div className="draft-review-modal">
            <div className="draft-review-header">
              <div className="draft-review-title-block">
                <div id="draft-review-title" className="draft-review-title">
                  <FileText size={16} />
                  {selectedSnapshot.description}
                </div>
                <div className="draft-review-meta">
                  <Clock size={12} />
                  {new Date(selectedSnapshot.timestamp).toLocaleDateString()} at {new Date(selectedSnapshot.timestamp).toLocaleTimeString()}
                </div>
              </div>
              <div className="draft-review-actions">
                <button type="button" className="btn btn-secondary sidebar-icon-label-btn" onClick={() => setRestoreConfirmOpen(true)}>
                  <RotateCcw size={13} />
                  Restore
                </button>
                <button type="button" className="btn-icon" onClick={() => setSelectedSnapshotId(null)} aria-label="Close draft review">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="draft-review-tabs">
              {([
                ['diff', 'Changes', ArrowLeftRight],
                ['snapshot', 'Snapshot', FileText],
                ['current', 'Current', FileText]
              ] as const).map(([tab, label, Icon]) => (
                <button
                  key={tab}
                  type="button"
                  className={`draft-review-tab ${reviewTab === tab ? 'active' : ''}`}
                  onClick={() => setReviewTab(tab)}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>

            <div className="draft-review-body">
              {reviewTab === 'diff' && (
                <div className="draft-review-pane draft-review-diff">
                  <div className="draft-review-legend">
                    <span><mark className="draft-diff-delete">Removed from snapshot</mark></span>
                    <span><mark className="draft-diff-insert">Added in current draft</mark></span>
                  </div>
                  <div
                    className="draft-review-text"
                    dangerouslySetInnerHTML={{ __html: buildWordDiffHtml(selectedSnapshot.content, activeScene.content) }}
                  />
                </div>
              )}

              {reviewTab === 'snapshot' && (
                <div className="draft-review-pane">
                  <div className="draft-review-pane-label">Snapshot Draft</div>
                  <div className="draft-review-text">{selectedSnapshot.content}</div>
                </div>
              )}

              {reviewTab === 'current' && (
                <div className="draft-review-pane">
                  <div className="draft-review-pane-label">Current Draft</div>
                  <div className="draft-review-text">{activeScene.content}</div>
                </div>
              )}
            </div>

            {restoreConfirmOpen && (
              <div className="draft-restore-confirm">
                <AlertTriangle size={16} />
                <div>
                  <strong>Restore this snapshot?</strong>
                  <span>Your current scene text will be replaced with this draft.</span>
                </div>
                <button type="button" className="btn btn-secondary sidebar-icon-label-btn" onClick={() => setRestoreConfirmOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger sidebar-icon-label-btn" onClick={handleRestoreSnapshot}>
                  <RotateCcw size={13} />
                  Restore
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
