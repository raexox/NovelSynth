import React, { useState } from 'react';
import { useStore } from '../../store';
import { ChevronDown, ChevronRight, Plus, BookOpen, Trash2, Edit3, X } from 'lucide-react';

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

  const sortedChapters = [...project.chapters].sort((a, b) => a.order - b.order);

  return (
    <div className="manuscript-outline">
      <div className="sidebar-mini-toolbar">
        <div>
          <div className="sidebar-mini-title">Chapters</div>
          <div className="sidebar-mini-meta">
            {project.chapters.length} chapter{project.chapters.length === 1 ? '' : 's'} / {project.scenes.length} scene{project.scenes.length === 1 ? '' : 's'}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary sidebar-action-button"
          onClick={() => setShowAddChapter(true)}
          title="New Chapter"
        >
          <Plus size={13} />
          <span>Chapter</span>
        </button>
      </div>

      {showAddChapter && (
        <form onSubmit={handleAddChapterSubmit} className="sidebar-inline-form">
          <input 
            type="text" 
            className="form-input" 
            placeholder="Chapter title" 
            value={newChapterTitle} 
            onChange={e => setNewChapterTitle(e.target.value)} 
            autoFocus
          />
          <button type="submit" className="btn btn-primary sidebar-icon-label-btn">
            <Plus size={13} />
            Add
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={() => {
              setShowAddChapter(false);
              setNewChapterTitle('');
            }}
            title="Cancel"
          >
            <X size={14} />
          </button>
        </form>
      )}

      <div className="manuscript-tree">
        {sortedChapters.length === 0 && (
          <div className="sidebar-empty-state">
            <BookOpen size={18} />
            <span>No chapters yet.</span>
            <button type="button" className="btn btn-primary sidebar-icon-label-btn" onClick={() => setShowAddChapter(true)}>
              <Plus size={13} />
              New Chapter
            </button>
          </div>
        )}

        {sortedChapters.map(ch => {
            const chScenes = project.scenes
              .filter(s => s.chapterId === ch.id)
              .sort((a, b) => a.order - b.order);
            const isExpanded = expandedChapters[ch.id];
            const isActiveChapter = project.scenes.find(s => s.id === activeSceneId)?.chapterId === ch.id;

            return (
              <div key={ch.id} style={{ marginBottom: 6 }}>
                <div 
                  className={`tree-item ${isActiveChapter ? 'selected' : ''}`}
                  style={{ color: isActiveChapter ? 'var(--accent-purple)' : 'var(--text-primary)' }}
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
                  <div className="tree-actions tree-actions-visible" onClick={e => e.stopPropagation()}>
                    <button 
                      className="btn-icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        addScene(ch.id, `New Scene ${chScenes.length + 1}`);
                        setExpandedChapters(prev => ({ ...prev, [ch.id]: true }));
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
                  <div className="scene-tree-branch">
                    {chScenes.map(sc => (
                      <div 
                        key={sc.id} 
                        className={`tree-item ${activeSceneId === sc.id ? 'selected' : ''}`}
                        onClick={() => selectScene(sc.id)}
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
                        <div className="scene-row-actions" onClick={e => e.stopPropagation()}>
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
                          <div className="tree-actions tree-actions-visible">
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
                      <div className="sidebar-empty-row">
                        <span>No scenes yet.</span>
                        <button
                          type="button"
                          className="btn btn-secondary sidebar-icon-label-btn"
                          onClick={() => {
                            addScene(ch.id, 'New Scene 1');
                            setExpandedChapters(prev => ({ ...prev, [ch.id]: true }));
                          }}
                        >
                          <Plus size={12} />
                          Scene
                        </button>
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
