import React, { useState, useRef } from 'react';
import { StoreProvider, useStore } from './store';
import { LeftSidebar } from './components/LeftSidebar';
import { Editor } from './components/Editor';
import { RightSidebar } from './components/RightSidebar';
import { SearchPanel } from './components/SearchPanel';
import { VersionHistory } from './components/VersionHistory';
import { 
  Sparkles, Search, History, Settings, Download, Upload, 
  Menu, X 
} from 'lucide-react';

const WorkspaceShell: React.FC = () => {
  const {
    project,
    isLeftSidebarOpen,
    isRightSidebarOpen,
    toggleLeftSidebar,
    toggleRightSidebar,
    exportProject,
    importProject,
    updateSettings
  } = useStore();

  // Toolbar toggles
  const [showSearch, setShowSearch] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings Form Inputs
  const [apiKey, setApiKey] = useState(project.settings.apiKey);
  const [model, setModel] = useState(project.settings.model);
  const [aiTemp, setAiTemp] = useState(project.settings.aiTemperature);

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

  const handleSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      apiKey,
      model,
      aiTemperature: aiTemp
    });
    setShowSettings(false);
  };

  return (
    <div className="app-container">
      {/* Top Application Header */}
      <header className="app-header">
        <div className="brand-section">
          <Menu 
            size={18} 
            className="btn-icon" 
            onClick={toggleLeftSidebar} 
            style={{ color: isLeftSidebarOpen ? 'var(--accent-purple)' : 'var(--text-muted)' }} 
          />
          <div className="brand-title">NovelSynth</div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 4, marginLeft: 8 }}>
            IDE Mode &bull; {project.projectName}
          </span>
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
            className={`btn-icon ${showSearch ? 'selected' : ''}`} 
            onClick={() => {
              setShowSearch(!showSearch);
              setShowHistory(false);
            }}
            style={{ color: showSearch ? 'var(--accent-purple)' : 'var(--text-muted)' }}
            title="Toggle Search Panel"
          >
            <Search size={16} />
          </button>

          <button 
            className={`btn-icon ${showHistory ? 'selected' : ''}`} 
            onClick={() => {
              setShowHistory(!showHistory);
              setShowSearch(false);
            }}
            style={{ color: showHistory ? 'var(--accent-purple)' : 'var(--text-muted)' }}
            title="Toggle History Snapshots"
          >
            <History size={16} />
          </button>

          <button 
            className={`btn-icon ${showSettings ? 'selected' : ''}`} 
            onClick={() => setShowSettings(true)}
            title="Settings"
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

      {/* Main Panel Body */}
      <main className="app-body">
        {/* Left Navigator Panel */}
        <div className={`sidebar ${isLeftSidebarOpen ? '' : 'collapsed'}`}>
          <LeftSidebar />
        </div>

        {/* Auxiliary panels (Search / History) */}
        {isLeftSidebarOpen && showSearch && (
          <SearchPanel />
        )}
        
        {isLeftSidebarOpen && showHistory && (
          <VersionHistory />
        )}

        {/* Central Writing Canvas */}
        <Editor />

        {/* Right AI Assistant Panel */}
        <div className={`sidebar right-sidebar ${isRightSidebarOpen ? '' : 'collapsed'}`}>
          <RightSidebar />
        </div>
      </main>

      {/* Settings Modal (Glassmorphic) */}
      {showSettings && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          backdropFilter: 'blur(5px)'
        }}>
          <form onSubmit={handleSettingsSave} style={{
            width: '450px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            padding: 24,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-purple)' }}>
                <Settings size={18} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>NovelSynth Settings</span>
              </div>
              <button type="button" className="btn-icon" onClick={() => setShowSettings(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">API Selection</label>
              <select 
                className="form-select" 
                value={model} 
                onChange={e => setModel(e.target.value)}
              >
                <option value="Gemini 3.5 Flash">Gemini 3.5 Flash (Default Simulator)</option>
                <option value="Gemini 3.5 Pro">Gemini 3.5 Pro</option>
                <option value="GPT-4o">GPT-4o</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">API Token / Key</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Enter LLM provider API token..." 
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                Optional. By default, the application runs a local AI simulation framework that matches the Story Bible context.
              </span>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>AI Temperature</label>
                <span style={{ fontSize: 11, color: 'var(--accent-purple)', fontWeight: 600 }}>{aiTemp}</span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="1.0" 
                step="0.05"
                style={{ width: '100%' }}
                value={aiTemp} 
                onChange={e => setAiTemp(parseFloat(e.target.value))}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowSettings(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Settings
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <StoreProvider>
      <WorkspaceShell />
    </StoreProvider>
  )
}

export default App;
