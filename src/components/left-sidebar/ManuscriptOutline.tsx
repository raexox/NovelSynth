import React, { useState } from 'react';
import { useStore } from '../../store';
import { ChevronDown, ChevronRight, Plus, BookOpen, Trash2 } from 'lucide-react';

export const ManuscriptOutline: React.FC = () => {
  const {
    project,
    activeSceneId,
    selectScene,
    addChapter,
    addScene,
    deleteScene,
    deleteChapter
  } = useStore();

  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    'ch-1': true,
    'ch-2': true,
    'ch-3': true
  });
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [showAddChapter, setShowAddChapter] = useState(false);

  const toggleChapterExpand = (chId: string) => {
    setExpandedChapters(prev => ({ ...prev, [chId]: !prev[chId] }));
  };

  const handleAddChapterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;
    addChapter(newChapterTitle);
    setNewChapterTitle('');
    setShowAddChapter(false);
  };

  return (
    <div style={{ padding: 10 }}>
      {showAddChapter && (
        <form onSubmit={handleAddChapterSubmit} style={{ marginBottom: 12, display: 'flex', gap: 6 }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Chapter Title..." 
            value={newChapterTitle} 
            onChange={e => setNewChapterTitle(e.target.value)} 
            autoFocus
            style={{ fontSize: 12, padding: '4px 8px' }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '4px 8px', fontSize: 11 }}>Add</button>
        </form>
      )}

      <div className="manuscript-tree">
        {project.chapters
          .sort((a, b) => a.order - b.order)
          .map(ch => {
            const chScenes = project.scenes
              .filter(s => s.chapterId === ch.id)
              .sort((a, b) => a.order - b.order);
            const isExpanded = expandedChapters[ch.id];

            return (
              <div key={ch.id} style={{ marginBottom: 6 }}>
                <div 
                  className="tree-item"
                  style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12.5 }}
                  onClick={() => toggleChapterExpand(ch.id)}
                >
                  <span className="tree-item-title">
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    {ch.title}
                  </span>
                  <div className="tree-actions">
                    <button 
                      className="btn-icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        addScene(ch.id, `New Scene ${chScenes.length + 1}`);
                      }}
                      title="Add Scene"
                    >
                      <Plus size={12} />
                    </button>
                    <button 
                      className="btn-icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete chapter and all its scenes?")) deleteChapter(ch.id);
                      }}
                      title="Delete Chapter"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ paddingLeft: 12, borderLeft: '1px solid var(--border-color)', marginLeft: 6, marginTop: 2 }}>
                    {chScenes.map(sc => (
                      <div 
                        key={sc.id} 
                        className={`tree-item ${activeSceneId === sc.id ? 'selected' : ''}`}
                        onClick={() => selectScene(sc.id)}
                        style={{ fontSize: 12, padding: '4px 6px' }}
                      >
                        <span className="tree-item-title" style={{ gap: 6 }}>
                          <BookOpen size={11} style={{ opacity: 0.7 }} />
                          {sc.title}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className={`badge badge-${sc.status}`} style={{
                            fontSize: 8.5,
                            padding: '1px 4px',
                            borderRadius: 3,
                            textTransform: 'capitalize',
                            backgroundColor: sc.status === 'finished' ? 'var(--color-success-bg)' : sc.status === 'review' ? 'var(--accent-gold-dim)' : 'var(--bg-primary)',
                            color: sc.status === 'finished' ? 'var(--color-success)' : sc.status === 'review' ? 'var(--accent-gold)' : 'var(--text-muted)',
                            border: '1px solid ' + (sc.status === 'finished' ? 'var(--color-success)' : sc.status === 'review' ? 'var(--accent-gold)' : 'var(--border-color)')
                          }}>
                            {sc.status}
                          </span>
                          <div className="tree-actions">
                            <button 
                              className="btn-icon" 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Delete this scene?")) deleteScene(sc.id);
                              }}
                              title="Delete Scene"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {chScenes.length === 0 && (
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', padding: '4px 8px' }}>
                        No scenes. Click + to add.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};
