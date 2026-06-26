import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { 
  Sparkles, ShieldCheck, UserCheck, 
  HelpCircle, Check, X, Search, Loader2, BookOpen, AlertTriangle,
  Send, RefreshCw, ChevronDown, ChevronRight
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
    updateSceneContent,
    aiError,
    clearAIError,
    chatMessages,
    selectedText,
    setSelectedText,
    sendChatMessage,
    replaceSelectedText,
    clearChat
  } = useStore();

  const [revisionMode, setRevisionMode] = useState<'light' | 'style' | 'line' | 'dev'>('line');
  const [researchQuery, setResearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');

  // Local collapsible section states for Diagnostics
  const [continuityExpanded, setContinuityExpanded] = useState(true);
  const [voiceExpanded, setVoiceExpanded] = useState(true);
  const [pacingExpanded, setPacingExpanded] = useState(true);

  // Local collapsible section state for Prose revision tool inside AI Writer
  const [showRevisionTool, setShowRevisionTool] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeRightTab === 'brainstorm' || activeRightTab === 'assistant') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeRightTab]);

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput('');
  };

  const parseChatMarkdown = (text: string) => {
    if (!text) return '';
    return text
      .replace(/^### (.*$)/gim, '<h5 style="color:var(--accent-purple);margin:6px 0 4px 0">$1</h5>')
      .replace(/^## (.*$)/gim, '<h4 style="color:var(--accent-purple);margin:8px 0 4px 0">$1</h4>')
      .replace(/^# (.*$)/gim, '<h3 style="color:var(--accent-purple);margin:10px 0 6px 0">$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/^-\s(.*$)/gim, '<li style="margin-left:12px;font-size:11.5px;margin-bottom:3px">$1</li>')
      .replace(/`([^`]+)`/g, '<code style="background-color:var(--bg-primary);padding:1px 3px;border-radius:3px;font-family:var(--font-mono);font-size:10.5px">$1</code>')
      .replace(/\n\n/gim, '</p><p style="margin-bottom:6px">')
      .replace(/\n/gim, '<br />');
  };

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

  const handleRunAllDiagnostics = () => {
    runAIContinuityCheck();
    runAIDialogueCheck();
    runPacingAnalysis();
  };

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
    <div className="sidebar-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
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
            AI Writer
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
              Open Settings (⚙️ in the top header) and configure your API key for Gemini, OpenAI, or OpenRouter to enable AI scans.
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

        {/* ================= AI CO-WRITER & REVISION TAB ================= */}
        {isWriterTab && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 10 }}>
            
            {/* Revision Suggestions Diff view (Always show at top when suggestions exist) */}
            {revisionSuggestions && (
              <div className="sidebar-section-card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--accent-purple)', borderRadius: 6, padding: 10, display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Suggested Prose Revision</span>
                  <button className="btn-icon" onClick={() => clearAISuggestions()} style={{ padding: 2 }}><X size={12} /></button>
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
                        className="btn btn-primary" 
                        style={{ flex: 1, backgroundColor: 'var(--color-success)', display: 'flex', gap: 3, padding: '4px 8px', fontSize: 11 }}
                        onClick={handleApplyRevision}
                      >
                        <Check size={12} /> Apply Edits
                      </button>
                      <button 
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
            )}

            {/* Selected Text context card */}
            {selectedText && (
              <div style={{ 
                backgroundColor: 'var(--accent-purple-dim)', 
                borderLeft: '3px solid var(--accent-purple)', 
                borderRadius: 6, 
                padding: 8, 
                fontSize: 11.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--accent-purple)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Active Text Context
                  </span>
                  <button 
                    type="button" 
                    className="btn-icon" 
                    onClick={() => setSelectedText('')}
                    style={{ padding: 1, color: 'var(--text-secondary)' }}
                  >
                    <X size={10} />
                  </button>
                </div>
                <div style={{ 
                  color: 'var(--text-primary)', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  fontSize: 11,
                  fontStyle: 'italic'
                }}>
                  "{selectedText}"
                </div>
              </div>
            )}

            {/* Collapsible Prose Revision Tools */}
            <div className="sidebar-section-card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
              <div 
                className="sidebar-section-card-header"
                style={{ padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: 'var(--bg-secondary)' }}
                onClick={() => setShowRevisionTool(!showRevisionTool)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
                  {showRevisionTool ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>PROSE REVISION SCANNER</span>
                </div>
              </div>

              {showRevisionTool && (
                <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: 9, marginBottom: 4 }}>Scan Mode</label>
                    <select 
                      className="form-select" 
                      value={revisionMode} 
                      onChange={e => setRevisionMode(e.target.value as any)}
                      disabled={aiRunning}
                      style={{ fontSize: 11.5, padding: '4px 8px' }}
                    >
                      <option value="light">Light Edit (Grammar/Punctuation)</option>
                      <option value="style">Style Edit (Flow & Repetition)</option>
                      <option value="line">Line Edit (Polished Prose Flow)</option>
                      <option value="dev">Dev Edit (Structure Analysis)</option>
                    </select>
                  </div>

                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '6px 10px', display: 'flex', gap: 4, justifyContent: 'center', fontSize: 11.5 }} 
                    onClick={() => runAIRevision(revisionMode)}
                    disabled={aiRunning}
                  >
                    {aiRunning ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    Run Prose Scan
                  </button>
                </div>
              )}
            </div>

            {/* Chat Log container */}
            <div style={{ 
              flex: 1, 
              minHeight: 0,
              overflowY: 'auto',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              backgroundColor: 'var(--bg-primary)',
              padding: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}>
              {chatMessages.length === 0 ? (
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 11, padding: 16, textAlign: 'center', fontStyle: 'italic', lineHeight: 1.4 }}>
                  Consult AI about this scene, ask for ideas, or select text in the editor and ask: "rewrite this scene in active voice".
                </div>
              ) : (
                chatMessages.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div 
                      key={index} 
                      style={{ 
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        maxWidth: '92%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2
                      }}
                    >
                      <div 
                        style={{ 
                          backgroundColor: isUser ? 'var(--accent-purple-dim)' : 'var(--bg-tertiary)',
                          border: isUser ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          borderRadius: isUser ? '8px 8px 1px 8px' : '8px 8px 8px 1px',
                          padding: '6px 10px',
                          fontSize: 12,
                          lineHeight: 1.4
                        }}
                        dangerouslySetInnerHTML={{ __html: parseChatMarkdown(msg.content) }}
                      />
                      
                      {/* Replace selection helper */}
                      {!isUser && selectedText && (
                        <button
                          className="btn btn-secondary"
                          style={{ 
                            alignSelf: 'flex-start', 
                            padding: '1px 6px', 
                            fontSize: 9.5, 
                            marginTop: 2, 
                            borderColor: 'var(--accent-purple-dim)', 
                            color: 'var(--accent-purple)', 
                            fontWeight: 600,
                            borderRadius: 4
                          }}
                          onClick={() => {
                            let cleanProse = msg.content;
                            if (cleanProse.includes('```')) {
                              const match = cleanProse.match(/```(?:markdown|text|prose)?\n([\s\S]*?)\n```/);
                              if (match && match[1]) {
                                cleanProse = match[1];
                              }
                            }
                            replaceSelectedText(cleanProse.trim());
                            alert("Selection replaced in manuscript!");
                          }}
                        >
                          ✍️ Replace Selection
                        </button>
                      )}
                    </div>
                  );
                })
              )}
              {aiRunning && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 10.5, fontStyle: 'italic', paddingLeft: 4 }}>
                  <Loader2 size={12} className="animate-spin" />
                  <span>AI Writing Assistant is generating...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Send Controls */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Type brainstorming prompt..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleChatSubmit(); }}
                disabled={aiRunning}
                style={{ fontSize: 12, padding: '6px 10px' }}
              />
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleChatSubmit}
                disabled={aiRunning || !chatInput.trim()}
                style={{ padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}
              >
                <Send size={12} />
              </button>
            </div>

            {chatMessages.length > 0 && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ width: '100%', padding: '2px', fontSize: 9.5, color: 'var(--text-muted)', border: 'none', background: 'none' }} 
                onClick={clearChat}
              >
                Clear Conversation History
              </button>
            )}
          </div>
        )}

        {/* ================= PROSE DIAGNOSTICS TAB ================= */}
        {isDiagnosticsTab && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="sidebar-title">Prose Diagnostics Dashboard</span>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Run deep narrative checks comparing this scene against characters, locations, pacing and structures.
              </p>
            </div>

            <button 
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
        )}

        {/* ================= KNOWLEDGE & CONTEXT TAB ================= */}
        {isResearchTab && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Active Context Nodes */}
            <div className="sidebar-section-card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 6, padding: 10 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                Active Prompt Context
              </span>
              <p style={{ fontSize: 10.5, color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                The AI automatically references these bible elements and threads when you write or query.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {activeContexts.map((ctx, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      padding: '3px 6px', 
                      backgroundColor: 'var(--bg-primary)', 
                      borderRadius: 4, 
                      fontSize: 10.5, 
                      borderLeft: '2px solid var(--accent-purple)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <BookOpen size={10} style={{ color: 'var(--accent-purple)' }} />
                    {ctx}
                  </div>
                ))}
                {activeContexts.length === 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 0' }}>
                    No entities identified in this scene's context yet.
                  </div>
                )}
              </div>
            </div>

            {/* AI Research Search */}
            <div className="sidebar-section-card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 6, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Research Assistant</span>
                <p style={{ fontSize: 10.5, color: 'var(--text-secondary)', margin: '2px 0 6px 0', lineHeight: 1.3 }}>
                  Query history, science, or details without leaving your editor.
                </p>
              </div>

              <form onSubmit={handleResearchSubmit} style={{ display: 'flex', gap: 4 }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. medieval bellows forge..." 
                  value={researchQuery}
                  onChange={e => setResearchQuery(e.target.value)}
                  disabled={aiRunning}
                  style={{ fontSize: 11.5, padding: '4px 8px' }}
                />
                <button type="submit" className="btn btn-primary" disabled={aiRunning} style={{ padding: '4px 8px', fontSize: 11 }}>
                  Go
                </button>
              </form>

              {aiRunning && <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textAlign: 'center' }}>AI is researching...</div>}

              {researchResults && (
                <div 
                  className="editor-preview" 
                  style={{ 
                    padding: 8, 
                    backgroundColor: 'var(--bg-primary)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 4, 
                    fontSize: 11, 
                    lineHeight: 1.4,
                    maxHeight: 250,
                    overflowY: 'auto'
                  }}
                  dangerouslySetInnerHTML={{ __html: researchResults.replace(/\n/g, '<br />') }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
