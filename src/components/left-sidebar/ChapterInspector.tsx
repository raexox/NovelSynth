import React from 'react';
import { useStore } from '../../store';
import { Book, FileText, Hash } from 'lucide-react';

interface ChapterInspectorProps {
  chapterId: string;
}

export const ChapterInspector: React.FC<ChapterInspectorProps> = ({ chapterId }) => {
  const { project, updateChapter } = useStore();
  const chapter = project.chapters.find(c => c.id === chapterId);

  if (!chapter) return null;

  const chScenes = project.scenes.filter(s => s.chapterId === chapterId);
  const totalWords = chScenes.reduce((sum, s) => sum + (s.wordCount || 0), 0);

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" style={{ fontSize: 9.5, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Book size={10} /> Chapter Title
        </label>
        <input 
          type="text" 
          className="form-input" 
          style={{ padding: '4px 8px', fontSize: 11.5 }}
          value={chapter.title} 
          onChange={e => updateChapter(chapter.id, { title: e.target.value })}
          placeholder="Chapter title..."
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: 'var(--bg-primary)', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 8.5, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
            <FileText size={9} /> Scenes
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
            {chScenes.length}
          </div>
        </div>
        <div style={{ background: 'var(--bg-primary)', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 8.5, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
            <Hash size={9} /> Word Count
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
            {totalWords}
          </div>
        </div>
      </div>
    </div>
  );
};
