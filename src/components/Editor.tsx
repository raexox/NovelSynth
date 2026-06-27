import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { 
  Columns, Maximize2, Minimize2, Save, CheckCircle2, 
  X, AlertTriangle 
} from 'lucide-react';
import { TextHighlightOverlay } from './editor/TextHighlightOverlay';

export const Editor: React.FC = () => {
  const {
    project,
    activeSceneId,
    updateSceneContent,
    updateScene,
    pendingMemoryUpdate,
    approveMemory,
    rejectMemory,
    triggerMemoryGeneration,
    selectedText,
    setSelectedText
  } = useStore();

  const [splitScreen, setSplitScreen] = useState(false);
  const [splitViewMode, setSplitViewMode] = useState<'markdown' | 'preview'>('preview');
  const [secondarySceneId, setSecondarySceneId] = useState<string | null>(null);
  
  // Settings overrides
  const [focusMode, setFocusMode] = useState(false);
  const [typewriterMode, setTypewriterMode] = useState(false);
  const [autosaveText, setAutosaveText] = useState('Saved locally');
  const [memoryFactDrafts, setMemoryFactDrafts] = useState<Array<{ enabled: boolean; entityName: string; factType: string; factText: string; entityType: any; entityId?: string | null; status?: any }>>([]);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);

  const mainEditorRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const activeScene = project.scenes.find(s => s.id === activeSceneId);
  const secondaryScene = project.scenes.find(s => s.id === secondarySceneId) || project.scenes[0];

  useEffect(() => {
    if (!selectedText) {
      setSelectionRange(null);
    }
  }, [selectedText]);

  useEffect(() => {
    if (!pendingMemoryUpdate) {
      setMemoryFactDrafts([]);
      return;
    }

    setMemoryFactDrafts((pendingMemoryUpdate.proposedFacts || []).map(fact => ({
      enabled: true,
      entityType: fact.entityType,
      entityId: fact.entityId,
      entityName: fact.entityName || '',
      factType: fact.factType || 'other',
      factText: fact.factText || '',
      status: fact.status || 'active'
    })));
  }, [pendingMemoryUpdate]);

  // Auto-Save animation simulation
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!activeScene) return;
    updateSceneContent(activeScene.id, e.target.value);
    setAutosaveText('Saving...');
  };

  const handleSelectText = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start !== end) {
      const text = textarea.value.substring(start, end);
      setSelectedText(text);
      setSelectionRange({ start, end });
    } else {
      setSelectedText('');
      setSelectionRange(null);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (overlayRef.current) {
      overlayRef.current.scrollTop = e.currentTarget.scrollTop;
      overlayRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  useEffect(() => {
    if (autosaveText === 'Saving...') {
      const timer = setTimeout(() => {
        setAutosaveText('Saved locally');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autosaveText]);

  // Synchronize layout styles with document root classes (for sidebars)
  useEffect(() => {
    const body = document.querySelector('.app-body');
    if (body) {
      if (focusMode) {
        body.classList.add('focus-mode-active');
      } else {
        body.classList.remove('focus-mode-active');
      }
    }
  }, [focusMode]);

  // Handle scene completion
  const handleStatusChange = (status: 'draft' | 'review' | 'finished') => {
    if (!activeScene) return;
    
    setAutosaveText('Saving...');
    updateScene(activeScene.id, { status });
    
    if (status === 'finished') {
      triggerMemoryGeneration(activeScene.id);
    }
  };

  // Convert basic markdown tags to simple HTML for preview
  const parseMarkdown = (markdown: string) => {
    if (!markdown) return '';
    let html = markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br />');
    return `<p>${html}</p>`;
  };

  if (!activeScene) {
    return (
      <div className="center-editor-panel" style={{ alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <p>No Scene Selected. Select or create a scene from the left outline to begin writing.</p>
      </div>
    );
  }

  const activeChapter = project.chapters.find(c => c.id === activeScene.chapterId);

  return (
    <div className="center-editor-panel">
      {/* Editor Header / Breadcrumbs */}
      <div className="editor-header">
        <div className="breadcrumbs">
          <span className="breadcrumb-chapter">{activeChapter?.title || 'Drafts'}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{activeScene.title}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Status selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Status:</span>
            <select
              className="form-select"
              style={{ padding: '3px 6px', fontSize: 11, width: 'auto', background: 'var(--bg-tertiary)' }}
              value={activeScene.status}
              onChange={e => handleStatusChange(e.target.value as any)}
            >
              <option value="draft">Draft</option>
              <option value="review">Under Review</option>
              <option value="finished">Finished</option>
            </select>
          </div>

          {/* Toggle buttons */}
          <button 
            className={`btn-icon ${typewriterMode ? 'selected' : ''}`} 
            onClick={() => setTypewriterMode(!typewriterMode)}
            style={{ color: typewriterMode ? 'var(--accent-purple)' : 'var(--text-muted)' }}
            title="Typewriter Mode (keeps cursor centered)"
          >
            <Columns size={16} style={{ transform: 'rotate(90deg)' }} />
          </button>
          
          <button 
            className={`btn-icon ${splitScreen ? 'selected' : ''}`} 
            onClick={() => setSplitScreen(!splitScreen)}
            style={{ color: splitScreen ? 'var(--accent-purple)' : 'var(--text-muted)' }}
            title="Split Panel View"
          >
            <Columns size={16} />
          </button>

          <button 
            className={`btn-icon ${focusMode ? 'selected' : ''}`} 
            onClick={() => setFocusMode(!focusMode)}
            style={{ color: focusMode ? 'var(--accent-purple)' : 'var(--text-muted)' }}
            title="Focus Mode (Distraction-Free)"
          >
            {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Editor Core */}
      <div className={`editors-split-container ${typewriterMode ? 'typewriter-mode-active' : ''}`}>
        
        {/* Main Editor Panel */}
        <div className="editor-container">
          <TextHighlightOverlay
            content={activeScene.content}
            selectedText={selectedText}
            selectionRange={selectionRange}
            overlayRef={overlayRef}
          />
          <textarea
            ref={mainEditorRef}
            className="editor-textarea"
            value={activeScene.content}
            onChange={handleTextChange}
            onSelect={handleSelectText}
            onKeyUp={handleSelectText}
            onScroll={handleScroll}
            placeholder="Type your manuscript here. Use standard Markdown formats (# for Headings, ** for bold)."
            autoFocus
          />
        </div>

        {/* Secondary Split Panel (Preview or Secondary Scene) */}
        {splitScreen && (
          <div className="editor-container" style={{ borderLeft: '1px solid var(--border-color)' }}>
            {/* Split controls */}
            <div style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className={`btn`}
                  style={{ padding: '2px 8px', fontSize: 10, backgroundColor: splitViewMode === 'preview' ? 'var(--accent-purple)' : 'var(--bg-tertiary)', color: splitViewMode === 'preview' ? 'white' : 'var(--text-secondary)' }}
                  onClick={() => setSplitViewMode('preview')}
                >
                  Preview HTML
                </button>
                <button
                  className={`btn`}
                  style={{ padding: '2px 8px', fontSize: 10, backgroundColor: splitViewMode === 'markdown' ? 'var(--accent-purple)' : 'var(--bg-tertiary)', color: splitViewMode === 'markdown' ? 'white' : 'var(--text-secondary)' }}
                  onClick={() => setSplitViewMode('markdown')}
                >
                  Reference Scene
                </button>
              </div>

              {splitViewMode === 'markdown' && (
                <select
                  value={secondarySceneId || ''}
                  onChange={e => setSecondarySceneId(e.target.value)}
                  style={{ fontSize: 10, background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: 3, padding: '2px 4px' }}
                >
                  {project.scenes
                    .filter(s => s.id !== activeScene.id)
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                </select>
              )}
            </div>

            {/* Split Content */}
            {splitViewMode === 'preview' ? (
              <div 
                className="editor-preview"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(activeScene.content) }}
              />
            ) : (
              <textarea
                className="editor-textarea"
                value={secondaryScene?.content || ''}
                readOnly
                placeholder="Select a reference scene to view side-by-side."
              />
            )}
          </div>
        )}
      </div>

      {/* Floating Glassmorphic Memory Approval Modal */}
      {pendingMemoryUpdate && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            width: '600px',
            maxWidth: '90%',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color-focus)',
            borderRadius: 8,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(90deg, var(--bg-tertiary), var(--accent-purple-dim))'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-purple)' }}>
                <CheckCircle2 size={20} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>Scene Complete: Memory Generator</span>
              </div>
              <button className="btn-icon" onClick={rejectMemory}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: 20, overflowY: 'auto', maxHeight: '400px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 10, padding: 10, backgroundColor: 'var(--color-success-bg)', borderLeft: '3px solid var(--color-success)', borderRadius: 4 }}>
                <AlertTriangle size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-primary)' }}>
                  <strong>Writer-First Approval</strong>: Before summaries and facts are logged into the Story Bible or world record, you must approve the AI's generated memory additions.
                </p>
              </div>

              <div>
                <label className="form-label">Structured Scene Summary</label>
                <div style={{ fontSize: 13, backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: 10, borderRadius: 4, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {pendingMemoryUpdate.summary}
                </div>
              </div>

              <div>
                <label className="form-label">Revealed Facts & Events</label>
                <ul style={{ listStyleType: 'disc', paddingLeft: 18, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {pendingMemoryUpdate.events.map((e, i) => <li key={i}>{e}</li>)}
                  {pendingMemoryUpdate.newFacts.map((f, i) => <li key={i} style={{ color: 'var(--accent-purple)' }}><strong>New Fact:</strong> {f}</li>)}
                </ul>
              </div>

              <div>
                <label className="form-label">Unresolved Questions & Mysteries</label>
                <ul style={{ listStyleType: 'disc', paddingLeft: 18, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {pendingMemoryUpdate.unresolvedQuestions.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </div>

              <div>
                <label className="form-label">Story Bible Updates</label>
                <div style={{ fontSize: 11, color: 'var(--accent-gold)', border: '1px solid var(--accent-gold-dim)', backgroundColor: 'var(--accent-gold-dim)', padding: 8, borderRadius: 4 }}>
                  &bull; Approved facts are added to the Continuity Ledger. Matching Story Bible profiles receive a version checkpoint before canon changes are logged.
                </div>
              </div>

              <div>
                <label className="form-label">Continuity Ledger Facts</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {memoryFactDrafts.length === 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 4, padding: 10 }}>
                      No structured ledger facts were proposed for this scene.
                    </div>
                  )}
                  {memoryFactDrafts.map((fact, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 8, alignItems: 'start', border: '1px solid var(--border-color)', borderRadius: 4, padding: 8, backgroundColor: 'var(--bg-tertiary)' }}>
                      <input
                        type="checkbox"
                        checked={fact.enabled}
                        onChange={e => setMemoryFactDrafts(current => current.map((item, i) => i === index ? { ...item, enabled: e.target.checked } : item))}
                        style={{ marginTop: 7 }}
                        aria-label={`Include continuity fact ${index + 1}`}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                          <input
                            className="form-input"
                            style={{ fontSize: 11, padding: '5px 7px' }}
                            value={fact.entityName}
                            onChange={e => setMemoryFactDrafts(current => current.map((item, i) => i === index ? { ...item, entityName: e.target.value } : item))}
                            placeholder="Entity"
                          />
                          <input
                            className="form-input"
                            style={{ fontSize: 11, padding: '5px 7px' }}
                            value={fact.factType}
                            onChange={e => setMemoryFactDrafts(current => current.map((item, i) => i === index ? { ...item, factType: e.target.value } : item))}
                            placeholder="Fact type"
                          />
                        </div>
                        <textarea
                          className="form-textarea"
                          style={{ minHeight: 54, fontSize: 11, padding: '6px 7px' }}
                          value={fact.factText}
                          onChange={e => setMemoryFactDrafts(current => current.map((item, i) => i === index ? { ...item, factText: e.target.value } : item))}
                          placeholder="Canonical fact"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 10, justifyContent: 'flex-end', backgroundColor: 'var(--bg-tertiary)' }}>
              <button className="btn btn-secondary" onClick={rejectMemory}>
                Discard Memory
              </button>
              <button 
                className="btn btn-primary" 
                style={{ backgroundColor: 'var(--color-success)' }}
                onClick={() => approveMemory(memoryFactDrafts.length > 0
                  ? memoryFactDrafts.filter(fact => fact.enabled).map(({ enabled: _enabled, ...fact }) => fact)
                  : undefined
                )}
              >
                Approve & Add to Bible
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Status / Statistics Bar */}
      <div className="statusbar">
        <div style={{ display: 'flex', gap: 16 }}>
          <span>Words: {activeScene.wordCount}</span>
          <span>Reading time: {Math.max(1, Math.ceil(activeScene.wordCount / 200))} min</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Save size={12} style={{ color: 'var(--color-success)' }} />
            {autosaveText}
          </span>
        </div>
        <div>
          <span>Line {activeScene.content.split('\n').length}, Col {activeScene.content.length}</span>
        </div>
      </div>
    </div>
  );
};
