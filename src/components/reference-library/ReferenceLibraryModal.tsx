import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { 
  User, MapPin, Users, Sparkles, BookOpen, GitCommit, FileText, Search, Trash2, Plus, Database, X, ExternalLink, Folder, FolderPlus, ChevronDown, ChevronRight, Edit2, FolderOpen
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
    addFolder,
    updateFolder,
    selectScene
  } = useStore();

  const [pendingDelete, setPendingDelete] = useState<{ category: any; id: string; name: string; isFolder?: boolean } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

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
    { id: 'characters', label: 'Characters', icon: User, tab: 'bible', count: (project.storyBible.characters || []).filter((i: any) => !i.isFolder).length },
    { id: 'locations', label: 'Locations', icon: MapPin, tab: 'bible', count: (project.storyBible.locations || []).filter((i: any) => !i.isFolder).length },
    { id: 'factions', label: 'Factions', icon: Users, tab: 'bible', count: (project.storyBible.factions || []).filter((i: any) => !i.isFolder).length },
    { id: 'lore', label: 'World Lore', icon: BookOpen, tab: 'bible', count: (project.storyBible.lore || []).filter((i: any) => !i.isFolder).length },
    { id: 'powerSystems', label: 'Magic & Power Systems', icon: Sparkles, tab: 'bible', count: (project.storyBible.powerSystems || []).filter((i: any) => !i.isFolder).length },
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

  const createBibleItem = (folderId: string | null = null) => {
    const baseData = { folderId: folderId || null };
    if (activeBibleCategory === 'characters') {
      addBibleItem('characters', { ...baseData, name: 'New Character', age: '', role: '', appearance: '', personality: '', goals: '', fears: '', keyFacts: '', continuityNotes: '', relationships: '', abilities: '', speechStyle: '', history: '', injuries: '', secrets: '', developmentArc: '' });
    } else if (activeBibleCategory === 'locations') {
      addBibleItem('locations', { ...baseData, name: 'New Location', description: '', culture: '', weather: '', history: '', landmarks: '', connectedLocations: '' });
    } else if (activeBibleCategory === 'factions') {
      addBibleItem('factions', { ...baseData, name: 'New Faction', leader: '', members: '', beliefs: '', allies: '', enemies: '', resources: '' });
    } else if (activeBibleCategory === 'lore') {
      addBibleItem('lore', { ...baseData, name: 'New Lore Entry', era: '', description: '', significance: '', history: '' });
    } else {
      addBibleItem('powerSystems', { ...baseData, name: 'New Power System', rules: '', limitations: '', costs: '', exceptions: '', examples: '' });
    }
  };

  const handleCreateFolder = async () => {
    await addFolder(activeBibleCategory, `New Folder`);
  };

  const toggleFolderCollapse = (folderId: string) => {
    setCollapsedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const startEditingFolder = (folder: any) => {
    setEditingFolderId(folder.id);
  };

  const saveFolderRename = async (folderId: string, newName: string) => {
    if (newName.trim()) {
      await updateFolder(activeBibleCategory, folderId, newName.trim());
    }
    setEditingFolderId(null);
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

  const rawList = activeLeftTab === 'bible' ? (project.storyBible[activeBibleCategory] || []) : [];
  const folders = rawList.filter((i: any) => i.isFolder && i.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const allItems = rawList.filter((i: any) => !i.isFolder && i.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const rootItems = allItems.filter((i: any) => !i.folderId);

  const renderItemCard = (item: any) => {
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
              setPendingDelete({ category: activeBibleCategory, id: item.id, name: item.name, isFolder: false });
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
  };

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
                  <div className="ref-items-toolbar" style={{ gap: 6 }}>
                    <div className="ref-search-box" style={{ flex: 1 }}>
                      <Search size={14} />
                      <input 
                        type="text" 
                        placeholder={`Filter ${activeCategoryLabel.toLowerCase()}...`}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleCreateFolder} title="Create Folder" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FolderPlus size={14} /> Folder
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => createBibleItem(null)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Plus size={14} /> Add
                    </button>
                  </div>

                  <div className="ref-items-scroll">
                    {/* Folders List */}
                    {folders.map((folder: any) => {
                      const isCollapsed = collapsedFolders[folder.id] ?? false;
                      const folderChildItems = allItems.filter((i: any) => i.folderId === folder.id);
                      const isEditing = editingFolderId === folder.id;

                      return (
                        <div 
                          key={folder.id} 
                          className="ref-folder-card" 
                          style={{ 
                            marginBottom: 8, 
                            background: 'var(--bg-secondary)', 
                            borderRadius: 6, 
                            border: '1px solid var(--border-color)', 
                            overflow: 'hidden'
                          }}
                        >
                          {/* Folder Header */}
                          <div 
                            style={{ 
                              padding: '6px 10px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              backgroundColor: 'var(--bg-tertiary)',
                              borderBottom: isCollapsed ? 'none' : '1px solid var(--border-color)',
                              userSelect: 'none'
                            }}
                            onClick={() => toggleFolderCollapse(folder.id)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                              {isCollapsed ? <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
                              {isCollapsed ? <Folder size={15} style={{ color: 'var(--accent-purple)' }} /> : <FolderOpen size={15} style={{ color: 'var(--accent-purple)' }} />}
                              
                              {isEditing ? (
                                <input
                                  type="text"
                                  className="form-input"
                                  defaultValue={folder.name}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      saveFolderRename(folder.id, e.currentTarget.value);
                                    }
                                    if (e.key === 'Escape') {
                                      e.preventDefault();
                                      setEditingFolderId(null);
                                    }
                                  }}
                                  onBlur={e => saveFolderRename(folder.id, e.target.value)}
                                  onClick={e => e.stopPropagation()}
                                  onMouseDown={e => e.stopPropagation()}
                                  autoFocus
                                  style={{ padding: '2px 6px', height: 24, fontSize: 12, width: '100%', maxWidth: 200 }}
                                />
                              ) : (
                                <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {folder.name}
                                </span>
                              )}
                              <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-primary)', padding: '1px 5px', borderRadius: 8 }}>
                                {folderChildItems.length}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                className="btn-icon"
                                style={{ padding: 2 }}
                                onClick={() => createBibleItem(folder.id)}
                                title="Add item to this folder"
                              >
                                <Plus size={13} style={{ color: 'var(--accent-purple)' }} />
                              </button>
                              <button
                                type="button"
                                className="btn-icon"
                                style={{ padding: 2 }}
                                onClick={() => startEditingFolder(folder)}
                                title="Rename folder"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                type="button"
                                className="btn-icon danger-hover"
                                style={{ padding: 2 }}
                                onClick={() => setPendingDelete({ category: activeBibleCategory, id: folder.id, name: folder.name, isFolder: true })}
                                title="Delete folder"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Folder Child Items */}
                          {!isCollapsed && (
                            <div style={{ 
                              padding: '8px 8px 8px 12px', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              gap: 6,
                              backgroundColor: 'rgba(0, 0, 0, 0.2)',
                              borderTop: '1px solid var(--border-color)'
                            }}>
                              {folderChildItems.map(item => renderItemCard(item))}
                              {folderChildItems.length === 0 && (
                                <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                                  No items in this folder. Click + to add.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Uncategorized / Root Items */}
                    {folders.length > 0 && rootItems.length > 0 && (
                      <div style={{ padding: '4px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginTop: 8 }}>
                        Uncategorized Items
                      </div>
                    )}
                    {rootItems.map(item => renderItemCard(item))}

                    {folders.length === 0 && allItems.length === 0 && (
                      <div className="ref-empty-state">
                        <User size={24} />
                        <span>No {activeCategoryLabel.toLowerCase()} found.</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={handleCreateFolder}>
                            <FolderPlus size={14} /> New Folder
                          </button>
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => createBibleItem(null)}>
                            <Plus size={14} /> Create {activeCategoryLabel}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {pendingDelete && (
                    <div className="ref-delete-confirm">
                      <span>Delete {pendingDelete.isFolder ? 'folder' : ''} <strong>{pendingDelete.name}</strong>?</span>
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
