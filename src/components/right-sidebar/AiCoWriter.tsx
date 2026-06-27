import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { Sparkles, Loader2, Send, X, ChevronDown, ChevronRight, History, Plus, Mic, MicOff } from 'lucide-react';
import { ProseRevisionCard } from './ProseRevisionCard';
import { ChatHistoryDrawer } from './ChatHistoryDrawer';
import { notify } from '../../services/notifications';
import { useAssemblyAISpeech } from '../../hooks/useAssemblyAISpeech';

export const AiCoWriter: React.FC = () => {
  const {
    aiRunning,
    revisionSuggestions,
    conversations,
    activeConversationId,
    chatMessages,
    selectedText,
    setSelectedText,
    sendChatMessage,
    replaceSelectedText,
    createNewConversation,
    selectConversation,
    deleteConversation,
    runAIRevision
  } = useStore();

  const [revisionMode, setRevisionMode] = useState<'light' | 'style' | 'line' | 'dev'>('line');
  const [chatInput, setChatInput] = useState('');
  const [showRevisionTool, setShowRevisionTool] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const baseTextRef = useRef('');
  const activeConv = conversations.find(c => c.id === activeConversationId);

  const { isListening, toggleListening } = useAssemblyAISpeech({
    onResult: (speechText) => {
      setChatInput(speechText);
    },
    onError: (errMessage) => {
      notify({
        tone: 'error',
        title: 'AssemblyAI Voice Error',
        message: errMessage
      });
    }
  });

  const handleMicClick = () => {
    toggleListening(chatInput);
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 10, position: 'relative' }}>
      {/* Chat History Slide-over Drawer */}
      <ChatHistoryDrawer
        isOpen={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={selectConversation}
        onNewConversation={createNewConversation}
        onDeleteConversation={(id, e) => {
          e.stopPropagation();
          deleteConversation(id);
        }}
      />

      {/* Top Chat Session Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 6, padding: '6px 10px', flexShrink: 0 }}>
        <button
          type="button"
          className="btn"
          onClick={() => setShowHistoryDrawer(true)}
          style={{ padding: '3px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          title="View Past Conversations"
        >
          <History size={13} style={{ color: 'var(--accent-purple)' }} />
          <span style={{ maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {activeConv ? activeConv.title : 'Chat History'}
          </span>
          <span style={{ fontSize: 9.5, backgroundColor: 'var(--accent-purple-dim)', color: 'var(--accent-purple)', padding: '1px 5px', borderRadius: 10, fontWeight: 700 }}>
            {conversations.length}
          </span>
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={createNewConversation}
          style={{ padding: '3px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
          title="Start New Chat"
        >
          <Plus size={13} />
          <span>New Chat</span>
        </button>
      </div>
      {/* Revision Suggestions Diff view */}
      {revisionSuggestions && <ProseRevisionCard revisionMode={revisionMode} />}

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
              type="button"
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
                      notify({
                        tone: 'success',
                        title: 'Selection replaced',
                        message: 'The revised text was applied to the manuscript.'
                      });
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
          placeholder={isListening ? "Listening... speak now..." : "Type brainstorming prompt..."}
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleChatSubmit(); }}
          disabled={aiRunning}
          style={{ 
            fontSize: 12, 
            padding: '6px 10px',
            borderColor: isListening ? 'var(--accent-purple)' : undefined
          }}
        />
        <button 
          type="button" 
          className={`btn ${isListening ? 'btn-danger' : 'btn-secondary'}`}
          onClick={handleMicClick}
          disabled={aiRunning}
          title={isListening ? 'Stop AssemblyAI listening' : 'Dictate with AssemblyAI Speech-to-Text'}
          style={{ 
            padding: '6px 10px', 
            fontSize: 12, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: isListening ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-secondary)',
            borderColor: isListening ? '#ef4444' : 'var(--border-color)',
            color: isListening ? '#ef4444' : 'var(--text-primary)',
            transition: 'all 0.2s ease'
          }}
        >
          {isListening ? <MicOff size={13} className="animate-pulse" /> : <Mic size={13} />}
        </button>
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
          onClick={createNewConversation}
        >
          Start New Conversation Thread
        </button>
      )}
    </div>
  );
};
