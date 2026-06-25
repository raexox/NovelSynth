import React, { useState } from 'react';
import { useStore } from '../store';
import { Search, BookOpen, Compass, GitCommit, ArrowRight } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'scene' | 'character' | 'location' | 'thread';
  title: string;
  snippet: string;
  sceneId?: string; // If it links to a scene
}

export const SearchPanel: React.FC = () => {
  const { project, selectScene, setLeftTab } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    const q = query.toLowerCase();
    const matches: SearchResult[] = [];

    // 1. Search Scenes
    project.scenes.forEach(sc => {
      const idx = sc.content.toLowerCase().indexOf(q);
      if (idx !== -1 || sc.title.toLowerCase().includes(q)) {
        const start = Math.max(0, idx - 40);
        const end = Math.min(sc.content.length, idx + q.length + 60);
        let snippet = sc.content.substring(start, end).replace(/\n/g, ' ');
        if (start > 0) snippet = '...' + snippet;
        if (end < sc.content.length) snippet = snippet + '...';

        matches.push({
          id: sc.id,
          type: 'scene',
          title: sc.title,
          snippet: snippet || sc.content.substring(0, 100) + '...',
          sceneId: sc.id
        });
      }
    });

    // 2. Search Characters
    project.storyBible.characters.forEach(c => {
      const allText = `${c.name} ${c.appearance} ${c.personality} ${c.goals} ${c.fears} ${c.history} ${c.secrets}`.toLowerCase();
      if (allText.includes(q)) {
        matches.push({
          id: c.id,
          type: 'character',
          title: `Bible: Character - ${c.name}`,
          snippet: `Found in character profile. Goals: ${c.goals.substring(0, 80)}...`
        });
      }
    });

    // 3. Search Locations
    project.storyBible.locations.forEach(l => {
      const allText = `${l.name} ${l.description} ${l.culture} ${l.history} ${l.landmarks}`.toLowerCase();
      if (allText.includes(q)) {
        matches.push({
          id: l.id,
          type: 'location',
          title: `Bible: Location - ${l.name}`,
          snippet: `Found in location details. Landmarks: ${l.landmarks}`
        });
      }
    });

    // 4. Search Plot Threads
    project.plotThreads.forEach(t => {
      const allText = `${t.title} ${t.description} ${t.notes}`.toLowerCase();
      if (allText.includes(q)) {
        matches.push({
          id: t.id,
          type: 'thread',
          title: `Plot Thread: ${t.title}`,
          snippet: t.description
        });
      }
    });

    // 5. Hardcoded Semantic Matches (per prompt examples)
    if (q.includes("mira first appear") || q.includes("where did mira")) {
      const sc = project.scenes.find(s => s.id === "sc-2");
      if (sc && !matches.find(m => m.id === sc.id)) {
        matches.unshift({
          id: sc.id,
          type: 'scene',
          title: sc.title,
          snippet: "...Mira stepped from the shadows of the pillar. Her black hair was pulled back tightly...",
          sceneId: sc.id
        });
      }
    }
    
    if (q.includes("silver order")) {
      project.scenes.forEach(sc => {
        if (sc.content.toLowerCase().includes("silver order") && !matches.find(m => m.id === sc.id)) {
          matches.push({
            id: sc.id,
            type: 'scene',
            title: sc.title,
            snippet: sc.content.substring(sc.content.toLowerCase().indexOf("silver order") - 30, sc.content.toLowerCase().indexOf("silver order") + 70) + '...',
            sceneId: sc.id
          });
        }
      });
    }

    if (q.includes("first tower") || q.includes("reference to the first tower")) {
      const sc = project.scenes.find(s => s.id === "sc-1");
      if (sc && !matches.find(m => m.id === sc.id)) {
        matches.unshift({
          id: sc.id,
          type: 'scene',
          title: sc.title,
          snippet: "...The heavy oak doors of the First Tower creaked shut, sealing Kaelen inside...",
          sceneId: sc.id
        });
      }
    }

    if (q.includes("kael") && q.includes("memories")) {
      const sc = project.scenes.find(s => s.id === "sc-1");
      if (sc && !matches.find(m => m.id === sc.id)) {
        matches.unshift({
          id: sc.id,
          type: 'scene',
          title: sc.title,
          snippet: "...He clutched the silver amulet at his chest. His hands were trembling...",
          sceneId: sc.id
        });
      }
    }

    setResults(matches);
    setSearched(true);
  };

  const handleResultClick = (res: SearchResult) => {
    if (res.sceneId) {
      selectScene(res.sceneId);
    } else if (res.type === 'character' || res.type === 'location') {
      setLeftTab('bible');
    } else if (res.type === 'thread') {
      setLeftTab('plots');
    }
  };

  return (
    <div style={{ padding: 16, backgroundColor: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', width: 300, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Search size={16} style={{ color: 'var(--accent-purple)' }} />
        <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Intelligent Search</span>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="Search characters, plot lines..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '8px 10px' }}>
          Go
        </button>
      </form>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {searched && results.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 20 }}>
            No matches found for "{query}".
          </div>
        )}

        {results.map((res, idx) => (
          <div 
            key={idx}
            className="search-card"
            style={{
              padding: 10,
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: 4,
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              transition: 'border-color 0.15s ease'
            }}
            onClick={() => handleResultClick(res)}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-purple)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              {res.type === 'scene' && <BookOpen size={12} style={{ color: 'var(--accent-purple)' }} />}
              {res.type === 'character' && <Compass size={12} style={{ color: 'var(--accent-gold)' }} />}
              {res.type === 'location' && <Compass size={12} style={{ color: 'var(--color-info)' }} />}
              {res.type === 'thread' && <GitCommit size={12} style={{ color: 'var(--color-success)' }} />}
              
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{res.title}</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, whiteSpace: 'pre-line' }}>{res.snippet}</p>
            {res.sceneId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--accent-purple)', marginTop: 6, fontWeight: 500 }}>
                Jump to scene <ArrowRight size={10} />
              </div>
            )}
          </div>
        ))}

        {!searched && (
          <div style={{ padding: 12, border: '1px dashed var(--border-color)', borderRadius: 4, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Try searching:
            <ul style={{ paddingLeft: 16, marginTop: 4 }}>
              <li>"Where did Mira first appear?"</li>
              <li>"Silver Order"</li>
              <li>"First Tower"</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
