import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { getAIIntelligentQuery } from '../../services/aiService';
import { Search, BookOpen, User, MapPin, GitCommit, ArrowRight, Database, Shield, Sparkles, FileText, Filter, Loader2, Bot, CheckCircle2, RotateCcw } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'scene' | 'character' | 'location' | 'faction' | 'magic' | 'canon' | 'thread' | 'note';
  title: string;
  snippet: string;
  score: number;
  termsMatched: number;
  sceneId?: string;
}

interface AISynthesisResult {
  answer: string;
  keyFindings: string[];
  targetSceneId?: string;
}

type FilterType = 'all' | 'scene' | 'canon' | 'bible' | 'thread';

interface SearchCache {
  searchQuery: string;
  searchResults: SearchResult[];
  searched: boolean;
  activeFilter: FilterType;
  aiResult: AISynthesisResult | null;
}

// In-memory persistent cache across component remounts and tab switches
let memorySearchCache: SearchCache | null = (() => {
  try {
    const stored = sessionStorage.getItem('novelsynth_search_cache');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
})();

const saveSearchCache = (cache: SearchCache) => {
  memorySearchCache = cache;
  try {
    sessionStorage.setItem('novelsynth_search_cache', JSON.stringify(cache));
  } catch {}
};

const clearSearchCache = () => {
  memorySearchCache = null;
  try {
    sessionStorage.removeItem('novelsynth_search_cache');
  } catch {}
};

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'in', 'on', 'at', 'to', 'for', 'from', 'with', 'by', 'about', 'against',
  'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
  'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'does', 'did', 'do',
  'find', 'finds', 'get', 'gets', 'got', 'look', 'looks', 'see', 'sees'
]);

export const IntelligentSearch: React.FC = () => {
  const { project, selectScene, setLeftTab, setBibleCategory, setBibleItemId, closeReferenceModal } = useStore();
  
  // Initialize state from cache if available
  const [searchQuery, setSearchQuery] = useState(() => memorySearchCache?.searchQuery || '');
  const [searchResults, setSearchResults] = useState<SearchResult[]>(() => memorySearchCache?.searchResults || []);
  const [searched, setSearched] = useState(() => memorySearchCache?.searched || false);
  const [activeFilter, setActiveFilter] = useState<FilterType>(() => memorySearchCache?.activeFilter || 'all');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AISynthesisResult | null>(() => memorySearchCache?.aiResult || null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Sync to cache on changes
  useEffect(() => {
    if (searched) {
      saveSearchCache({
        searchQuery,
        searchResults,
        searched,
        activeFilter,
        aiResult
      });
    }
  }, [searchQuery, searchResults, searched, activeFilter, aiResult]);

  const handleReset = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearched(false);
    setAiResult(null);
    setAiError(null);
    clearSearchCache();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      handleReset();
      return;
    }

    const rawQuery = searchQuery.toLowerCase();
    setSearched(true);
    setAiResult(null);
    setAiError(null);

    const tokens = rawQuery
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 1 && !STOP_WORDS.has(t));

    const queryKeywords = tokens.length > 0 ? tokens : [rawQuery.trim()];
    const matches: SearchResult[] = [];

    const evaluateText = (text: string, title: string): { score: number; termsMatched: number; snippet: string } => {
      if (!text) return { score: 0, termsMatched: 0, snippet: '' };
      const lowerText = text.toLowerCase();
      
      let score = 0;
      let firstMatchIdx = -1;
      let uniqueTermsMatched = 0;

      if (lowerText.includes(rawQuery)) {
        score += 300;
        firstMatchIdx = lowerText.indexOf(rawQuery);
      }

      queryKeywords.forEach(kw => {
        const occurrences = (lowerText.match(new RegExp(`\\b${kw}`, 'gi')) || []).length;
        if (occurrences > 0) {
          uniqueTermsMatched++;
          const cappedOccurrences = Math.min(occurrences, 2);
          score += cappedOccurrences * 10;
          if (firstMatchIdx === -1) {
            firstMatchIdx = lowerText.indexOf(kw);
          }
        }
      });

      if (uniqueTermsMatched === 0) return { score: 0, termsMatched: 0, snippet: '' };

      if (queryKeywords.length >= 2 && uniqueTermsMatched < 2 && !lowerText.includes(rawQuery)) {
        return { score: 0, termsMatched: uniqueTermsMatched, snippet: '' };
      }

      score += Math.pow(uniqueTermsMatched, 3) * 40;

      if (title && queryKeywords.some(kw => title.toLowerCase().includes(kw))) {
        score += 20;
      }

      const start = Math.max(0, firstMatchIdx - 40);
      const end = Math.min(text.length, firstMatchIdx + 140);
      let snippet = text.substring(start, end).replace(/\n/g, ' ');
      if (start > 0) snippet = '...' + snippet;
      if (end < text.length) snippet = snippet + '...';

      return { score, termsMatched: uniqueTermsMatched, snippet };
    };

    project.scenes.forEach(sc => {
      const { score, termsMatched, snippet } = evaluateText(sc.title + ' ' + sc.content, sc.title);
      if (score >= 80) {
        matches.push({ id: sc.id, type: 'scene', title: `Scene: ${sc.title}`, snippet: snippet || sc.content.substring(0, 100) + '...', score, termsMatched, sceneId: sc.id });
      }
    });

    project.continuityFacts.forEach(fact => {
      const fullText = `${fact.entityName} ${fact.entityType} ${fact.factType} ${fact.factText} ${fact.status}`;
      const { score, termsMatched, snippet } = evaluateText(fullText, fact.entityName);
      if (score >= 80) {
        matches.push({ id: fact.id, type: 'canon', title: `Canon Fact: ${fact.entityName || fact.entityType} (${fact.status})`, snippet: fact.factText, score: score + 50, termsMatched });
      }
    });

    project.memoryUpdates.forEach(mem => {
      const fullText = `${mem.summary} ${Array.isArray(mem.events) ? mem.events.join(' ') : ''} ${Array.isArray(mem.newFacts) ? mem.newFacts.join(' ') : ''}`;
      const { score, termsMatched, snippet } = evaluateText(fullText, 'Scene Memory');
      if (score >= 80) {
        matches.push({ id: mem.sceneId, type: 'canon', title: `Scene Memory Summary`, snippet: mem.summary || snippet, score: score + 40, termsMatched, sceneId: mem.sceneId });
      }
    });

    project.storyBible.characters.forEach(c => {
      const fullText = `${c.name} ${c.role} ${c.appearance} ${c.personality} ${c.goals} ${c.fears} ${c.history} ${c.secrets} ${c.keyFacts}`;
      const { score, termsMatched, snippet } = evaluateText(fullText, c.name);
      if (score >= 80) {
        matches.push({ id: c.id, type: 'character', title: `Character: ${c.name} ${c.role ? `(${c.role})` : ''}`, snippet: snippet || `Goals: ${c.goals.substring(0, 100)}`, score, termsMatched });
      }
    });

    project.storyBible.locations.forEach(l => {
      const fullText = `${l.name} ${l.description} ${l.culture} ${l.history} ${l.landmarks}`;
      const { score, termsMatched, snippet } = evaluateText(fullText, l.name);
      if (score >= 80) {
        matches.push({ id: l.id, type: 'location', title: `Location: ${l.name}`, snippet: snippet || l.description.substring(0, 100), score, termsMatched });
      }
    });

    project.storyBible.factions.forEach(f => {
      const fullText = `${f.name} ${f.leader} ${f.beliefs} ${f.resources}`;
      const { score, termsMatched, snippet } = evaluateText(fullText, f.name);
      if (score >= 80) {
        matches.push({ id: f.id, type: 'faction', title: `Faction: ${f.name}`, snippet: snippet || `Beliefs: ${f.beliefs}`, score, termsMatched });
      }
    });

    project.storyBible.powerSystems.forEach(m => {
      const fullText = `${m.name} ${m.rules} ${m.limitations} ${m.costs}`;
      const { score, termsMatched, snippet } = evaluateText(fullText, m.name);
      if (score >= 80) {
        matches.push({ id: m.id, type: 'magic', title: `Magic System: ${m.name}`, snippet: snippet || `Rules: ${m.rules}`, score, termsMatched });
      }
    });

    project.plotThreads.forEach(t => {
      const fullText = `${t.title} ${t.description} ${t.notes}`;
      const { score, termsMatched, snippet } = evaluateText(fullText, t.title);
      if (score >= 80) {
        matches.push({ id: t.id, type: 'thread', title: `Plot Thread: ${t.title}`, snippet: snippet || t.description, score, termsMatched });
      }
    });

    matches.sort((a, b) => b.score - a.score);

    const topScore = matches.length > 0 ? matches[0].score : 0;
    const strictMatches = matches.filter(m => m.score >= Math.max(80, topScore * 0.5));

    setSearchResults(strictMatches);
    saveSearchCache({ searchQuery, searchResults: strictMatches, searched: true, activeFilter, aiResult: null });

    // Trigger Genuine LLM Call if API Key configured
    if (project.settings.apiKey && project.settings.apiKey.trim()) {
      setAiLoading(true);
      try {
        const result = await getAIIntelligentQuery(searchQuery, project);
        setAiResult(result);
        saveSearchCache({ searchQuery, searchResults: strictMatches, searched: true, activeFilter, aiResult: result });
      } catch (err: any) {
        setAiError(err.message || 'LLM service error.');
      } finally {
        setAiLoading(false);
      }
    }
  };

  const handleSearchResultClick = (res: SearchResult) => {
    if (res.sceneId) {
      selectScene(res.sceneId);
      if (closeReferenceModal) closeReferenceModal();
    } else if (res.type === 'character' || res.type === 'location' || res.type === 'faction' || res.type === 'magic') {
      setLeftTab('bible');
      const catMap: Record<string, any> = { character: 'characters', location: 'locations', faction: 'factions', magic: 'powerSystems' };
      setBibleCategory(catMap[res.type]);
      setBibleItemId(res.id);
    } else if (res.type === 'canon') {
      setLeftTab('canon');
    } else if (res.type === 'thread') {
      setLeftTab('plots');
    }
  };

  const filteredResults = searchResults.filter(res => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'scene') return res.type === 'scene';
    if (activeFilter === 'canon') return res.type === 'canon';
    if (activeFilter === 'bible') return res.type === 'character' || res.type === 'location' || res.type === 'faction' || res.type === 'magic';
    if (activeFilter === 'thread') return res.type === 'thread' || res.type === 'note';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontWeight: 700, fontSize: 14 }}>
          <Bot size={18} style={{ color: 'var(--accent-purple)' }} />
          <span>LLM INTELLIGENT SEARCH & QUERY</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {searched && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Strict mode: {filteredResults.length} exact matches
            </span>
          )}
          {searched && (
            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              style={{ fontSize: 11, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={handleReset}
              title="Clear search cache and reset"
            >
              <RotateCcw size={11} /> Clear Cache
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="Ask a question or search keywords (e.g. Where does Mara find the ledger?)"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ fontSize: 13, padding: '8px 12px', flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600 }} disabled={aiLoading}>
          {aiLoading ? <Loader2 size={14} className="spin" /> : 'Ask LLM'}
        </button>
      </form>

      {/* LLM Synthesis Banner */}
      {aiLoading && (
        <div style={{ padding: 16, background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(59, 130, 246, 0.1))', border: '1px solid rgba(147, 51, 234, 0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Loader2 size={18} className="spin" style={{ color: 'var(--accent-purple-light)' }} />
          <span style={{ fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 500 }}>
            Asking LLM to analyze manuscript, canon ledger, and world bible...
          </span>
        </div>
      )}

      {aiError && (
        <div style={{ padding: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, fontSize: 12, color: '#fca5a5' }}>
          <strong>LLM Synthesis Notice:</strong> {aiError} (Falling back to strict indexed matches below).
        </div>
      )}

      {aiResult && (
        <div style={{ padding: 16, background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15), rgba(16, 185, 129, 0.1))', border: '1px solid var(--accent-purple)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 4px 14px rgba(147, 51, 234, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13, color: 'var(--accent-purple-light)' }}>
              <Sparkles size={16} />
              <span>AI LLM Synthesis</span>
            </div>
            {aiResult.targetSceneId && (
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                style={{ fontSize: 11, padding: '2px 8px' }}
                onClick={() => {
                  selectScene(aiResult.targetSceneId!);
                  if (closeReferenceModal) closeReferenceModal();
                }}
              >
                Jump to Source Scene <ArrowRight size={11} />
              </button>
            )}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
            {aiResult.answer}
          </p>
          {aiResult.keyFindings.length > 0 && (
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <strong style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: 10 }}>Evidence Snippets:</strong>
              {aiResult.keyFindings.map((finding, fIdx) => (
                <div key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <CheckCircle2 size={13} style={{ color: '#10b981', marginTop: 2, flexShrink: 0 }} />
                  <span>{finding}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      {searched && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 10, marginTop: 6 }}>
          <Filter size={12} style={{ color: 'var(--text-muted)', marginRight: 4 }} />
          {(['all', 'canon', 'scene', 'bible', 'thread'] as FilterType[]).map(f => {
            const labels: Record<FilterType, string> = { all: 'All Exact Matches', canon: 'Canon Facts', scene: 'Scenes', bible: 'World Bible', thread: 'Plot Threads' };
            return (
              <button
                key={f}
                type="button"
                className={`btn btn-sm ${activeFilter === f ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 11, padding: '3px 10px', borderRadius: 14 }}
                onClick={() => setActiveFilter(f)}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
        {searched && filteredResults.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 24, padding: 24, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
            No strict matches found under <strong>{activeFilter}</strong>.
          </div>
        )}

        {filteredResults.map((res, idx) => (
          <div 
            key={idx}
            className="search-card"
            style={{
              padding: 12,
              backgroundColor: 'var(--bg-tertiary, #161f2c)',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}
            onClick={() => handleSearchResultClick(res)}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent-purple)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {res.type === 'scene' && <BookOpen size={13} style={{ color: 'var(--accent-purple)' }} />}
                {res.type === 'character' && <User size={13} style={{ color: 'var(--accent-gold)' }} />}
                {res.type === 'location' && <MapPin size={13} style={{ color: '#3b82f6' }} />}
                {res.type === 'faction' && <Shield size={13} style={{ color: '#10b981' }} />}
                {res.type === 'magic' && <Sparkles size={13} style={{ color: '#f59e0b' }} />}
                {res.type === 'canon' && <Database size={13} style={{ color: '#ec4899' }} />}
                {res.type === 'thread' && <GitCommit size={13} style={{ color: '#8b5cf6' }} />}
                
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{res.title}</span>
              </div>
              <span style={{ fontSize: 10, backgroundColor: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-muted)' }}>
                Relevance: {res.score}
              </span>
            </div>
            
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{res.snippet}</p>

            {res.sceneId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--accent-purple-light, #c084fc)', marginTop: 4, fontWeight: 600 }}>
                Jump to scene <ArrowRight size={11} />
              </div>
            )}
          </div>
        ))}

        {!searched && (
          <div style={{ padding: 16, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Try asking the LLM natural questions or world elements:</div>
            <ul style={{ paddingLeft: 16, margin: 0 }}>
              <li>"Where does Mara find the census ledger?"</li>
              <li>"What is the connection between Elias and Prince Odran?"</li>
              <li>"restricted stacks"</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
