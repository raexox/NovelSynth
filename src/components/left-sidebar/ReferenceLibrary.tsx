import React, { useState } from 'react';
import { useStore } from '../../store';
import { 
  User, MapPin, Users, Sparkles, GitCommit, FileText, Search, Trash2, Plus
} from 'lucide-react';
import { BibleItemEditor } from './BibleItemEditor';
import { PlotThreadsTracker } from './PlotThreadsTracker';
import { ScrapbookNotes } from './ScrapbookNotes';
import { IntelligentSearch } from './IntelligentSearch';

type BibleCategory = 'characters' | 'locations' | 'factions' | 'powerSystems';

export const ReferenceLibrary: React.FC = () => {
  const [pendingDelete, setPendingDelete] = useState<{ category: BibleCategory; id: string; name: string } | null>(null);
  const {
    project,
    activeLeftTab,
    activeBibleCategory,
    activeBibleItemId,
    setLeftTab,
    setBibleCategory,
    setBibleItemId,
    addBibleItem,
    deleteBibleItem
  } = useStore();

  const categories = [
    { id: 'characters', label: 'Characters', icon: User, tab: 'bible' },
    { id: 'locations', label: 'Locations', icon: MapPin, tab: 'bible' },
    { id: 'factions', label: 'Factions', icon: Users, tab: 'bible' },
    { id: 'powerSystems', label: 'Magic', icon: Sparkles, tab: 'bible' },
    { id: 'plots', label: 'Plots', icon: GitCommit, tab: 'plots' },
    { id: 'notes', label: 'Notes', icon: FileText, tab: 'notes' },
    { id: 'search', label: 'Search', icon: Search, tab: 'search' }
  ];

  const activeCategoryLabel = activeBibleCategory === 'powerSystems'
    ? 'Magic Systems'
    : activeBibleCategory.charAt(0).toUpperCase() + activeBibleCategory.slice(1);

  const createBibleItem = () => {
    if (activeBibleCategory === 'characters') {
      addBibleItem('characters', { name: 'New Character', age: '', role: '', appearance: '', personality: '', goals: '', fears: '', keyFacts: '', continuityNotes: '', relationships: '', abilities: '', speechStyle: '', history: '', injuries: '', secrets: '', developmentArc: '' });
    } else if (activeBibleCategory === 'locations') {
      addBibleItem('locations', { name: 'New Location', description: '', culture: '', weather: '', history: '', landmarks: '', connectedLocations: '' });
    } else if (activeBibleCategory === 'factions') {
      addBibleItem('factions', { name: 'New Faction', leader: '', members: '', beliefs: '', allies: '', enemies: '', resources: '' });
    } else {
      addBibleItem('powerSystems', { name: 'New Magic System', rules: '', limitations: '', costs: '', exceptions: '', examples: '' });
    }
  };

  return (
    <div className="reference-library">
      {/* Category pills grid */}
      <div className="reference-category-grid">
        {categories.map(cat => {
          const isActive = (cat.tab === 'bible' && activeLeftTab === 'bible' && activeBibleCategory === cat.id) ||
                           (cat.tab === 'plots' && activeLeftTab === 'plots') ||
                           (cat.tab === 'notes' && activeLeftTab === 'notes') ||
                           (cat.tab === 'search' && activeLeftTab === 'search');
          const Icon = cat.icon;

          return (
            <button
              key={cat.id}
              className={`reference-category-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (cat.tab === 'bible') {
                  setLeftTab('bible');
                  setBibleCategory(cat.id as any);
                } else {
                  setLeftTab(cat.tab);
                }
              }}
            >
              <Icon size={12} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* List & Form Content Container */}
      <div className="reference-library-body">
        
        {/* === BIBLE CATEGORY VIEW === */}
        {activeLeftTab === 'bible' && (
          <div>
            {activeBibleItemId === null ? (
              <div className="reference-list-panel">
                <div className="sidebar-mini-toolbar reference-toolbar">
                  <div>
                    <div className="sidebar-mini-title">{activeCategoryLabel}</div>
                    <div className="sidebar-mini-meta">
                      {project.storyBible[activeBibleCategory].length} item{project.storyBible[activeBibleCategory].length === 1 ? '' : 's'}
                    </div>
                  </div>
                  <button 
                    className="btn btn-primary sidebar-action-button" 
                    onClick={createBibleItem}
                  >
                    <Plus size={13} />
                    Add
                  </button>
                </div>

                <div className="bible-list">
                  {project.storyBible[activeBibleCategory].map((item: any) => (
                    <div 
                      key={item.id} 
                      className="tree-item reference-list-item"
                      onClick={() => setBibleItemId(item.id)}
                    >
                      <span style={{ fontSize: 12 }}>{item.name}</span>
                      <div className="tree-actions tree-actions-visible">
                        <button 
                          className="btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDelete({ category: activeBibleCategory, id: item.id, name: item.name });
                          }}
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {project.storyBible[activeBibleCategory].length === 0 && (
                    <div className="sidebar-empty-state">
                      <User size={18} />
                      <span>No {activeCategoryLabel.toLowerCase()} yet.</span>
                      <button type="button" className="btn btn-primary sidebar-icon-label-btn" onClick={createBibleItem}>
                        <Plus size={13} />
                        Add Item
                      </button>
                    </div>
                  )}
                </div>
                {pendingDelete && (
                  <div className="inline-confirm-panel" role="dialog" aria-modal="false" aria-labelledby="delete-bible-item-title">
                    <div>
                      <strong id="delete-bible-item-title">Delete {pendingDelete.name}?</strong>
                      <span>This removes the item from the Story Bible.</span>
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
                        }}
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <BibleItemEditor />
            )}
          </div>
        )}

        {/* === PLOTS TAB === */}
        {activeLeftTab === 'plots' && <PlotThreadsTracker />}

        {/* === SCRAPBOOK NOTES TAB === */}
        {activeLeftTab === 'notes' && <ScrapbookNotes />}

        {/* === INTELLIGENT SEARCH TAB === */}
        {activeLeftTab === 'search' && <IntelligentSearch />}

      </div>
    </div>
  );
};
