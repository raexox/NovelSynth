import React, { useState } from 'react';
import { useStore } from '../../store';
import type { Scene } from '../../types';
import { 
  Sparkles, Plus, Trash2, CheckSquare, Square, FileText, ArrowRight, CornerDownRight, Layers, User, X
} from 'lucide-react';

interface SceneOutlineCardProps {
  scene: Scene;
}

export const SceneOutlineCard: React.FC<SceneOutlineCardProps> = ({ scene }) => {
  const { 
    project,
    updateSceneMetadata,
    updateSceneOutline, 
    addPlotBeat, 
    togglePlotBeat, 
    deletePlotBeat, 
    expandSceneBeatsWithAI,
    selectScene,
    setViewMode,
    aiRunning
  } = useStore();

  const [newBeatText, setNewBeatText] = useState('');
  const [isExpanding, setIsExpanding] = useState(false);

  const outline = scene.outline || { summary: '', beats: [] };
  const beats = outline.beats || [];

  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateSceneOutline(scene.id, { summary: e.target.value });
  };

  const handleAddBeatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBeatText.trim()) return;
    addPlotBeat(scene.id, newBeatText.trim());
    setNewBeatText('');
  };

  const handleAiExpand = async () => {
    setIsExpanding(true);
    try {
      await expandSceneBeatsWithAI(scene.id);
    } finally {
      setIsExpanding(false);
    }
  };

  const handleJumpToEditor = () => {
    selectScene(scene.id);
    setViewMode('editor');
  };

  const completedCount = beats.filter(b => b.completed).length;
  const progressPercent = beats.length > 0 ? Math.round((completedCount / beats.length) * 100) : 0;

  return (
    <div className="scene-outline-card">
      <div className="scene-outline-card-header">
        <div className="scene-card-title-group">
          <FileText size={15} className="scene-card-icon" />
          <h4 className="scene-card-title" title={scene.title}>{scene.title}</h4>
        </div>
        <button 
          type="button" 
          className="btn btn-secondary btn-sm jump-to-editor-btn"
          onClick={handleJumpToEditor}
          title="Jump to Prose Editor"
        >
          <span>Write</span>
          <ArrowRight size={13} />
        </button>
      </div>

      <div className="scene-outline-card-body">
        {/* Rough Scene Summary / Pitch */}
        <div className="outline-field-group">
          <label className="outline-field-label">
            <span>Rough Concept / Plot Goal</span>
          </label>
          <textarea
            className="form-textarea outline-summary-textarea"
            placeholder="e.g. Main character travels from Village A to Village B, encountering an unexpected storm..."
            value={outline.summary || ''}
            onChange={handleSummaryChange}
            rows={2}
          />
        </div>

        {/* Featured Cast / Characters in Scene */}
        <div className="outline-field-group">
          <label className="outline-field-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <User size={11} />
            <span>Cast in Scene</span>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <select
              className="form-select"
              style={{ padding: '3px 8px', fontSize: 11 }}
              value=""
              onChange={e => {
                const val = e.target.value;
                if (val && !(scene.metadata?.characters || []).includes(val)) {
                  updateSceneMetadata(scene.id, {
                    characters: [...(scene.metadata?.characters || []), val]
                  });
                }
              }}
            >
              <option value="">+ Tag character in scene...</option>
              {(project.storyBible?.characters || [])
                .filter(c => !(scene.metadata?.characters || []).includes(c.name))
                .map((c, idx) => (
                  <option key={idx} value={c.name}>{c.name} ({c.role || 'Character'})</option>
                ))}
            </select>

            {/* Tag Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {(scene.metadata?.characters || []).length > 0 && (
                (scene.metadata?.characters || []).map((charName, idx) => (
                  <span 
                    key={idx} 
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 4, 
                      backgroundColor: 'var(--bg-primary)', 
                      border: '1px solid var(--border-color)', 
                      padding: '2px 6px', 
                      borderRadius: 12, 
                      fontSize: 10, 
                      color: 'var(--accent-purple)',
                      fontWeight: 600
                    }}
                  >
                    {charName}
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}
                      onClick={() => {
                        updateSceneMetadata(scene.id, {
                          characters: (scene.metadata?.characters || []).filter(c => c !== charName)
                        });
                      }}
                      title="Remove tag"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sequential Plot Beats */}
        <div className="outline-beats-section">
          <div className="beats-section-header">
            <div className="beats-header-title">
              <Layers size={13} />
              <span>Plot Beats ({completedCount}/{beats.length})</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-xs ai-expand-beats-btn"
              onClick={handleAiExpand}
              disabled={aiRunning || isExpanding}
              title="Use AI to suggest intermediate plot beats based on your summary"
            >
              <Sparkles size={12} className={isExpanding ? 'spin-animation' : ''} />
              <span>{isExpanding ? 'Expanding...' : '✨ Expand Beats'}</span>
            </button>
          </div>

          {/* Progress bar */}
          {beats.length > 0 && (
            <div className="beats-progress-bar-bg">
              <div 
                className="beats-progress-bar-fill" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          )}

          {/* Beat List */}
          <div className="beats-list">
            {beats.length === 0 ? (
              <div className="beats-empty-state">
                <CornerDownRight size={13} />
                <span>No beats added yet. Type below or use AI to generate.</span>
              </div>
            ) : (
              beats.map((beat, index) => (
                <div key={beat.id} className={`beat-item ${beat.completed ? 'completed' : ''}`}>
                  <button
                    type="button"
                    className="beat-checkbox-btn"
                    onClick={() => togglePlotBeat(scene.id, beat.id)}
                    title={beat.completed ? 'Mark incomplete' : 'Mark completed'}
                  >
                    {beat.completed ? <CheckSquare size={14} className="beat-checked-icon" /> : <Square size={14} />}
                  </button>
                  <span className="beat-index">{index + 1}.</span>
                  <span className="beat-text">{beat.text}</span>
                  <button
                    type="button"
                    className="btn-icon beat-delete-btn"
                    onClick={() => deletePlotBeat(scene.id, beat.id)}
                    title="Delete beat"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add Beat Inline Form */}
          <form onSubmit={handleAddBeatSubmit} className="add-beat-form">
            <input
              type="text"
              className="form-input add-beat-input"
              placeholder="+ Add a plot beat..."
              value={newBeatText}
              onChange={e => setNewBeatText(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary btn-xs" disabled={!newBeatText.trim()}>
              <Plus size={13} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
