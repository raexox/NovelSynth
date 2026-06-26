import React from 'react';
import { useStore } from '../../store';
import { Sparkles, ShieldCheck, Search, HelpCircle, AlertTriangle, X } from 'lucide-react';
import { AiCoWriter } from './AiCoWriter';
import { ProseDiagnostics } from './ProseDiagnostics';
import { KnowledgeAndContext } from './KnowledgeAndContext';

export const RightSidebar: React.FC = () => {
  const {
    project,
    activeSceneId,
    activeRightTab,
    setRightTab,
    aiError,
    clearAIError
  } = useStore();

  const activeScene = project.scenes.find(s => s.id === activeSceneId);

  if (!activeScene) {
    return (
      <div className="sidebar right-sidebar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 20, textAlign: 'center', height: '100%' }}>
        Select a scene to activate the AI Assistant.
      </div>
    );
  }

  // Map visual tabs to store state keys
  const isWriterTab = activeRightTab === 'brainstorm' || activeRightTab === 'revision' || activeRightTab === 'assistant';
  const isDiagnosticsTab = activeRightTab === 'diagnostics' || activeRightTab === 'continuity' || activeRightTab === 'memory' || activeRightTab === 'suggestions';
  const isResearchTab = activeRightTab === 'research' || activeRightTab === 'context';

  return (
    <div className="sidebar-container">
      {/* Consolidated AI Tabs */}
      <div className="sidebar-tabs-pill-container" style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', background: 'var(--bg-primary)', padding: 3, borderRadius: 8, border: '1px solid var(--border-color)' }}>
          <button 
            type="button"
            className="sidebar-tab-pill-btn"
            style={{
              flex: 1,
              padding: '6px 4px',
              border: 'none',
              background: isWriterTab ? 'var(--bg-tertiary)' : 'none',
              color: isWriterTab ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderRadius: 6,
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              transition: 'all 0.2s ease'
            }}
            onClick={() => setRightTab('brainstorm')}
          >
            <Sparkles size={12} style={{ color: isWriterTab ? 'var(--accent-purple)' : 'inherit' }} />
            AI Co-Writer
          </button>
          <button 
            type="button"
            className="sidebar-tab-pill-btn"
            style={{
              flex: 1,
              padding: '6px 4px',
              border: 'none',
              background: isDiagnosticsTab ? 'var(--bg-tertiary)' : 'none',
              color: isDiagnosticsTab ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderRadius: 6,
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              transition: 'all 0.2s ease'
            }}
            onClick={() => setRightTab('continuity')}
          >
            <ShieldCheck size={12} style={{ color: isDiagnosticsTab ? 'var(--accent-purple)' : 'inherit' }} />
            Diagnostics
          </button>
          <button 
            type="button"
            className="sidebar-tab-pill-btn"
            style={{
              flex: 1,
              padding: '6px 4px',
              border: 'none',
              background: isResearchTab ? 'var(--bg-tertiary)' : 'none',
              color: isResearchTab ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderRadius: 6,
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              transition: 'all 0.2s ease'
            }}
            onClick={() => setRightTab('research')}
          >
            <Search size={12} style={{ color: isResearchTab ? 'var(--accent-purple)' : 'inherit' }} />
            Research
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        className="sidebar-content" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 12, 
          flex: 1,
          minHeight: 0,
          overflowY: isWriterTab ? 'hidden' : 'auto',
          padding: 12
        }}
      >
        {/* API Key Required warning */}
        {!project.settings.apiKey && (
          <div className="continuity-warning" style={{ borderLeftColor: 'var(--accent-gold)', backgroundColor: 'var(--accent-gold-dim)', margin: 0, padding: 10 }}>
            <div className="continuity-warning-title" style={{ color: 'var(--accent-gold)', fontSize: 11.5 }}>
              <HelpCircle size={13} />
              API Key Required
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-primary)', marginTop: 4, lineHeight: 1.3 }}>
              Open Settings (⚙️ in the top header) and configure your API key to enable AI features.
            </div>
          </div>
        )}

        {/* AI Service Error display */}
        {aiError && (
          <div className="continuity-warning" style={{ borderLeftColor: 'var(--color-danger)', backgroundColor: 'var(--color-danger-bg)', margin: 0, padding: 10 }}>
            <div className="continuity-warning-title" style={{ color: 'var(--color-danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: 11.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertTriangle size={13} />
                <span>AI Service Error</span>
              </div>
              <button 
                type="button"
                className="btn-icon" 
                onClick={clearAIError} 
                style={{ padding: 1, color: 'var(--color-danger)', background: 'none' }}
                title="Dismiss Error"
              >
                <X size={11} />
              </button>
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-primary)', marginTop: 4, lineHeight: 1.3 }}>
              {aiError}
            </div>
          </div>
        )}

        {isWriterTab && <AiCoWriter />}
        {isDiagnosticsTab && <ProseDiagnostics />}
        {isResearchTab && <KnowledgeAndContext />}
      </div>
    </div>
  );
};
