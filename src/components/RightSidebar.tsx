import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  Sparkles, ShieldCheck, UserCheck, MessageSquare, ListFilter, 
  HelpCircle, Check, X, Search, Loader2, BookOpen 
} from 'lucide-react';

export const RightSidebar: React.FC = () => {
  const {
    project,
    activeSceneId,
    activeRightTab,
    aiRunning,
    revisionSuggestions,
    continuityWarnings,
    dialogueWarnings,
    activeContexts,
    pacingSuggestions,
    researchResults,
    setRightTab,
    runAIRevision,
    runAIContinuityCheck,
    runAIDialogueCheck,
    runPacingAnalysis,
    runResearch,
    clearAISuggestions,
    updateSceneContent
  } = useStore();

  const [revisionMode, setRevisionMode] = useState<'light' | 'style' | 'line' | 'dev'>('line');
  const [researchQuery, setResearchQuery] = useState('');

  const activeScene = project.scenes.find(s => s.id === activeSceneId);

  const handleApplyRevision = () => {
    if (!activeScene || !revisionSuggestions) return;
    updateSceneContent(activeScene.id, revisionSuggestions.revised);
    clearAISuggestions();
  };

  const handleRejectRevision = () => {
    clearAISuggestions();
  };

  const handleResearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!researchQuery.trim()) return;
    runResearch(researchQuery);
  };

  if (!activeScene) {
    return (
      <div className="sidebar right-sidebar">
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 20, textAlign: 'center' }}>
          Select a scene to activate the AI Editor.
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar right-sidebar">
      {/* Tabs */}
      <div className="sidebar-tabs">
        <button 
          className={`sidebar-tab-btn ${activeRightTab === 'revision' ? 'active' : ''}`}
          onClick={() => setRightTab('revision')}
          title="AI Revision Diffs"
        >
          <Sparkles size={14} style={{marginRight: 4}} />
          Revision
        </button>
        <button 
          className={`sidebar-tab-btn ${activeRightTab === 'continuity' ? 'active' : ''}`}
          onClick={() => setRightTab('continuity')}
          title="Continuity Checker"
        >
          <ShieldCheck size={14} style={{marginRight: 4}} />
          Continuity
        </button>
        <button 
          className={`sidebar-tab-btn ${activeRightTab === 'memory' ? 'active' : ''}`}
          onClick={() => setRightTab('memory')}
          title="Dialogue & Voice Check"
        >
          <UserCheck size={14} style={{marginRight: 4}} />
          Voice
        </button>
        <button 
          className={`sidebar-tab-btn ${activeRightTab === 'suggestions' ? 'active' : ''}`}
          onClick={() => setRightTab('suggestions')}
          title="Development Suggestions"
        >
          <MessageSquare size={14} style={{marginRight: 4}} />
          Pacing
        </button>
        <button 
          className={`sidebar-tab-btn ${activeRightTab === 'context' ? 'active' : ''}`}
          onClick={() => setRightTab('context')}
          title="Active Prompt Context"
        >
          <ListFilter size={14} style={{marginRight: 4}} />
          Context
        </button>
        <button 
          className={`sidebar-tab-btn ${activeRightTab === 'research' ? 'active' : ''}`}
          onClick={() => setRightTab('research')}
          title="Research Assistant"
        >
          <Search size={14} style={{marginRight: 4}} />
          Research
        </button>
      </div>

      <div className="sidebar-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* ================= REVISION TAB ================= */}
        {activeRightTab === 'revision' && (
          <div>
            <span className="sidebar-title">Revision Assistant</span>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '6px 0 12px 0' }}>
              Analyze and improve your prose. Suggestions are shown as diffs and must be approved before updating the manuscript.
            </p>

            <div className="form-group">
              <label className="form-label">Revision Mode</label>
              <select 
                className="form-select" 
                value={revisionMode} 
                onChange={e => setRevisionMode(e.target.value as any)}
                disabled={aiRunning}
              >
                <option value="light">Light Edit (Grammar, spelling, punctuation only)</option>
                <option value="style">Style Edit (Rhythm, repetition, readability)</option>
                <option value="line">Line Edit (Polished flow, preserves voice)</option>
                <option value="dev">Development Edit (Analysis on tension, dialogue, pace)</option>
              </select>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', display: 'flex', gap: 6 }} 
              onClick={() => runAIRevision(revisionMode)}
              disabled={aiRunning}
            >
              {aiRunning ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Analyzing Prose...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Run Revision Scan
                </>
              )}
            </button>

            {/* Suggestions Render */}
            {revisionSuggestions && (
              <div style={{ marginTop: 16 }}>
                <span className="form-label">Suggested Edits</span>
                
                {revisionMode !== 'dev' ? (
                  <>
                    <div 
                      className="diff-view"
                      dangerouslySetInnerHTML={{ __html: revisionSuggestions.diffHtml }}
                    />
                    
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)', padding: 10, borderRadius: 4, marginBottom: 12 }}>
                      <strong>AI Explanation:</strong> {revisionSuggestions.explanation}
                    </div>

                    <div className="suggestion-actions">
                      <button 
                        className="btn btn-primary" 
                        style={{ flex: 1, backgroundColor: 'var(--color-success)', display: 'flex', gap: 4 }}
                        onClick={handleApplyRevision}
                      >
                        <Check size={14} /> Accept Edits
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ flex: 1, display: 'flex', gap: 4 }}
                        onClick={handleRejectRevision}
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)', padding: 12, borderRadius: 4, whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                    {revisionSuggestions.explanation}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= CONTINUITY TAB ================= */}
        {activeRightTab === 'continuity' && (
          <div>
            <span className="sidebar-title">Continuity Checker</span>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '6px 0 12px 0' }}>
              Compare the current scene against character sheets, location data, and faction rules.
            </p>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginBottom: 16 }}
              onClick={runAIContinuityCheck}
              disabled={aiRunning}
            >
              {aiRunning ? 'Scrutinizing Manuscript...' : 'Cross-Reference Story Bible'}
            </button>

            {continuityWarnings && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {continuityWarnings.map((warn, index) => (
                  <div 
                    key={index} 
                    className="continuity-warning" 
                    style={{ 
                      borderLeftColor: warn.severity === 'high' ? 'var(--color-danger)' : warn.severity === 'medium' ? 'var(--accent-gold)' : 'var(--color-info)',
                      backgroundColor: warn.severity === 'high' ? 'var(--color-danger-bg)' : warn.severity === 'medium' ? 'var(--accent-gold-dim)' : 'var(--bg-tertiary)'
                    }}
                  >
                    <div 
                      className="continuity-warning-title" 
                      style={{ color: warn.severity === 'high' ? 'var(--color-danger)' : warn.severity === 'medium' ? 'var(--accent-gold)' : 'var(--color-info)' }}
                    >
                      <HelpCircle size={14} />
                      {warn.title}
                    </div>
                    <div style={{ color: 'var(--text-primary)', marginTop: 4 }}>{warn.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= CHARACTER VOICE TAB ================= */}
        {activeRightTab === 'memory' && (
          <div>
            <span className="sidebar-title">Dialogue & Character Voice</span>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '6px 0 12px 0' }}>
              Checks if characters present in dialogue conform to their listed vocabulary, relationships, and speaking style.
            </p>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginBottom: 16 }}
              onClick={runAIDialogueCheck}
              disabled={aiRunning}
            >
              {aiRunning ? 'Analyzing Dialogue...' : 'Check Character Dialogue'}
            </button>

            {dialogueWarnings && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {dialogueWarnings.map((warn, index) => (
                  <div key={index} className="continuity-warning" style={{ borderLeftColor: 'var(--accent-purple)', backgroundColor: 'var(--bg-tertiary)' }}>
                    <div className="continuity-warning-title" style={{ color: 'var(--accent-purple)' }}>
                      <UserCheck size={14} />
                      {warn.title}
                    </div>
                    {warn.quote !== "All dialogue chunks analyzed." && (
                      <blockquote style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: 8, margin: '6px 0', fontStyle: 'italic', fontSize: 12, color: 'var(--text-secondary)' }}>
                        {warn.quote}
                      </blockquote>
                    )}
                    <div style={{ color: 'var(--text-primary)', fontSize: 12 }}>{warn.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= PACING TAB ================= */}
        {activeRightTab === 'suggestions' && (
          <div>
            <span className="sidebar-title">Pacing & Structure</span>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '6px 0 12px 0' }}>
              Analyze scene structures, tension peaks, and balance of sensory vocabulary.
            </p>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginBottom: 16 }}
              onClick={runPacingAnalysis}
              disabled={aiRunning}
            >
              {aiRunning ? 'Measuring Scene Pacing...' : 'Analyze Structure & Pacing'}
            </button>

            {pacingSuggestions && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pacingSuggestions.map((sug, index) => (
                  <div key={index} style={{ padding: 10, backgroundColor: 'var(--bg-tertiary)', borderRadius: 4, border: '1px solid var(--border-color)', fontSize: 13, lineHeight: 1.5 }}>
                    {sug}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= CONTEXT ENGINE TAB ================= */}
        {activeRightTab === 'context' && (
          <div>
            <span className="sidebar-title">Loaded Context Engine</span>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '6px 0 12px 0' }}>
              The Context Engine dynamically loads only the relevant chapters, Story Bible files, and plot points to prevent AI hallucinations.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              <span className="form-label">Active Context Nodes ({activeContexts.length})</span>
              {activeContexts.map((ctx, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    padding: '6px 10px', 
                    backgroundColor: 'var(--bg-tertiary)', 
                    borderRadius: 4, 
                    fontSize: 12, 
                    borderLeft: '2px solid var(--accent-purple)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <BookOpen size={12} style={{ color: 'var(--accent-purple)' }} />
                  {ctx}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= RESEARCH TAB ================= */}
        {activeRightTab === 'research' && (
          <div>
            <span className="sidebar-title">Research Assistant</span>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '6px 0 12px 0' }}>
              Query historical details, technologies, or vocabularies without leaving your writing environment.
            </p>

            <form onSubmit={handleResearchSubmit} style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. medieval bellows forge..." 
                value={researchQuery}
                onChange={e => setResearchQuery(e.target.value)}
                disabled={aiRunning}
              />
              <button type="submit" className="btn btn-primary" disabled={aiRunning}>
                Search
              </button>
            </form>

            {aiRunning && <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>Searching database...</div>}

            {researchResults && (
              <div 
                className="editor-preview" 
                style={{ 
                  padding: 10, 
                  backgroundColor: 'var(--bg-tertiary)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 4, 
                  fontSize: 12, 
                  lineHeight: 1.5 
                }}
                dangerouslySetInnerHTML={{ __html: researchResults.replace(/\n/g, '<br />') }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
