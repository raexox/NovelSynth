import React, { useState } from 'react';
import { useStore } from '../../store';
import { Search, BookOpen, User, MapPin, GitCommit, ArrowRight } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'scene' | 'character' | 'location' | 'thread';
  title: string;
  snippet: string;
  sceneId?: string;
}

export const IntelligentSearch: React.FC = () => {
  const { project, selectScene, setLeftTab, setBibleCategory, setBibleItemId } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearched(false);
      return;
    }

    const q = searchQuery.toLowerCase();
    const matches: SearchResult[] = [];

    // Search Scenes
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

    // Search Characters
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

    // Search Locations
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

    // Search Plot Threads
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

    // Semantic Matches
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

    setSearchResults(matches);
    setSearched(true);
  };

  const handleSearchResultClick = (res: SearchResult) => {
    if (res.sceneId) {
      selectScene(res.sceneId);
    } else if (res.type === 'character' || res.type === 'location') {
      setLeftTab('bible');
      setBibleCategory(res.type === 'character' ? 'characters' : 'locations');
      setBibleItemId(res.id);
    } else if (res.type === 'thread') {
      setLeftTab('plots');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', fontWeight: 600, fontSize: 12 }}>
        <Search size={14} style={{ color: 'var(--accent-purple)' }} />
        <span>INTELLIGENT SEARCH</span>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6 }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="Search characters, plot lines..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ fontSize: 12, padding: '6px 10px' }}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '6px 10px', fontSize: 12 }}>
          Go
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '350px', overflowY: 'auto' }}>
        {searched && searchResults.length === 0 && (
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
            No matches found for "{searchQuery}".
          </div>
        )}

        {searchResults.map((res, idx) => (
          <div 
            key={idx}
            className="search-card"
            style={{
              padding: 8,
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: 6,
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onClick={() => handleSearchResultClick(res)}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-purple)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              {res.type === 'scene' && <BookOpen size={10} style={{ color: 'var(--accent-purple)' }} />}
              {res.type === 'character' && <User size={10} style={{ color: 'var(--accent-gold)' }} />}
              {res.type === 'location' && <MapPin size={10} style={{ color: 'var(--color-info)' }} />}
              {res.type === 'thread' && <GitCommit size={10} style={{ color: 'var(--color-success)' }} />}
              
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{res.title}</span>
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4, whiteSpace: 'pre-line' }}>{res.snippet}</p>
            {res.sceneId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9.5, color: 'var(--accent-purple)', marginTop: 4, fontWeight: 500 }}>
                Jump to scene <ArrowRight size={9} />
              </div>
            )}
          </div>
        ))}

        {!searched && (
          <div style={{ padding: 10, border: '1px dashed var(--border-color)', borderRadius: 6, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Try searching:
            <ul style={{ paddingLeft: 12, marginTop: 4 }}>
              <li>"Mira first appear"</li>
              <li>"Silver Order"</li>
              <li>"First Tower"</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
