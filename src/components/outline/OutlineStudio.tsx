import React, { useState } from 'react';
import { useStore } from '../../store';
import { SceneOutlineCard } from './SceneOutlineCard';
import { 
  Sparkles, Plus, BookOpen, Layers, CheckCircle2, ListFilter, LayoutGrid, Search
} from 'lucide-react';

export const OutlineStudio: React.FC = () => {
  const { project, addChapter, addScene } = useStore();
  const [filterQuery, setFilterQuery] = useState('');
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [showAddChapter, setShowAddChapter] = useState(false);

  const chapters = [...project.chapters].sort((a, b) => a.order - b.order);

  const handleAddChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;
    addChapter(newChapterTitle.trim());
    setNewChapterTitle('');
    setShowAddChapter(false);
  };

  // Calculate global statistics
  let totalBeats = 0;
  let completedBeats = 0;
  project.scenes.forEach(s => {
    if (s.outline?.beats) {
      totalBeats += s.outline.beats.length;
      completedBeats += s.outline.beats.filter(b => b.completed).length;
    }
  });
  const overallProgress = totalBeats > 0 ? Math.round((completedBeats / totalBeats) * 100) : 0;

  return (
    <div className="outline-studio-container">
      {/* Studio Header Toolbar */}
      <div className="outline-studio-header">
        <div className="outline-studio-title-block">
          <div className="outline-studio-badge">
            <Layers size={14} />
            <span>Plotting Workspace</span>
          </div>
          <h2>Outline Studio</h2>
          <p className="outline-studio-subtitle">
            Structure your story, map scene sequences, and collaborate with AI on plot beats.
          </p>
        </div>

        <div className="outline-studio-controls">
          {/* Progress Pill */}
          <div className="outline-progress-pill" title="Overall completion of plot beats across all scenes">
            <CheckCircle2 size={15} className="progress-pill-icon" />
            <div className="progress-pill-text">
              <span className="progress-pill-label">Plot Completion</span>
              <span className="progress-pill-val">{completedBeats}/{totalBeats} beats ({overallProgress}%)</span>
            </div>
          </div>

          <button 
            type="button" 
            className="btn btn-primary"
            onClick={() => setShowAddChapter(true)}
          >
            <Plus size={15} />
            <span>Add Chapter</span>
          </button>
        </div>
      </div>

      {/* Add Chapter Modal / Inline Box */}
      {showAddChapter && (
        <form onSubmit={handleAddChapter} className="outline-add-chapter-banner">
          <input
            type="text"
            className="form-input"
            placeholder="Enter new chapter title..."
            value={newChapterTitle}
            onChange={e => setNewChapterTitle(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn btn-primary">Create Chapter</button>
          <button type="button" className="btn btn-secondary" onClick={() => setShowAddChapter(false)}>Cancel</button>
        </form>
      )}

      {/* Main Board Matrix (Chapters & Scenes) */}
      <div className="outline-matrix-body">
        {chapters.length === 0 ? (
          <div className="outline-empty-workspace">
            <BookOpen size={48} className="empty-icon" />
            <h3>No Chapters Created Yet</h3>
            <p>Start outlining your novel by adding your first chapter.</p>
            <button type="button" className="btn btn-primary" onClick={() => setShowAddChapter(true)}>
              <Plus size={16} /> Add First Chapter
            </button>
          </div>
        ) : (
          chapters.map((chapter, index) => {
            const chapterScenes = project.scenes
              .filter(s => s.chapterId === chapter.id)
              .sort((a, b) => a.order - b.order);

            return (
              <div key={chapter.id} className="outline-chapter-section">
                <div className="outline-chapter-header">
                  <div className="chapter-header-left">
                    <span className="chapter-number-badge">Ch. {index + 1}</span>
                    <h3 className="chapter-title">{chapter.title}</h3>
                    <span className="chapter-scene-count">({chapterScenes.length} scenes)</span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm add-scene-btn"
                    onClick={() => addScene(chapter.id, `Scene ${chapterScenes.length + 1}`)}
                  >
                    <Plus size={13} />
                    <span>Scene</span>
                  </button>
                </div>

                {/* Grid of Scene Outline Cards */}
                <div className="outline-scenes-grid">
                  {chapterScenes.length === 0 ? (
                    <div className="outline-empty-chapter-box">
                      <span>No scenes in this chapter.</span>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-xs"
                        onClick={() => addScene(chapter.id, 'Scene 1')}
                      >
                        + Add Scene 1
                      </button>
                    </div>
                  ) : (
                    chapterScenes.map(scene => (
                      <SceneOutlineCard key={scene.id} scene={scene} />
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
