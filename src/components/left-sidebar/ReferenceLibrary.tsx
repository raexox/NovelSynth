import React from 'react';
import { useStore } from '../../store';
import { 
  User, MapPin, Users, Sparkles, GitCommit, FileText, Search, Trash2
} from 'lucide-react';
import { BibleItemEditor } from './BibleItemEditor';
import { PlotThreadsTracker } from './PlotThreadsTracker';
import { ScrapbookNotes } from './ScrapbookNotes';
import { IntelligentSearch } from './IntelligentSearch';

export const ReferenceLibrary: React.FC = () => {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Category pills grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
        {[
          { id: 'characters', label: 'Characters', icon: User, tab: 'bible' },
          { id: 'locations', label: 'Locations', icon: MapPin, tab: 'bible' },
          { id: 'factions', label: 'Factions', icon: Users, tab: 'bible' },
          { id: 'powerSystems', label: 'Magic', icon: Sparkles, tab: 'bible' },
          { id: 'plots', label: 'Plots', icon: GitCommit, tab: 'plots' },
          { id: 'notes', label: 'Notes', icon: FileText, tab: 'notes' },
          { id: 'search', label: 'Search', icon: Search, tab: 'search' }
        ].map(cat => {
          const isActive = (cat.tab === 'bible' && activeLeftTab === 'bible' && activeBibleCategory === cat.id) ||
                           (cat.tab === 'plots' && activeLeftTab === 'plots') ||
                           (cat.tab === 'notes' && activeLeftTab === 'notes') ||
                           (cat.tab === 'search' && activeLeftTab === 'search');
          const Icon = cat.icon;

          return (
            <button
              key={cat.id}
              className="btn"
              style={{
                fontSize: '10px',
                padding: '4px 8px',
                borderRadius: 6,
                backgroundColor: isActive ? 'var(--accent-purple-dim)' : 'var(--bg-tertiary)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: isActive ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
              onClick={() => {
                if (cat.tab === 'bible') {
                  setLeftTab('bible');
                  setBibleCategory(cat.id as any);
                } else {
                  setLeftTab(cat.tab);
                }
              }}
            >
              <Icon size={11} style={{ color: isActive ? 'var(--accent-purple)' : 'inherit' }} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* List & Form Content Container */}
      <div style={{ flex: 1 }}>
        
        {/* === BIBLE CATEGORY VIEW === */}
        {activeLeftTab === 'bible' && (
          <div>
            {activeBibleItemId === null ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {activeBibleCategory === 'powerSystems' ? 'Magic Systems' : activeBibleCategory.charAt(0).toUpperCase() + activeBibleCategory.slice(1)} ({project.storyBible[activeBibleCategory].length})
                  </span>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '2px 6px', fontSize: 10.5 }}
                    onClick={() => {
                      if (activeBibleCategory === 'characters') {
                        addBibleItem('characters', { name: 'New Character', appearance: '', personality: '', goals: '', fears: '', relationships: '', abilities: '', speechStyle: '', history: '', injuries: '', secrets: '', developmentArc: '' });
                      } else if (activeBibleCategory === 'locations') {
                        addBibleItem('locations', { name: 'New Location', description: '', culture: '', weather: '', history: '', landmarks: '', connectedLocations: '' });
                      } else if (activeBibleCategory === 'factions') {
                        addBibleItem('factions', { name: 'New Faction', leader: '', members: '', beliefs: '', allies: '', enemies: '', resources: '' });
                      } else {
                        addBibleItem('powerSystems', { name: 'New Magic System', rules: '', limitations: '', costs: '', exceptions: '', examples: '' });
                      }
                    }}
                  >
                    + Add
                  </button>
                </div>

                <div className="bible-list" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {project.storyBible[activeBibleCategory].map((item: any) => (
                    <div 
                      key={item.id} 
                      className="tree-item"
                      onClick={() => setBibleItemId(item.id)}
                      style={{ padding: '6px 8px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
                    >
                      <span style={{ fontSize: 12 }}>{item.name}</span>
                      <div className="tree-actions">
                        <button 
                          className="btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete ${item.name}?`)) deleteBibleItem(activeBibleCategory, item.id);
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {project.storyBible[activeBibleCategory].length === 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                      Empty category. Click "+ Add" to create.
                    </div>
                  )}
                </div>
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
