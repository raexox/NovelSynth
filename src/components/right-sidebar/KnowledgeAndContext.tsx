import React, { useState } from 'react';
import { useStore } from '../../store';
import { BookOpen } from 'lucide-react';

export const KnowledgeAndContext: React.FC = () => {
  const {
    aiRunning,
    activeContexts,
    researchResults,
    runResearch
  } = useStore();

  const [researchQuery, setResearchQuery] = useState('');

  const handleResearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!researchQuery.trim()) return;
    runResearch(researchQuery);
  };

  return (
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
  );
};
