import React, { useState } from 'react';
import { useStore } from '../../store';
import { Plus, Trash2 } from 'lucide-react';

export const ScrapbookNotes: React.FC = () => {
  const { project, addNote, updateNote, deleteNote } = useStore();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {activeNoteId === null ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>SCRAPBOOK NOTES</span>
            <button 
              type="button"
              className="btn-icon" 
              onClick={() => addNote('New Note Idea', 'Write down world elements or scene ideas...')}
              title="Add Note"
              style={{ padding: 2 }}
            >
              <Plus size={15} />
            </button>
          </div>

          <div className="notes-grid" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {project.notes.map(n => (
              <div 
                key={n.id} 
                className="tree-item"
                onClick={() => setActiveNoteId(n.id)}
                style={{ padding: '6px 8px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
              >
                <span style={{ fontSize: 12 }}>{n.title}</span>
                <div className="tree-actions">
                  <button 
                    type="button"
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete note?")) deleteNote(n.id);
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            {project.notes.length === 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                Scrapbook is empty. Click "+" to add.
              </div>
            )}
          </div>
        </>
      ) : (
        /* Note Editor View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button 
            type="button"
            className="btn btn-secondary" 
            style={{ alignSelf: 'flex-start', padding: '2px 8px', fontSize: 10.5 }}
            onClick={() => setActiveNoteId(null)}
          >
            &larr; Back
          </button>
          {(() => {
            const note = project.notes.find(n => n.id === activeNoteId);
            if (!note) return <div style={{ fontSize: 12 }}>Note not found.</div>;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 9.5 }}>Note Title</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ padding: '6px 10px', fontSize: 12 }}
                    value={note.title} 
                    onChange={e => updateNote(note.id, { title: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 9.5 }}>Content</label>
                  <textarea 
                    className="form-textarea" 
                    style={{ minHeight: 200, fontSize: 11.5 }}
                    value={note.content} 
                    onChange={e => updateNote(note.id, { content: e.target.value })}
                  />
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
