import React from 'react';
import type { ChatConversation } from '../../types/chatTypes';
import { MessageSquare, Trash2, Plus, X, Clock } from 'lucide-react';

interface ChatHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ChatConversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
}

export const ChatHistoryDrawer: React.FC<ChatHistoryDrawerProps> = ({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation
}) => {
  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(3px)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 8
      }}
    >
      <div 
        style={{ 
          backgroundColor: 'var(--bg-secondary)', 
          borderBottom: '1px solid var(--border-color)',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
          <Clock size={14} style={{ color: 'var(--accent-purple)' }} />
          <span>Past Conversations ({conversations.length})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onNewConversation();
              onClose();
            }}
            style={{ padding: '3px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Plus size={12} />
            New Chat
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            style={{ padding: 4 }}
            title="Close History"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {conversations.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic' }}>
            No saved conversations yet. Start chatting with AI CoWriter to record sessions!
          </div>
        ) : (
          conversations.map(conv => {
            const isActive = conv.id === activeConversationId;
            const messageCount = conv.messages.length;
            return (
              <div
                key={conv.id}
                onClick={() => {
                  onSelectConversation(conv.id);
                  onClose();
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  backgroundColor: isActive ? 'var(--accent-purple-dim)' : 'var(--bg-tertiary)',
                  border: `1px solid ${isActive ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden', flex: 1, marginRight: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MessageSquare size={12} style={{ color: isActive ? 'var(--accent-purple)' : 'var(--text-muted)', flexShrink: 0 }} />
                    <span style={{ fontSize: 11.5, fontWeight: isActive ? 700 : 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.title || 'Untitled Conversation'}
                    </span>
                  </div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
                    <span>{formatDate(conv.updatedAt || conv.createdAt)}</span>
                    <span>•</span>
                    <span>{messageCount} msg{messageCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-icon"
                  onClick={(e) => onDeleteConversation(conv.id, e)}
                  style={{ padding: 4, color: 'var(--text-muted)' }}
                  title="Delete Conversation"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
