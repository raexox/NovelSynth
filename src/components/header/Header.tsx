import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { 
  Menu, ChevronRight, BookOpen, Layers, Upload, Download, Search, History, Settings, Sparkles 
} from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const {
    project,
    isLeftSidebarOpen,
    isRightSidebarOpen,
    toggleLeftSidebar,
    toggleRightSidebar,
    exportProject,
    importProject,
    closeBook,
    activeLeftTab,
    setLeftTab,
    viewMode,
    setViewMode
  } = useStore();

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      importProject(text);
    };
    reader.readAsText(file);
  };

  const handleBackToDashboard = () => {
    closeBook();
    navigate('/dashboard');
  };

  return (
    <header className="app-header">
      <div className="brand-section">
        <Menu 
          size={18} 
          className="btn-icon" 
          onClick={toggleLeftSidebar} 
          style={{ color: isLeftSidebarOpen ? 'var(--accent-purple)' : 'var(--text-muted)' }} 
        />
        <span 
          className="breadcrumb-dashboard"
          onClick={handleBackToDashboard} 
        >
          Dashboard
        </span>
        <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
        <div className="brand-title">{project.projectName}</div>

        <div style={{ height: 16, width: 1, backgroundColor: 'var(--border-color)', margin: '0 8px' }}></div>

        {/* Workspace Mode Switcher Pills */}
        <div className="view-mode-pill-toggle">
          <button
            type="button"
            className={`view-mode-pill-btn ${viewMode === 'editor' ? 'active' : ''}`}
            onClick={() => setViewMode('editor')}
          >
            <BookOpen size={13} />
            <span>Editor</span>
          </button>
          <button
            type="button"
            className={`view-mode-pill-btn ${viewMode === 'outline' ? 'active' : ''}`}
            onClick={() => setViewMode('outline')}
          >
            <Layers size={13} />
            <span>Outline Studio</span>
          </button>
        </div>
      </div>

      <div className="header-controls">
        {/* Action Tools */}
        <button 
          className="btn btn-secondary" 
          style={{ padding: '6px 10px', fontSize: 12 }} 
          onClick={handleImportClick}
          title="Import Project JSON"
        >
          <Upload size={14} /> Import
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          accept=".json"
        />

        <button 
          className="btn btn-secondary" 
          style={{ padding: '6px 10px', fontSize: 12 }} 
          onClick={exportProject}
          title="Export Project JSON"
        >
          <Download size={14} /> Export
        </button>

        <div style={{ height: 16, width: 1, backgroundColor: 'var(--border-color)' }}></div>

        <button 
          className={`btn-icon ${(activeLeftTab === 'search' && isLeftSidebarOpen) ? 'selected' : ''}`} 
          onClick={() => {
            if (activeLeftTab === 'search' && isLeftSidebarOpen) {
              toggleLeftSidebar();
            } else {
              if (!isLeftSidebarOpen) toggleLeftSidebar();
              setLeftTab('search');
            }
          }}
          style={{ color: (activeLeftTab === 'search' && isLeftSidebarOpen) ? 'var(--accent-purple)' : 'var(--text-muted)' }}
          title="Toggle Search Panel"
        >
          <Search size={16} />
        </button>

        <button 
          className={`btn-icon ${(activeLeftTab === 'history' && isLeftSidebarOpen) ? 'selected' : ''}`} 
          onClick={() => {
            if (activeLeftTab === 'history' && isLeftSidebarOpen) {
              toggleLeftSidebar();
            } else {
              if (!isLeftSidebarOpen) toggleLeftSidebar();
              setLeftTab('history');
            }
          }}
          style={{ color: (activeLeftTab === 'history' && isLeftSidebarOpen) ? 'var(--accent-purple)' : 'var(--text-muted)' }}
          title="Toggle History Snapshots"
        >
          <History size={16} />
        </button>

        <button 
          className="btn-icon" 
          onClick={onOpenSettings}
          title="Book Settings"
        >
          <Settings size={16} />
        </button>

        <div style={{ height: 16, width: 1, backgroundColor: 'var(--border-color)' }}></div>

        <button 
          className="btn-icon" 
          onClick={toggleRightSidebar}
          style={{ color: isRightSidebarOpen ? 'var(--accent-purple)' : 'var(--text-muted)' }}
          title="Toggle AI Editor Pane"
        >
          <Sparkles size={16} />
        </button>
      </div>
    </header>
  );
};
