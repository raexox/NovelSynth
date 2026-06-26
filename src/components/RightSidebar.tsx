import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { 
  Sparkles, ShieldCheck, UserCheck, MessageSquare, ListFilter, 
  HelpCircle, Check, X, Search, Loader2, BookOpen, AlertTriangle 
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

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Refs for tab buttons to scroll them into view
  const revisionTabRef = useRef<HTMLButtonElement>(null);
  const continuityTabRef = useRef<HTMLButtonElement>(null);
  const memoryTabRef = useRef<HTMLButtonElement>(null);
  const suggestionsTabRef = useRef<HTMLButtonElement>(null);
  const contextTabRef = useRef<HTMLButtonElement>(null);
  const researchTabRef = useRef<HTMLButtonElement>(null);
  const brainstormTabRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeRightTab === 'brainstorm') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeRightTab]);

  // Auto-scroll active tab into view
  useEffect(() => {
    let activeRef: React.RefObject<HTMLButtonElement | null> | null = null;
    if (activeRightTab === 'revision') activeRef = revisionTabRef;
    else if (activeRightTab === 'continuity') activeRef = continuityTabRef;
    else if (activeRightTab === 'memory') activeRef = memoryTabRef;
    else if (activeRightTab === 'suggestions') activeRef = suggestionsTabRef;
    else if (activeRightTab === 'context') activeRef = contextTabRef;
    else if (activeRightTab === 'research') activeRef = researchTabRef;
    else if (activeRightTab === 'brainstorm') activeRef = brainstormTabRef;

    if (activeRef?.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [activeRightTab]);

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput('');
  };

  const parseChatMarkdown = (text: string) => {
    if (!text) return '';
    return text
      .replace(/^### (.*$)/gim, '<h4 style="color:var(--accent-purple);margin:8px 0 4px 0">$1</h4>')
      .replace(/^## (.*$)/gim, '<h3 style="color:var(--accent-purple);margin:10px 0 6px 0">$1</h3>')
      .replace(/^# (.*$)/gim, '<h2 style="color:var(--accent-purple);margin:12px 0 8px 0">$1</h2>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/^-\s(.*$)/gim, '<li style="margin-left:14px;font-size:12px;margin-bottom:4px">$1</li>')
      .replace(/`([^`]+)`/g, '<code style="background-color:var(--bg-primary);padding:2px 4px;border-radius:3px;font-family:var(--font-mono);font-size:11px">$1</code>')
      .replace(/\n\n/gim, '</p><p style="margin-bottom:8px">')
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
          ref={revisionTabRef}
          className={`sidebar-tab-btn ${activeRightTab === 'revision' ? 'active' : ''}`}
          onClick={() => setRightTab('revision')}
          title="AI Revision Diffs"
        >
          <Sparkles size={14} style={{marginRight: 4}} />
          Revision
        </button>
        <button 
          ref={continuityTabRef}
          className={`sidebar-tab-btn ${activeRightTab === 'continuity' ? 'active' : ''}`}
          onClick={() => setRightTab('continuity')}
          title="Continuity Checker"
        >
          <ShieldCheck size={14} style={{marginRight: 4}} />
          Continuity
        </button>
        <button 
          ref={memoryTabRef}
          className={`sidebar-tab-btn ${activeRightTab === 'memory' ? 'active' : ''}`}
          onClick={() => setRightTab('memory')}
          title="Dialogue & Voice Check"
        >
          <UserCheck size={14} style={{marginRight: 4}} />
          Voice
        </button>
        <button 
          ref={suggestionsTabRef}
          className={`sidebar-tab-btn ${activeRightTab === 'suggestions' ? 'active' : ''}`}
          onClick={() => setRightTab('suggestions')}
          title="Development Suggestions"
        >
          <MessageSquare size={14} style={{marginRight: 4}} />
          Pacing
        </button>
        <button 
          ref={contextTabRef}
          className={`sidebar-tab-btn ${activeRightTab === 'context' ? 'active' : ''}`}
          onClick={() => setRightTab('context')}
          title="Active Prompt Context"
        >
          <ListFilter size={14} style={{marginRight: 4}} />
          Context
        </button>
        <button 
          ref={researchTabRef}
          className={`sidebar-tab-btn ${activeRightTab === 'research' ? 'active' : ''}`}
          onClick={() => setRightTab('research')}
          title="Research Assistant"
        >
          <Search size={14} style={{marginRight: 4}} />
          Research
        </button>
        <button 
          ref={brainstormTabRef}
          className={`sidebar-tab-btn ${activeRightTab === 'brainstorm' ? 'active' : ''}`}
          onClick={() => setRightTab('brainstorm')}
          title="AI Writing Assistant & Chat"
        >
          <MessageSquare size={14} style={{marginRight: 4}} />
          Assistant
        </button>
      </div>

      <div 
        className="sidebar-content" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 12, 
          flex: 1,
          minHeight: 0,
          overflowY: activeRightTab === 'brainstorm' ? 'hidden' : 'auto' 
        }}
      >
        {/* API Key Required Check */}
        {!project.settings.apiKey && (
          <div className="continuity-warning" style={{ borderLeftColor: 'var(--accent-gold)', backgroundColor: 'var(--accent-gold-dim)', marginBottom: 8 }}>
            <div className="continuity-warning-title" style={{ color: 'var(--accent-gold)' }}>
              <HelpCircle size={14} />
              API Key Required
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 4 }}>
              To activate AI tools, open Settings (⚙️ in the top header) and configure your API key for Gemini, OpenAI, or OpenRouter.
            </div>
          </div>
        )}

        {/* Dynamic API Error Component */}
        {aiError && (
          <div className="continuity-warning" style={{ borderLeftColor: 'var(--color-danger)', backgroundColor: 'var(--color-danger-bg)', marginBottom: 8 }}>
            <div className="continuity-warning-title" style={{ color: 'var(--color-danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={14} />
                <span>AI Service Error</span>
              </div>
              <button 
                className="btn-icon" 
                onClick={clearAIError} 
                style={{ padding: 2, color: 'var(--color-danger)', background: 'none' }}
                title="Dismiss Error"
              >
                <X size={12} />
              </button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 6, lineHeight: 1.4 }}>
              {aiError}
            </div>
          </div>
        )}
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

        {/* ================= ASSISTANT / CHAT TAB ================= */}
        {activeRightTab === 'brainstorm' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 10 }}>
            <div>
              <span className="sidebar-title">AI Writing Assistant</span>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 0 8px 0', lineHeight: 1.4 }}>
                Discuss your manuscript, brainstorm names or plots, or ask the AI to rewrite selected paragraphs.
              </p>
            </div>

            {/* Selected Text context card */}
            {selectedText ? (
              <div style={{ 
                backgroundColor: 'var(--accent-purple-dim)', 
                borderLeft: '3px solid var(--accent-purple)', 
                borderRadius: 4, 
                padding: '8px 10px', 
                fontSize: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--accent-purple)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Active Text Context
                  </span>
                  <button 
                    type="button" 
                    className="btn-icon" 
                    onClick={() => setSelectedText('')}
                    style={{ padding: 2, color: 'var(--text-secondary)' }}
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
            ) : (
              <div style={{ 
                border: '1px dashed var(--border-color)', 
                borderRadius: 4, 
                padding: 8, 
                fontSize: 11, 
                color: 'var(--text-muted)',
                textAlign: 'center'
              }}>
                💡 Highlight text in the editor to discuss or rewrite it in context.
              </div>
            )}

            {/* Chat Messages Log */}
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
              gap: 12
            }}>
              {chatMessages.length === 0 ? (
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 11, padding: 12, textAlign: 'center', fontStyle: 'italic' }}>
                  Ask questions, ask for synonyms, or highlight text in the editor and type "Rewrite this in third person POV".
                </div>
              ) : (
                chatMessages.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div 
                      key={index} 
                      style={{ 
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        maxWidth: '90%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4
                      }}
                    >
                      <div 
                        style={{ 
                          backgroundColor: isUser ? 'var(--accent-purple-dim)' : 'var(--bg-tertiary)',
                          border: isUser ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          borderRadius: isUser ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                          padding: '8px 12px',
                          fontSize: 12.5,
                          lineHeight: 1.4
                        }}
                        dangerouslySetInnerHTML={{ __html: parseChatMarkdown(msg.content) }}
                      />
                      
                      {/* Apply to manuscript button next to AI rewrites */}
                      {!isUser && selectedText && (
                        <button
                          className="btn btn-secondary"
                          style={{ 
                            alignSelf: 'flex-start', 
                            padding: '2px 8px', 
                            fontSize: 10, 
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
                          title="Replace highlighted selection in manuscript editor with this AI response"
                        >
                          ✍️ Replace Selection
                        </button>
                      )}
                    </div>
                  );
                })
              )}
              {aiRunning && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic', paddingLeft: 4 }}>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Agent is writing...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Area */}
            <div style={{ display: 'flex', gap: 6 }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ask AI or rewrite selection..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleChatSubmit();
                  }
                }}
                disabled={aiRunning}
                style={{ fontSize: 12.5 }}
              />
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleChatSubmit}
                disabled={aiRunning || !chatInput.trim()}
                style={{ padding: '6px 12px', fontSize: 12 }}
              >
                Send
              </button>
            </div>

            {chatMessages.length > 0 && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ width: '100%', padding: '4px', fontSize: 10, color: 'var(--text-muted)' }} 
                onClick={clearChat}
              >
                Clear History
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
