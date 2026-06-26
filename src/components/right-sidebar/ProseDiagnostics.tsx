import React, { useState } from 'react';
import { useStore } from '../../store';
import { 
  RefreshCw, Loader2, ChevronDown, ChevronRight, HelpCircle, UserCheck
} from 'lucide-react';

export const ProseDiagnostics: React.FC = () => {
  const {
    aiRunning,
    continuityWarnings,
    dialogueWarnings,
    pacingSuggestions,
    runAIContinuityCheck,
    runAIDialogueCheck,
    runPacingAnalysis
  } = useStore();

  const [continuityExpanded, setContinuityExpanded] = useState(true);
  const [voiceExpanded, setVoiceExpanded] = useState(true);
  const [pacingExpanded, setPacingExpanded] = useState(true);

  const handleRunAllDiagnostics = () => {
    runAIContinuityCheck();
    runAIDialogueCheck();
    runPacingAnalysis();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="sidebar-title">Prose Diagnostics Dashboard</span>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
          Run deep narrative checks comparing this scene against characters, locations, pacing and structures.
        </p>
      </div>

      <button 
        type="button"
        className="btn btn-primary" 
        style={{ width: '100%', padding: '8px 12px', display: 'flex', gap: 6, justifyContent: 'center', fontWeight: 600, fontSize: 12.5 }}
        onClick={handleRunAllDiagnostics}
        disabled={aiRunning}
      >
        {aiRunning ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Analyzing prose quality...
          </>
        ) : (
          <>
            <RefreshCw size={14} />
            Run All Diagnostics
          </>
        )}
      </button>

      {/* 1. Continuity Checker Warnings */}
      <div className="sidebar-section-card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 6, overflow: 'hidden' }}>
        <div 
          className="sidebar-section-card-header"
          style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: 'var(--bg-secondary)', borderBottom: continuityExpanded ? '1px solid var(--border-color)' : 'none' }}
          onClick={() => setContinuityExpanded(!continuityExpanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)' }}>
            {continuityExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>NARRATIVE CONTINUITY</span>
          </div>
          {continuityWarnings && (
            <span className="badge" style={{
              fontSize: 9,
              padding: '1px 5px',
              borderRadius: 8,
              backgroundColor: continuityWarnings.length > 1 || (continuityWarnings.length === 1 && continuityWarnings[0].title !== 'No Major Inconsistencies Found') ? 'var(--accent-gold-dim)' : 'var(--color-success-bg)',
              color: continuityWarnings.length > 1 || (continuityWarnings.length === 1 && continuityWarnings[0].title !== 'No Major Inconsistencies Found') ? 'var(--accent-gold)' : 'var(--color-success)',
              border: '1px solid ' + (continuityWarnings.length > 1 || (continuityWarnings.length === 1 && continuityWarnings[0].title !== 'No Major Inconsistencies Found') ? 'var(--accent-gold)' : 'var(--color-success)')
            }}>
              {continuityWarnings.length === 1 && continuityWarnings[0].title === 'No Major Inconsistencies Found' ? 'Clear' : continuityWarnings.length}
            </span>
          )}
        </div>

        {continuityExpanded && (
          <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {continuityWarnings ? (
              continuityWarnings.map((warn, index) => (
                <div 
                  key={index} 
                  className="continuity-warning" 
                  style={{ 
                    margin: 0,
                    padding: 8,
                    borderLeftColor: warn.severity === 'high' ? 'var(--color-danger)' : warn.severity === 'medium' ? 'var(--accent-gold)' : 'var(--color-info)',
                    backgroundColor: warn.severity === 'high' ? 'var(--color-danger-bg)' : warn.severity === 'medium' ? 'var(--accent-gold-dim)' : 'var(--bg-primary)'
                  }}
                >
                  <div 
                    className="continuity-warning-title" 
                    style={{ color: warn.severity === 'high' ? 'var(--color-danger)' : warn.severity === 'medium' ? 'var(--accent-gold)' : 'var(--color-info)', fontSize: 11 }}
                  >
                    <HelpCircle size={12} />
                    {warn.title}
                  </div>
                  <div style={{ color: 'var(--text-primary)', marginTop: 2, fontSize: 10.5, lineHeight: 1.3 }}>{warn.content}</div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0' }}>No continuity check run yet.</div>
            )}
          </div>
        )}
      </div>

      {/* 2. Character Voice Warnings */}
      <div className="sidebar-section-card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 6, overflow: 'hidden' }}>
        <div 
          className="sidebar-section-card-header"
          style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: 'var(--bg-secondary)', borderBottom: voiceExpanded ? '1px solid var(--border-color)' : 'none' }}
          onClick={() => setVoiceExpanded(!voiceExpanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)' }}>
            {voiceExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>DIALOGUE & CHARACTER VOICE</span>
          </div>
          {dialogueWarnings && (
            <span className="badge" style={{
              fontSize: 9,
              padding: '1px 5px',
              borderRadius: 8,
              backgroundColor: dialogueWarnings.length > 0 ? 'var(--accent-purple-dim)' : 'var(--bg-primary)',
              color: dialogueWarnings.length > 0 ? 'var(--accent-purple)' : 'var(--text-muted)',
              border: '1px solid ' + (dialogueWarnings.length > 0 ? 'var(--accent-purple)' : 'var(--border-color)')
            }}>
              {dialogueWarnings.length}
            </span>
          )}
        </div>

        {voiceExpanded && (
          <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dialogueWarnings ? (
              dialogueWarnings.map((warn, index) => (
                <div key={index} className="continuity-warning" style={{ margin: 0, padding: 8, borderLeftColor: 'var(--accent-purple)', backgroundColor: 'var(--bg-primary)' }}>
                  <div className="continuity-warning-title" style={{ color: 'var(--accent-purple)', fontSize: 11 }}>
                    <UserCheck size={12} />
                    {warn.title}
                  </div>
                  {warn.quote !== "All dialogue chunks analyzed." && (
                    <blockquote style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: 6, margin: '4px 0', fontStyle: 'italic', fontSize: 10.5, color: 'var(--text-secondary)' }}>
                      {warn.quote}
                    </blockquote>
                  )}
                  <div style={{ color: 'var(--text-primary)', fontSize: 10.5, marginTop: 2 }}>{warn.content}</div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0' }}>No dialogue check run yet.</div>
            )}
          </div>
        )}
      </div>

      {/* 3. Pacing Suggestions */}
      <div className="sidebar-section-card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 6, overflow: 'hidden' }}>
        <div 
          className="sidebar-section-card-header"
          style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: 'var(--bg-secondary)', borderBottom: pacingExpanded ? '1px solid var(--border-color)' : 'none' }}
          onClick={() => setPacingExpanded(!pacingExpanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)' }}>
            {pacingExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>STRUCTURE & PACING</span>
          </div>
          {pacingSuggestions && (
            <span className="badge" style={{
              fontSize: 9,
              padding: '1px 5px',
              borderRadius: 8,
              backgroundColor: 'var(--accent-purple-dim)',
              color: 'var(--accent-purple)',
              border: '1px solid var(--accent-purple)'
            }}>
              {pacingSuggestions.length}
            </span>
          )}
        </div>

        {pacingExpanded && (
          <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pacingSuggestions ? (
              pacingSuggestions.map((sug, index) => (
                <div key={index} style={{ padding: 8, backgroundColor: 'var(--bg-primary)', borderRadius: 4, border: '1px solid var(--border-color)', fontSize: 11, lineHeight: 1.4 }}>
                  {sug}
                </div>
              ))
            ) : (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0' }}>No pacing analysis run yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
