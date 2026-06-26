import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { 
  Book, Compass, ChevronDown, ChevronRight
} from 'lucide-react';
import { ManuscriptOutline } from './ManuscriptOutline';
import { SceneInspector } from './SceneInspector';
import { DraftHistory } from './DraftHistory';
import { ReferenceLibrary } from './ReferenceLibrary';

export const LeftSidebar: React.FC = () => {
  const { project, activeSceneId, activeLeftTab, setLeftTab } = useStore();

  // Collapsible states in Manuscript
  const [outlineExpanded, setOutlineExpanded] = useState(true);
  const [propertiesExpanded, setPropertiesExpanded] = useState(true);
  const [snapshotsExpanded, setSnapshotsExpanded] = useState(false);
  const [conflictsExpanded, setConflictsExpanded] = useState(true);

  const activeScene = project.scenes.find(s => s.id === activeSceneId);

  // Automatically expand snapshots section if user clicks History Snapshot in the header
  useEffect(() => {
    if (activeLeftTab === 'history') {
      setSnapshotsExpanded(true);
    }
  }, [activeLeftTab]);

  // Timeline Conflict Analysis
  const getTimelineErrors = () => {
    const sortedScenes = [...project.scenes].sort((a, b) => {
      const chA = project.chapters.find(c => c.id === a.chapterId);
      const chB = project.chapters.find(c => c.id === b.chapterId);
      if (!chA || !chB) return 0;
      if (chA.order !== chB.order) return chA.order - chB.order;
      return a.order - b.order;
    });

    const errors: string[] = [];

    // Check Date Chronology
    for (let i = 1; i < sortedScenes.length; i++) {
      const prev = sortedScenes[i - 1];
      const curr = sortedScenes[i];
      if (prev.metadata.date && curr.metadata.date) {
        if (curr.metadata.date < prev.metadata.date) {
          errors.push(`Scene "${curr.title}" (set on ${curr.metadata.date}) is placed after "${prev.title}" (set on ${prev.metadata.date}) in the manuscript, but occurs earlier in time.`);
        }
      }
    }

    // Check Character Teleportation
    for (let i = 0; i < sortedScenes.length; i++) {
      for (let j = i + 1; j < sortedScenes.length; j++) {
        const s1 = sortedScenes[i];
        const s2 = sortedScenes[j];
        if (s1.metadata.date === s2.metadata.date && s1.metadata.time === s2.metadata.time && s1.metadata.location !== s2.metadata.location) {
          const overlappingChars = s1.metadata.characters.filter(c => s2.metadata.characters.includes(c));
          if (overlappingChars.length > 0) {
            errors.push(`${overlappingChars.join(', ')} registered in both "${s1.title}" (at ${s1.metadata.location}) and "${s2.title}" (at ${s2.metadata.location}) at exactly ${s1.metadata.date} ${s1.metadata.time}.`);
          }
        }
      }
    }

    return errors;
  };

  const timelineErrors = getTimelineErrors();
  const isManuscriptTab = activeLeftTab === 'novel' || activeLeftTab === 'history';
  const isReferenceTab = activeLeftTab === 'bible' || activeLeftTab === 'plots' || activeLeftTab === 'notes' || activeLeftTab === 'search';

  return (
    <div className="sidebar-container">
      {/* Visual Top Tabs */}
      <div className="sidebar-tabs-pill-container" style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', background: 'var(--bg-primary)', padding: 3, borderRadius: 8, border: '1px solid var(--border-color)' }}>
          <button 
            type="button"
            className="sidebar-tab-pill-btn"
            style={{
              flex: 1,
              padding: '6px 8px',
              border: 'none',
              background: isManuscriptTab ? 'var(--bg-tertiary)' : 'none',
              color: isManuscriptTab ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderRadius: 6,
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
              boxShadow: isManuscriptTab ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
            }}
            onClick={() => setLeftTab('novel')}
          >
            <Book size={13} style={{ color: isManuscriptTab ? 'var(--accent-purple)' : 'inherit' }} />
            Manuscript
          </button>
          <button 
            type="button"
            className="sidebar-tab-pill-btn"
            style={{
              flex: 1,
              padding: '6px 8px',
              border: 'none',
              background: isReferenceTab ? 'var(--bg-tertiary)' : 'none',
              color: isReferenceTab ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderRadius: 6,
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
              boxShadow: isReferenceTab ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
            }}
            onClick={() => {
              if (activeLeftTab !== 'bible' && activeLeftTab !== 'plots' && activeLeftTab !== 'notes' && activeLeftTab !== 'search') {
                setLeftTab('bible');
              }
            }}
          >
            <Compass size={13} style={{ color: isReferenceTab ? 'var(--accent-purple)' : 'inherit' }} />
            Reference Library
          </button>
        </div>
      </div>

      <div className="sidebar-content" style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {isManuscriptTab && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Outline Card */}
            <div className="sidebar-section-card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 6, overflow: 'hidden' }}>
              <div 
                className="sidebar-section-card-header"
                style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: outlineExpanded ? '1px solid var(--border-color)' : 'none', backgroundColor: 'var(--bg-secondary)' }}
                onClick={() => setOutlineExpanded(!outlineExpanded)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', fontWeight: 600, fontSize: 12 }}>
                  {outlineExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>MANUSCRIPT OUTLINE</span>
                </div>
              </div>
              {outlineExpanded && <ManuscriptOutline />}
            </div>

            {/* Scene Properties Inspector Card */}
            {activeScene && (
              <div className="sidebar-section-card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 6, overflow: 'hidden' }}>
                <div 
                  className="sidebar-section-card-header"
                  style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', backgroundColor: 'var(--bg-secondary)', borderBottom: propertiesExpanded ? '1px solid var(--border-color)' : 'none' }}
                  onClick={() => setPropertiesExpanded(!propertiesExpanded)}
                >
                  {propertiesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px' }}>SCENE PROPERTIES: {activeScene.title.toUpperCase()}</span>
                </div>
                {propertiesExpanded && <SceneInspector />}
              </div>
            )}

            {/* Scene Snapshots Card */}
            {activeScene && (
              <div className="sidebar-section-card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 6, overflow: 'hidden' }}>
                <div 
                  className="sidebar-section-card-header"
                  style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', backgroundColor: 'var(--bg-secondary)', borderBottom: snapshotsExpanded ? '1px solid var(--border-color)' : 'none' }}
                  onClick={() => setSnapshotsExpanded(!snapshotsExpanded)}
                >
                  {snapshotsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px' }}>DRAFT HISTORY</span>
                </div>
                {snapshotsExpanded && <DraftHistory />}
              </div>
            )}

            {/* Timeline Conflict Indicators */}
            {timelineErrors.length > 0 && (
              <div className="sidebar-section-card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--color-danger)', borderRadius: 6, overflow: 'hidden' }}>
                <div 
                  className="sidebar-section-card-header"
                  style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', backgroundColor: 'var(--color-danger-bg)', borderBottom: conflictsExpanded ? '1px solid var(--color-danger)' : 'none' }}
                  onClick={() => setConflictsExpanded(!conflictsExpanded)}
                >
                  {conflictsExpanded ? <ChevronDown size={14} style={{ color: 'var(--color-danger)' }} /> : <ChevronRight size={14} style={{ color: 'var(--color-danger)' }} />}
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--color-danger)' }}>CHRONOLOGY ERRORS ({timelineErrors.length})</span>
                </div>
                {conflictsExpanded && (
                  <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {timelineErrors.map((err, idx) => (
                      <div key={idx} className="continuity-warning" style={{ borderLeftColor: 'var(--color-danger)', backgroundColor: 'var(--color-danger-bg)', padding: 8, fontSize: 11, margin: 0 }}>
                        {err}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isReferenceTab && <ReferenceLibrary />}
      </div>
    </div>
  );
};
