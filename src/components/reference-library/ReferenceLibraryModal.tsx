import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { 
  User, MapPin, Users, Sparkles, BookOpen, GitCommit, FileText, Search, Trash2, Plus, Database, X, ExternalLink
} from 'lucide-react';
import { BibleItemEditor } from '../left-sidebar/BibleItemEditor';
import { CanonLedger } from '../left-sidebar/CanonLedger';
import { PlotThreadsTracker } from '../left-sidebar/PlotThreadsTracker';
import { ScrapbookNotes } from '../left-sidebar/ScrapbookNotes';
import { IntelligentSearch } from '../left-sidebar/IntelligentSearch';

export const ReferenceLibraryModal: React.FC = () => {
  const {
    project,
    activeLeftTab,
    activeBibleCategory,
    activeBibleItemId,
    isReferenceModalOpen,
    closeReferenceModal,
    setLeftTab,
    setBibleCategory,
    setBibleItemId,
    addBibleItem,
    deleteBibleItem,
    selectScene
  } = useStore();

  const [pendingDelete, setPendingDelete] = useState<{ category: any; id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isReferenceModalOpen) {
        closeReferenceModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReferenceModalOpen, closeReferenceModal]);

  if (!isReferenceModalOpen) return null;

  const categories = [
    { id: 'characters', label: 'Characters', icon: User, tab: 'bible', count: (project.storyBible.characters || []).length },
    { id: 'locations', label: 'Locations', icon: MapPin, tab: 'bible', count: (project.storyBible.locations || []).length },
    { id: 'factions', label: 'Factions', icon: Users, tab: 'bible', count: (project.storyBible.factions || []).length },
    { id: 'lore', label: 'World Lore', icon: BookOpen, tab: 'bible', count: (project.storyBible.lore || []).length },
    { id: 'powerSystems', label: 'Magic & Power Systems', icon: Sparkles, tab: 'bible', count: (project.storyBible.powerSystems || []).length },
    { id: 'canon', label: 'Canon Ledger', icon: Database, tab: 'canon', count: project.continuityFacts.length },
    { id: 'plots', label: 'Plot Threads', icon: GitCommit, tab: 'plots', count: project.plotThreads.length },
    { id: 'notes', label: 'Scrapbook Notes', icon: FileText, tab: 'notes', count: project.notes.length },
    { id: 'search', label: 'AI Search', icon: Search, tab: 'search', count: null }
  ];

  const activeCategoryLabel = activeBibleCategory === 'lore'
    ? 'World Lore'
    : activeBibleCategory === 'powerSystems'
    ? 'Magic & Power Systems'
    : activeBibleCategory.charAt(0).toUpperCase() + activeBibleCategory.slice(1);

  const createBibleItem = () => {
    if (activeBibleCategory === 'characters') {
      addBibleItem('characters', { name: 'New Character', age: '', role: '', appearance: '', personality: '', goals: '', fears: '', keyFacts: '', continuityNotes: '', relationships: '', abilities: '', speechStyle: '', history: '', injuries: '', secrets: '', developmentArc: '' });
    } else if (activeBibleCategory === 'locations') {
      addBibleItem('locations', { name: 'New Location', description: '', culture: '', weather: '', history: '', landmarks: '', connectedLocations: '' });
    } else if (activeBibleCategory === 'factions') {
      addBibleItem('factions', { name: 'New Faction', leader: '', members: '', beliefs: '', allies: '', enemies: '', resources: '' });
    } else if (activeBibleCategory === 'lore') {
      addBibleItem('lore', { name: 'New Lore Entry', era: '', description: '', significance: '', history: '' });
    } else {
      addBibleItem('powerSystems', { name: 'New Power System', rules: '', limitations: '', costs: '', exceptions: '', examples: '' });
    }
  };

  // Currently selected entity for relational inspector
  const activeEntity = activeLeftTab === 'bible' && activeBibleItemId 
    ? (project.storyBible[activeBibleCategory] || []).find((i: any) => i.id === activeBibleItemId)
    : null;

  const connectedFacts = activeEntity 
    ? project.continuityFacts.filter(f => f.entityId === activeEntity.id || f.entityName.toLowerCase() === activeEntity.name.toLowerCase())
    : [];

  const connectedScenes = activeEntity
    ? project.scenes.filter(s => s.metadata?.characters?.includes(activeEntity.name) || s.metadata?.location === activeEntity.name)
    : [];

  const itemsList = activeLeftTab === 'bible' 
    ? (project.storyBible[activeBibleCategory] || []).filter((item: any) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="ref-modal-overlay" onClick={closeReferenceModal}>
      <div className="ref-modal-container" onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="ref-modal-header">
          <div className="ref-modal-title">
            <Database className="accent-icon" size={20} />
            <div>
              <h3>Worldbuilding & Continuity Engine</h3>
              <span>{project.projectName} World Bible</span>
            </div>
          </div>

          <div className="ref-modal-actions">
            <button type="button" className="btn-icon" onClick={closeReferenceModal} title="Close (Esc)">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="ref-modal-body">
          
          {/* Left Sidebar Category Selector */}
          <div className="ref-modal-nav">
            <div className="ref-nav-group-title">World Bible</div>
            {categories.map(cat => {
              const isActive = (cat.tab === 'bible' && activeLeftTab === 'bible' && activeBibleCategory === cat.id) ||
                               (cat.tab === 'plots' && activeLeftTab === 'plots') ||
                               (cat.tab === 'notes' && activeLeftTab === 'notes') ||
                               (cat.tab === 'canon' && activeLeftTab === 'canon') ||
                               (cat.tab === 'search' && activeLeftTab === 'search');
              const Icon = cat.icon;

              return (
                <button
                  key={cat.id}
                  className={`ref-nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (cat.tab === 'bible') {
                      setLeftTab('bible');
                      setBibleCategory(cat.id as any);
                    } else {
                      setLeftTab(cat.tab);
                    }
                  }}
                >
                  <div className="ref-nav-btn-label">
                    <Icon size={15} />
                    <span>{cat.label}</span>
                  </div>
                  {cat.count !== null && <span className="ref-nav-count">{cat.count}</span>}
                </button>
              );
            })}
          </div>

          {/* Center Content Workspace */}
          <div className="ref-modal-main">
            {activeLeftTab === 'bible' ? (
              <div className="ref-bible-split-workspace">
                {/* Master Items List */}
                <div className="ref-items-column">
                  <div className="ref-items-toolbar">
                    <div className="ref-search-box">
                      <Search size={14} />
                      <input 
                        type="text" 
                        placeholder={`Filter ${activeCategoryLabel.toLowerCase()}...`}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button type="button" className="btn btn-primary btn-sm" onClick={createBibleItem}>
                      <Plus size={14} /> Add
                    </button>
                  </div>

                  <div className="ref-items-scroll">
                    {itemsList.map((item: any) => {
                      const isItemSelected = item.id === activeBibleItemId;
                      return (
                        <div 
                          key={item.id} 
                          className={`ref-item-card ${isItemSelected ? 'active' : ''}`}
                          onClick={() => setBibleItemId(item.id)}
                        >
                          <div className="ref-item-card-header">
                            <span className="ref-item-name">{item.name}</span>
                            <button 
                              type="button"
                              className="btn-icon danger-hover"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingDelete({ category: activeBibleCategory, id: item.id, name: item.name });
                              }}
                              title="Delete Item"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          {item.role && <span className="ref-item-tag">{item.role}</span>}
                          {item.culture && <span className="ref-item-tag">{item.culture}</span>}
                        </div>
                      );
                    })}
                    {itemsList.length === 0 && (
                      <div className="ref-empty-state">
                        <User size={24} />
                        <span>No {activeCategoryLabel.toLowerCase()} found.</span>
                        <button type="button" className="btn btn-primary btn-sm" onClick={createBibleItem}>
                          <Plus size={14} /> Create {activeCategoryLabel}
                        </button>
                      </div>
                    )}
                  </div>

                  {pendingDelete && (
                    <div className="ref-delete-confirm">
                      <span>Delete <strong>{pendingDelete.name}</strong>?</span>
                      <div className="ref-delete-actions">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPendingDelete(null)}>Cancel</button>
                        <button 
                          type="button" 
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            deleteBibleItem(pendingDelete.category, pendingDelete.id);
                            setPendingDelete(null);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Detail Form Editor Panel */}
                <div className="ref-editor-column">
                  {activeBibleItemId ? (
                    <BibleItemEditor />
                  ) : (
                    <div className="ref-editor-placeholder">
                      <Database size={36} />
                      <h4>Select an item to edit details</h4>
                      <p>Choose any character, location, faction, or power system from the list to update its rich dossier and continuity rules.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="ref-standalone-workspace">
                {activeLeftTab === 'canon' && <CanonLedger />}
                {activeLeftTab === 'plots' && <PlotThreadsTracker />}
                {activeLeftTab === 'notes' && <ScrapbookNotes />}
                {activeLeftTab === 'search' && <IntelligentSearch />}
              </div>
            )}
          </div>

          {/* Right Relational Cross-Inspector */}
          {activeLeftTab === 'bible' && activeEntity && (
            <div className="ref-modal-inspector">
              <div className="ref-inspector-title">
                <span>Relational Links</span>
              </div>

              <div className="ref-inspector-section">
                <div className="ref-section-label">📜 Linked Canon Facts ({connectedFacts.length})</div>
                {connectedFacts.length > 0 ? (
                  <div className="ref-facts-mini-list">
                    {connectedFacts.map(fact => (
                      <div key={fact.id} className={`ref-fact-pill ${fact.status}`}>
                        <div className="ref-fact-status">{fact.status}</div>
                        <div className="ref-fact-text">{fact.factText}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="ref-text-muted">No explicit canon facts logged for this entity yet.</span>
                )}
              </div>

              <div className="ref-inspector-section">
                <div className="ref-section-label">📖 Manuscript Scenes ({connectedScenes.length})</div>
                {connectedScenes.length > 0 ? (
                  <div className="ref-scenes-mini-list">
                    {connectedScenes.map(scene => (
                      <div 
                        key={scene.id} 
                        className="ref-scene-link-card"
                        onClick={() => {
                          selectScene(scene.id);
                          closeReferenceModal();
                        }}
                      >
                        <span className="ref-scene-title">{scene.title}</span>
                        <ExternalLink size={12} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="ref-text-muted">Entity not explicitly tagged in active manuscript scene metadata.</span>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
