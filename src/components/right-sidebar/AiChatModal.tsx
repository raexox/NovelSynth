import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { Sparkles, Loader2, Send, X, Plus, Trash2, Mic, MicOff, Search, MessageSquare, Edit3 } from 'lucide-react';
import { notify } from '../../services/notifications';
import { useAssemblyAISpeech } from '../../hooks/useAssemblyAISpeech';
import { AiActionCard } from './AiActionCard';
import { parseAndNormalizeAiAction } from '../../utils/aiActionNormalizer';

interface AiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiChatModal: React.FC<AiChatModalProps> = ({ isOpen, onClose }) => {
  const {
    aiRunning,
    conversations,
    activeConversationId,
    chatMessages,
    selectedText,
    sendChatMessage,
    replaceSelectedText,
    createNewConversation,
    selectConversation,
    deleteConversation
  } = useStore();

  const [chatInput, setChatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen]);

  // Auto-expand textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [chatInput]);

  if (!isOpen) return null;

  const handleChatSubmit = () => {
    if (!chatInput.trim() || aiRunning) return;
    if (isListening) {
      toggleListening(chatInput);
    }
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
      .replace(/^-\s(.*$)/gim, '<li style="margin-left:16px;font-size:13px;margin-bottom:4px">$1</li>')
      .replace(/`([^`]+)`/g, '<code style="background-color:rgba(255,255,255,0.08);padding:2px 5px;border-radius:4px;font-family:var(--font-mono);font-size:12px">$1</code>')
      .replace(/\n\n/gim, '</p><p style="margin-bottom:8px">')
      .replace(/\n/gim, '<br />');
  };

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 7, 15, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: 1200,
          height: '90vh',
          backgroundColor: '#090d16',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          overflow: 'hidden'
        }}
      >
        {/* Left Sidebar - Past Chats */}
        <div 
          style={{
            width: 280,
            backgroundColor: '#0d1322',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            padding: 16,
            gap: 16
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>
              <Sparkles size={18} style={{ color: 'var(--accent-purple)' }} />
              <span>NovelSynth AI</span>
            </div>
          </div>

          <button
            type="button"
            className="btn"
            onClick={createNewConversation}
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: 'rgba(147, 51, 234, 0.15)',
              border: '1px solid rgba(147, 51, 234, 0.4)',
              borderRadius: 10,
              color: '#f3e8ff',
              fontWeight: 600,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Plus size={16} />
            <span>New chat</span>
          </button>

          {/* Search Chats */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#64748b' }} />
            <input 
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 8,
                padding: '7px 10px 7px 30px',
                fontSize: 12,
                color: '#f8fafc',
                outline: 'none'
              }}
            />
          </div>

          {/* Chats List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, paddingLeft: 4 }}>
              Chats
            </div>
            {filteredConversations.length === 0 ? (
              <div style={{ fontSize: 12, color: '#64748b', padding: 12, textAlign: 'center', fontStyle: 'italic' }}>
                No conversations found
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isActive = conv.id === activeConversationId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      backgroundColor: isActive ? 'rgba(147, 51, 234, 0.2)' : 'transparent',
                      border: isActive ? '1px solid rgba(147, 51, 234, 0.3)' : '1px solid transparent',
                      color: isActive ? '#f3e8ff' : '#94a3b8',
                      fontSize: 12.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      <MessageSquare size={14} style={{ flexShrink: 0, color: isActive ? 'var(--accent-purple)' : '#64748b' }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: isActive ? 600 : 400 }}>
                        {conv.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: 2,
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Delete chat"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Workspace - Central Chat Canvas & Floating Bar */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#090d16', position: 'relative' }}>
          {/* Header Bar */}
          <div 
            style={{ 
              height: 56, 
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)', 
              padding: '0 20px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              backgroundColor: '#0c111d'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#f8fafc' }}>
                {activeConv ? activeConv.title : 'AI Co-Writer Workspace'}
              </span>
              <span style={{ fontSize: 10.5, backgroundColor: 'rgba(147, 51, 234, 0.2)', color: '#d8b4fe', padding: '2px 8px', borderRadius: 12, border: '1px solid rgba(147, 51, 234, 0.3)', fontWeight: 600 }}>
                Gemini 3.5 Flash
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                borderRadius: 8,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Close expanded workspace"
            >
              <X size={18} />
            </button>
          </div>

          {/* Central Chat Stream */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '30px 40px 140px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {chatMessages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 60 }}>
                <h2 style={{ fontSize: 28, fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.5px' }}>
                  Ready when you are.
                </h2>
                <p style={{ fontSize: 14, color: '#94a3b8', margin: 0, maxWidth: 460, textAlign: 'center', lineHeight: 1.5 }}>
                  Ask for creative story ideas, revise selected manuscript text, or dictate scene outlines with AssemblyAI speech recognition.
                </p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => {
                const isUser = msg.role === 'user';

                // Find preceding user prompt for context matching
                let userPrompt = '';
                if (!isUser && idx > 0) {
                  userPrompt = chatMessages[idx - 1]?.content || '';
                }

                // Extract & normalize action payload
                let actionData: any = null;
                let displayContent = msg.content;
                if (!isUser) {
                  const parsed = parseAndNormalizeAiAction(msg.content, userPrompt);
                  actionData = parsed.action;
                  displayContent = parsed.cleanContent;
                }

                return (
                  <div 
                    key={idx}
                    style={{
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: isUser ? 'rgba(147, 51, 234, 0.25)' : '#131b2e',
                        border: isUser ? '1px solid rgba(147, 51, 234, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#f8fafc',
                        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        padding: '12px 18px',
                        fontSize: 13.5,
                        lineHeight: 1.6,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                      dangerouslySetInnerHTML={{ __html: parseChatMarkdown(displayContent) }}
                    />

                    {/* Proposed Action Card */}
                    {!isUser && actionData && (
                      <AiActionCard action={actionData} />
                    )}

                    {!isUser && selectedText && (
                      <button
                        type="button"
                        style={{
                          alignSelf: 'flex-start',
                          padding: '3px 10px',
                          fontSize: 11,
                          marginTop: 4,
                          backgroundColor: 'rgba(147, 51, 234, 0.15)',
                          border: '1px solid rgba(147, 51, 234, 0.4)',
                          color: '#d8b4fe',
                          fontWeight: 600,
                          borderRadius: 6,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        onClick={() => {
                          let cleanProse = msg.content;
                          if (cleanProse.includes('```')) {
                            const match = cleanProse.match(/```(?:markdown|text|prose)?\n([\s\S]*?)\n```/);
                            if (match && match[1]) cleanProse = match[1];
                          }
                          replaceSelectedText(cleanProse.trim());
                          notify({
                            tone: 'success',
                            title: 'Selection replaced',
                            message: 'Applied revised prose directly to your manuscript.'
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a855f7', fontSize: 13, fontStyle: 'italic', paddingLeft: 4 }}>
                <Loader2 size={16} className="animate-spin" />
                <span>AI Co-Writer is composing...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Floating Bottom Input Area */}
          <div 
            style={{ 
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90%',
              maxWidth: 760,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12
            }}
          >
            {/* Quick Action Suggestion Chips */}
            {selectedText && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setChatInput(`Rewrite this selected text in active voice: "${selectedText.slice(0, 80)}..."`)}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 20,
                    padding: '5px 12px',
                    fontSize: 11.5,
                    color: '#cbd5e1',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Edit3 size={13} style={{ color: '#38bdf8' }} />
                  <span>Rewrite Selected Text</span>
                </button>
              </div>
            )}

            {/* Floating Input Bar Pill */}
            <div 
              style={{
                width: '100%',
                backgroundColor: '#111827',
                border: isListening ? '1px solid var(--accent-purple)' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 20,
                padding: '8px 12px 8px 18px',
                display: 'flex',
                alignItems: 'flex-end',
                gap: 10,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
              }}
            >
              <textarea 
                ref={textareaRef}
                placeholder={isListening ? "Listening with AssemblyAI... speak now..." : "Ask anything..."}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { 
                  if (e.key === 'Enter' && !e.shiftKey) { 
                    e.preventDefault(); 
                    handleChatSubmit(); 
                  } 
                }}
                disabled={aiRunning}
                rows={1}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: '#f8fafc',
                  fontSize: 14,
                  resize: 'none',
                  minHeight: 24,
                  maxHeight: 140,
                  overflowY: 'auto',
                  lineHeight: 1.4,
                  fontFamily: 'inherit',
                  padding: 0,
                  margin: 0
                }}
              />

              <button
                type="button"
                onClick={() => toggleListening(chatInput)}
                disabled={aiRunning}
                title={isListening ? 'Stop listening' : 'Dictate with AssemblyAI'}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                  color: isListening ? '#ef4444' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {isListening ? <MicOff size={16} className="animate-pulse" /> : <Mic size={16} />}
              </button>

              <button
                type="button"
                onClick={handleChatSubmit}
                disabled={aiRunning || !chatInput.trim()}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: chatInput.trim() ? 'var(--accent-purple)' : 'rgba(255, 255, 255, 0.06)',
                  color: chatInput.trim() ? '#ffffff' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: chatInput.trim() ? 'pointer' : 'default',
                  transition: 'all 0.2s ease'
                }}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
