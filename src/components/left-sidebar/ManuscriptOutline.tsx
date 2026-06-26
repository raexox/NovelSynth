import React, { useState } from 'react';
import { useStore } from '../../store';
import { ChevronDown, ChevronRight, Plus, BookOpen, Trash2, Edit3 } from 'lucide-react';

export const ManuscriptOutline: React.FC = () => {
  const {
    project,
    activeSceneId,
    selectScene,
    addChapter,
    updateChapter,
    addScene,
    deleteScene,
    deleteChapter,
    updateScene
  } = useStore();

  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    'ch-1': true,
    'ch-2': true,
    'ch-3': true
  });
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingChapterTitle, setEditingChapterTitle] = useState('');
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editingSceneTitle, setEditingSceneTitle] = useState('');

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

  const startEditingChapter = (chId: string, currentTitle: string) => {
    setEditingChapterId(chId);
    setEditingChapterTitle(currentTitle);
  };

  const handleEditChapterSubmit = (chId: string) => {
    if (editingChapterTitle.trim()) {
      updateChapter(chId, { title: editingChapterTitle.trim() });
    }
    setEditingChapterId(null);
  };

  const startEditingScene = (scId: string, currentTitle: string) => {
    setEditingSceneId(scId);
    setEditingSceneTitle(currentTitle);
  };

  const handleEditSceneSubmit = (scId: string) => {
    if (editingSceneTitle.trim()) {
      updateScene(scId, { title: editingSceneTitle.trim() });
    }
    setEditingSceneId(null);
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
            const isActiveChapter = project.scenes.find(s => s.id === activeSceneId)?.chapterId === ch.id;

            return (
              <div key={ch.id} style={{ marginBottom: 6 }}>
                <div 
                  className={`tree-item ${isActiveChapter ? 'selected' : ''}`}
                  style={{ 
                    fontWeight: 600, 
                    color: isActiveChapter ? 'var(--accent-purple)' : 'var(--text-primary)', 
                    fontSize: 12.5,
                    backgroundColor: isActiveChapter ? 'hsla(265, 80%, 65%, 0.08)' : 'transparent',
                    borderLeft: isActiveChapter ? '2px solid var(--accent-purple)' : '2px solid transparent',
                    borderRadius: 4,
                    padding: '6px 8px 6px ' + (isActiveChapter ? '6px' : '8px'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => toggleChapterExpand(ch.id)}
                >
                  {editingChapterId === ch.id ? (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleEditChapterSubmit(ch.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: 'flex', gap: 4, flex: 1, marginRight: 6 }}
                    >
                      <input 
                        type="text"
                        className="form-input"
                        value={editingChapterTitle}
                        onChange={e => setEditingChapterTitle(e.target.value)}
                        autoFocus
                        onBlur={() => handleEditChapterSubmit(ch.id)}
                        style={{ fontSize: 11.5, padding: '2px 6px', height: 22 }}
                      />
                    </form>
                  ) : (
                    <span 
                      className="tree-item-title"
                      style={{ gap: 6 }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEditingChapter(ch.id, ch.title);
                      }}
                    >
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      <span style={{ fontSize: 10, opacity: 0.6, letterSpacing: '0.5px', textTransform: 'uppercase', marginRight: 2 }}>
                        Ch {ch.order}:
                      </span>
                      <span>{ch.title}</span>
                    </span>
                  )}
                  <div className="tree-actions" onClick={e => e.stopPropagation()}>
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
                        startEditingChapter(ch.id, ch.title);
                      }}
                      title="Rename Chapter"
                    >
                      <Edit3 size={11} />
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
                        {editingSceneId === sc.id ? (
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleEditSceneSubmit(sc.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ display: 'flex', gap: 4, flex: 1, marginRight: 6 }}
                          >
                            <input 
                              type="text"
                              className="form-input"
                              value={editingSceneTitle}
                              onChange={e => setEditingSceneTitle(e.target.value)}
                              autoFocus
                              onBlur={() => handleEditSceneSubmit(sc.id)}
                              style={{ fontSize: 11, padding: '2px 6px', height: 20 }}
                            />
                          </form>
                        ) : (
                          <span 
                            className="tree-item-title" 
                            style={{ gap: 6 }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              startEditingScene(sc.id, sc.title);
                            }}
                          >
                            <BookOpen size={11} style={{ opacity: 0.7 }} />
                            <span>{sc.title}</span>
                          </span>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
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
                                startEditingScene(sc.id, sc.title);
                              }}
                              title="Rename Scene"
                            >
                              <Edit3 size={10} />
                            </button>
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
