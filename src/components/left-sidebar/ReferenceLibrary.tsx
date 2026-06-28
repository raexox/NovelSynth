import React, { useState } from 'react';
import { useStore } from '../../store';
import { 
  User, MapPin, Users, Sparkles, Wand2, Zap, GitCommit, FileText, Search, Trash2, Plus, Database, Maximize2, ChevronDown, ChevronRight, Filter, Globe, BookOpen, Scroll
} from 'lucide-react';
import { BibleItemEditor } from './BibleItemEditor';
import { PlotThreadsTracker } from './PlotThreadsTracker';
import { ScrapbookNotes } from './ScrapbookNotes';
import { IntelligentSearch } from './IntelligentSearch';
import { CanonLedger } from './CanonLedger';

type BibleCategory = 'characters' | 'locations' | 'factions' | 'lore' | 'powerSystems';

export const ReferenceLibrary: React.FC = () => {
  const [pendingDelete, setPendingDelete] = useState<{ category: BibleCategory; id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Accordion collapsed states (default expanded)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    characters: true,
    locations: true,
    factions: true,
    lore: true,
    powerSystems: true
  });

  const {
    project,
    activeLeftTab,
    activeBibleCategory,
    activeBibleItemId,
    isReferenceModalOpen,
    setLeftTab,
    setBibleCategory,
    setBibleItemId,
    addBibleItem,
    deleteBibleItem,
    openReferenceModal
  } = useStore();

  const toggleSection = (cat: string) => {
    setExpandedSections(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const createBibleItem = (category: BibleCategory) => {
    setBibleCategory(category);
    if (category === 'characters') {
      addBibleItem('characters', { name: 'New Character', age: '', role: '', appearance: '', personality: '', goals: '', fears: '', keyFacts: '', continuityNotes: '', relationships: '', abilities: '', speechStyle: '', history: '', injuries: '', secrets: '', developmentArc: '' });
    } else if (category === 'locations') {
      addBibleItem('locations', { name: 'New Location', description: '', culture: '', weather: '', history: '', landmarks: '', connectedLocations: '' });
    } else if (category === 'factions') {
      addBibleItem('factions', { name: 'New Faction', leader: '', members: '', beliefs: '', allies: '', enemies: '', resources: '' });
    } else if (category === 'lore') {
      addBibleItem('lore', { name: 'New Lore Entry', era: '', description: '', significance: '', history: '' });
    } else {
      addBibleItem('powerSystems', { name: 'New Power System', rules: '', limitations: '', costs: '', exceptions: '', examples: '' });
    }
  };

  const getItemSnippet = (item: any, cat: BibleCategory) => {
    if (cat === 'characters') {
      const parts = [];
      if (item.role) parts.push(`Role: ${item.role}`);
      if (item.personality) parts.push(`Personality: ${item.personality}`);
      if (item.appearance) parts.push(`Appearance: ${item.appearance}`);
      if (parts.length === 0 && item.keyFacts) parts.push(item.keyFacts);
      return parts.join(' • ') || 'No details added yet.';
    }
    if (cat === 'locations') {
      return item.description || item.culture || 'No description added yet.';
    }
    if (cat === 'factions') {
      return item.leader ? `Leader: ${item.leader}` : (item.beliefs || 'No details added yet.');
    }
    if (cat === 'lore') {
      return item.era ? `Era: ${item.era}` : (item.description || item.history || 'No history recorded yet.');
    }
    return item.rules || item.limitations || 'No rules defined yet.';
  };

  const bCategories: Array<{ id: BibleCategory; label: string; icon: any }> = [
    { id: 'characters', label: 'Characters', icon: User },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'factions', label: 'Factions', icon: Users },
    { id: 'lore', label: 'World Lore', icon: BookOpen },
    { id: 'powerSystems', label: 'Magic & Power Systems', icon: Sparkles }
  ];

  return (
    <div className="reference-library" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Main Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', padding: '4px 6px', gap: 4 }}>
        <button
          type="button"
          className={`btn ${activeLeftTab === 'bible' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '4px 8px', fontSize: 11.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
          onClick={() => { setLeftTab('bible'); setBibleItemId(null); }}
        >
          <BookOpen size={13} />
          <span>Codex</span>
        </button>
        <button
          type="button"
          className={`btn ${activeLeftTab === 'notes' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '4px 8px', fontSize: 11.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
          onClick={() => setLeftTab('notes')}
        >
          <FileText size={13} />
          <span>Notes</span>
        </button>
        <button
          type="button"
          className={`btn ${activeLeftTab === 'canon' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '4px 8px', fontSize: 11.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
          onClick={() => setLeftTab('canon')}
        >
          <Database size={13} />
          <span>Canon</span>
        </button>
      </div>

      {/* Full Workspace Command Center Banner */}
      <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-color)' }}>
        <button 
          type="button" 
          className="ref-expand-banner-btn"
          onClick={() => openReferenceModal()}
          style={{ width: '100%', margin: 0 }}
          title="Open spacious full-screen Worldbuilding Command Center"
        >
          <Maximize2 size={12} />
          <span>Expand Command Center</span>
        </button>
      </div>

      {/* Main Content Container */}
      <div className="reference-library-body" style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        
        {/* === BIBLE / CODEX VIEW (Menu ALWAYS stays visible) === */}
        {activeLeftTab === 'bible' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Search Bar matching Screenshot 1 */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={13} style={{ position: 'absolute', left: 8, top: 8, color: 'var(--text-muted)' }} />
                <input 
                  type="text"
                  className="form-input"
                  placeholder="Search all entries..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: 26, fontSize: 11.5, height: 28 }}
                />
              </div>
              <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', height: 28 }} title="Filter">
                <Filter size={13} />
              </button>
            </div>

            {/* Collapsible Accordion Sections */}
            {bCategories.map(catObj => {
              const items = (project.storyBible[catObj.id] || []).filter((item: any) => 
                !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || getItemSnippet(item, catObj.id).toLowerCase().includes(searchQuery.toLowerCase())
              );
              const isExpanded = expandedSections[catObj.id] ?? true;
              const IconComp = catObj.icon;

              return (
                <div key={catObj.id} className="sidebar-section-card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 6, overflow: 'hidden' }}>
                  {/* Accordion Header */}
                  <div 
                    className="sidebar-section-card-header"
                    style={{ padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: 'var(--bg-secondary)', borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none' }}
                    onClick={() => toggleSection(catObj.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span>{catObj.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {items.length} {items.length === 1 ? 'entry' : 'entries'}
                      </span>
                      <button 
                        type="button"
                        className="btn-icon"
                        style={{ padding: 2 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          createBibleItem(catObj.id);
                        }}
                        title={`Add new ${catObj.label.slice(0, -1)}`}
                      >
                        <Plus size={13} style={{ color: 'var(--accent-purple)' }} />
                      </button>
                    </div>
                  </div>

                  {/* Accordion List Items matching Screenshot 1 */}
                  {isExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {items.map((item: any) => {
                        const isSelected = activeBibleItemId === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              setBibleCategory(catObj.id);
                              setBibleItemId(item.id);
                            }}
                            style={{
                              padding: '8px 10px',
                              borderBottom: '1px solid var(--border-color)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              transition: 'background-color 0.15s ease',
                              backgroundColor: isSelected ? 'var(--accent-purple-dim)' : 'transparent',
                              borderLeft: isSelected ? '3px solid var(--accent-purple)' : 'none'
                            }}
                            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
                            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            {/* Left Round Avatar Icon / Custom Image with 100% precision centering */}
                            <div style={{ 
                              width: 32, 
                              height: 32, 
                              borderRadius: '50%', 
                              backgroundColor: 'var(--bg-primary)', 
                              border: '1px solid var(--border-color)',
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              flexShrink: 0,
                              color: 'var(--accent-purple)',
                              overflow: 'hidden',
                              boxSizing: 'border-box',
                              lineHeight: 0,
                              fontSize: 0,
                              padding: 0
                            }}>
                              {item.avatarUrl ? (
                                <img src={item.avatarUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', lineHeight: 0 }}>
                                  <IconComp size={15} style={{ display: 'block', margin: '0 auto', verticalAlign: 'middle' }} />
                                </span>
                              )}
                            </div>

                            {/* Center Content */}
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {item.name}
                                </span>
                                <button
                                  type="button"
                                  className="btn-icon"
                                  style={{ padding: 1, opacity: 0.6 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPendingDelete({ category: catObj.id, id: item.id, name: item.name });
                                  }}
                                  title="Delete"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                              <div style={{ 
                                fontSize: 10.5, 
                                color: 'var(--text-secondary)', 
                                lineHeight: 1.3,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                wordBreak: 'break-word'
                              }}>
                                {getItemSnippet(item, catObj.id)}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {items.length === 0 && (
                        <div style={{ padding: 12, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
                          No {catObj.label.toLowerCase()} found.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* === CANON TAB === */}
        {activeLeftTab === 'canon' && <CanonLedger />}

        {/* === SCRAPBOOK NOTES TAB === */}
        {activeLeftTab === 'notes' && <ScrapbookNotes />}

        {/* inline delete confirmation modal */}
        {pendingDelete && (
          <div className="inline-confirm-panel" role="dialog" aria-modal="false" style={{ margin: '10px 0' }}>
            <div>
              <strong>Delete {pendingDelete.name}?</strong>
              <span>This removes the entry from the Codex.</span>
            </div>
            <div className="inline-confirm-actions">
              <button type="button" className="btn btn-secondary sidebar-icon-label-btn" onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger sidebar-icon-label-btn"
                onClick={() => {
                  deleteBibleItem(pendingDelete.category, pendingDelete.id);
                  setPendingDelete(null);
                  if (activeBibleItemId === pendingDelete.id) setBibleItemId(null);
                }}
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FIXED POSITION POP-OUT DETAIL INSPECTOR PANEL (Pops out to the right of the left sidebar without being clipped!) */}
      {!isReferenceModalOpen && activeLeftTab === 'bible' && activeBibleItemId !== null && (
        <div 
          style={{
            position: 'fixed',
            left: 'var(--sidebar-width, 300px)',
            top: 48,
            bottom: 12,
            width: 360,
            backgroundColor: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-color)',
            borderLeft: '1px solid var(--border-color)',
            boxShadow: '10px 0 30px rgba(0, 0, 0, 0.6)',
            zIndex: 99999,
            overflowY: 'auto',
            padding: 12,
            borderRadius: '0 8px 8px 0'
          }}
        >
          <BibleItemEditor />
        </div>
      )}
    </div>
  );
};
