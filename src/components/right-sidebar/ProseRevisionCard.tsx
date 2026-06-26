import React from 'react';
import { useStore } from '../../store';
import { Check, X } from 'lucide-react';

export const ProseRevisionCard: React.FC<{ revisionMode: string }> = ({ revisionMode }) => {
  const {
    project,
    activeSceneId,
    revisionSuggestions,
    clearAISuggestions,
    updateSceneContent
  } = useStore();

  const activeScene = project.scenes.find(s => s.id === activeSceneId);

  const handleApplyRevision = () => {
    if (!activeScene || !revisionSuggestions) return;
    updateSceneContent(activeScene.id, revisionSuggestions.revised);
    clearAISuggestions();
  };

  const handleRejectRevision = () => {
    clearAISuggestions();
  };

  if (!revisionSuggestions) return null;

  return (
    <div className="sidebar-section-card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--accent-purple)', borderRadius: 6, padding: 10, display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Suggested Prose Revision</span>
        <button type="button" className="btn-icon" onClick={() => clearAISuggestions()} style={{ padding: 2 }}><X size={12} /></button>
      </div>

      {revisionMode !== 'dev' ? (
        <>
          <div 
            className="diff-view"
            style={{ maxHeight: 160, overflowY: 'auto', margin: 0, padding: 8, fontSize: 12.5 }}
            dangerouslySetInnerHTML={{ __html: revisionSuggestions.diffHtml }}
          />
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: 6, borderRadius: 4, lineHeight: 1.4 }}>
            <strong>AI Explanation:</strong> {revisionSuggestions.explanation}
          </div>
          <div className="suggestion-actions" style={{ marginTop: 2 }}>
            <button 
              type="button"
              className="btn btn-primary" 
              style={{ flex: 1, backgroundColor: 'var(--color-success)', display: 'flex', gap: 3, padding: '4px 8px', fontSize: 11 }}
              onClick={handleApplyRevision}
            >
              <Check size={12} /> Apply Edits
            </button>
            <button 
              type="button"
              className="btn btn-secondary" 
              style={{ flex: 1, display: 'flex', gap: 3, padding: '4px 8px', fontSize: 11 }}
              onClick={handleRejectRevision}
            >
              <X size={12} /> Reject
            </button>
          </div>
        </>
      ) : (
        <div style={{ fontSize: 11.5, color: 'var(--text-primary)', background: 'var(--bg-primary)', padding: 8, borderRadius: 4, whiteSpace: 'pre-line', maxHeight: 150, overflowY: 'auto', lineHeight: 1.4 }}>
          {revisionSuggestions.explanation}
        </div>
      )}
    </div>
  );
};
