import React, { useState, useRef, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { LeftSidebar } from './components/left-sidebar/LeftSidebar';
import { Editor } from './components/Editor';
import { RightSidebar } from './components/right-sidebar/RightSidebar';
import { isSupabaseConfigured } from './services/supabaseClient';
import { 
  Sparkles, Search, History, Settings, Download, Upload, 
  Menu, X, BookOpen, LogOut, Plus, ChevronRight, Lock, Mail, Key, AlertTriangle
} from 'lucide-react';

const AuthGate: React.FC = () => {
  const { signIn, signUp } = useStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const configMissing = !isSupabaseConfigured;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (configMissing) {
      setErrorMsg('Supabase is not configured. Please create a .env file with your credentials.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) throw error;
        alert('Registration successful! You can now sign in.');
        setIsSignUp(false);
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-gate-container">
      <div className="auth-card-backdrop"></div>
      <div className="auth-card">
        <div className="auth-header">
          <Sparkles className="auth-logo-icon" size={32} />
          <h2>NovelSynth</h2>
          <p>Strict Cloud AI Writing Studio</p>
        </div>

        {configMissing ? (
          <div className="auth-error-box" style={{ 
            backgroundColor: 'var(--accent-gold-dim)', 
            border: '1px solid var(--accent-gold)', 
            color: 'var(--accent-gold)', 
            flexDirection: 'column', 
            alignItems: 'flex-start', 
            gap: 12, 
            padding: 16 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
              <AlertTriangle size={16} />
              <span>Configuration Required</span>
            </div>
            <p style={{ fontSize: 11, lineHeight: 1.4, margin: 0, color: 'var(--text-primary)' }}>
              Supabase environment variables are missing. Please create a <code>.env</code> file in your project root and add:
            </p>
            <pre style={{ 
              margin: 0, 
              padding: 8, 
              backgroundColor: 'var(--bg-primary)', 
              borderRadius: 4, 
              width: '100%', 
              fontSize: 10, 
              fontFamily: 'var(--font-mono)', 
              border: '1px solid var(--border-color)', 
              color: 'var(--text-secondary)' 
            }}>
{`VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key`}
            </pre>
          </div>
        ) : (
          <>
            <div className="auth-tabs">
              <button 
                type="button" 
                className={`auth-tab ${!isSignUp ? 'active' : ''}`}
                onClick={() => { setIsSignUp(false); setErrorMsg(null); }}
              >
                Sign In
              </button>
              <button 
                type="button" 
                className={`auth-tab ${isSignUp ? 'active' : ''}`}
                onClick={() => { setIsSignUp(true); setErrorMsg(null); }}
              >
                Sign Up
              </button>
            </div>

            {errorMsg && (
              <div className="auth-error-box">
                <Lock size={14} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-with-icon">
                  <Mail className="input-icon" size={16} />
                  <input 
                    type="email" 
                    required 
                    className="form-input" 
                    placeholder="you@example.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-with-icon">
                  <Key className="input-icon" size={16} />
                  <input 
                    type="password" 
                    required 
                    className="form-input" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary auth-submit-btn">
                {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

const BookDashboard: React.FC = () => {
  const { booksList, createBook, signOut, user, booksLoading } = useStore();
  const [newBookName, setNewBookName] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookName.trim()) return;
    setCreating(true);
    try {
      await createBook(newBookName.trim());
      setNewBookName('');
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="brand-section">
          <Sparkles className="dashboard-logo" size={20} />
          <span className="dashboard-title">NovelSynth</span>
        </div>
        <div className="user-section">
          <span className="user-email">{user?.email}</span>
          <button className="btn btn-secondary logout-btn" onClick={handleLogout}>
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-section-header">
          <h1>Your Bookshelf</h1>
          <p>Select a book project to enter the IDE workspace or start a new writing journey.</p>
        </div>

        {booksLoading ? (
          <div className="dashboard-loader">
            <div className="spinner"></div>
            <p>Syncing your library...</p>
          </div>
        ) : (
          <div className="dashboard-grid">
            {/* Existing Books */}
            {booksList.map(book => (
              <div key={book.id} className="book-card" onClick={() => navigate(`/book/${book.id}`)}>
                <div className="book-card-glow"></div>
                <div className="book-card-header">
                  <BookOpen size={24} className="book-icon" />
                  <h3>{book.name}</h3>
                </div>
                <div className="book-card-stats">
                  <div className="stat-item">
                    <span className="stat-value">{book.wordCount?.toLocaleString() || 0}</span>
                    <span className="stat-label">Words</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{book.chapterCount || 0}</span>
                    <span className="stat-label">Chapters</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{book.sceneCount || 0}</span>
                    <span className="stat-label">Scenes</span>
                  </div>
                </div>
                <button className="btn btn-primary open-book-btn">
                  Open Project <ChevronRight size={14} />
                </button>
              </div>
            ))}

            {/* Create New Book Card */}
            <div className="book-card create-card">
              <div className="book-card-header">
                <Plus size={24} className="create-icon" />
                <h3>New Writing Project</h3>
              </div>
              <form onSubmit={handleCreate} className="create-book-form">
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter book title..." 
                  value={newBookName} 
                  onChange={e => setNewBookName(e.target.value)} 
                  required
                />
                <button type="submit" disabled={creating} className="btn btn-primary create-btn">
                  {creating ? 'Creating...' : 'Create Book'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const WorkspaceShell: React.FC = () => {
  const {
    project,
    isLeftSidebarOpen,
    isRightSidebarOpen,
    toggleLeftSidebar,
    toggleRightSidebar,
    exportProject,
    importProject,
    updateSettings,
    closeBook,
    activeLeftTab,
    setLeftTab
  } = useStore();

  // Toolbar toggles
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings Form Inputs
  const [apiKey, setApiKey] = useState(project.settings.apiKey);
  const [model, setModel] = useState(project.settings.model);
  const [provider, setProvider] = useState(project.settings.provider);
  const [aiTemp, setAiTemp] = useState(project.settings.aiTemperature);

  const navigate = useNavigate();

  // Sync state with store updates
  useEffect(() => {
    setApiKey(project.settings.apiKey);
    setModel(project.settings.model);
    setProvider(project.settings.provider);
    setAiTemp(project.settings.aiTemperature);
  }, [project.settings]);

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
      provider,
      aiTemperature: aiTemp
    });
    setShowSettings(false);
  };

  const handleBackToDashboard = () => {
    closeBook();
    navigate('/dashboard');
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
          <span 
            className="breadcrumb-dashboard"
            onClick={handleBackToDashboard} 
          >
            Dashboard
          </span>
          <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
          <div className="brand-title">{project.projectName}</div>
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
              <label className="form-label">API Provider</label>
              <select 
                className="form-select" 
                value={provider} 
                onChange={e => {
                  const val = e.target.value as 'gemini' | 'openai' | 'openrouter';
                  setProvider(val);
                  if (val === 'gemini') setModel('gemini-1.5-flash');
                  else if (val === 'openai') setModel('gpt-4o-mini');
                  else if (val === 'openrouter') setModel('google/gemini-2.5-flash');
                }}
              >
                <option value="gemini">Gemini API</option>
                <option value="openai">OpenAI API</option>
                <option value="openrouter">OpenRouter API</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Model Identifier</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. gpt-4o-mini, gemini-1.5-flash..." 
                value={model} 
                onChange={e => setModel(e.target.value)}
              />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                OpenAI defaults: <code>gpt-4o</code>, <code>gpt-4o-mini</code>. Gemini: <code>gemini-1.5-flash</code>, <code>gemini-1.5-pro</code>. OpenRouter: <code>google/gemini-2.5-flash</code>.
              </span>
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
                Required. AI scans require a valid API key from your selected provider.
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

const WorkspaceWrapper: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const { activeBookId, loadBook, booksLoading } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (bookId && activeBookId !== bookId) {
      loadBook(bookId);
    }
  }, [bookId, activeBookId]);

  if (booksLoading) {
    return (
      <div className="fullscreen-loading">
        <div className="spinner"></div>
        <p>Syncing book data from the cloud...</p>
      </div>
    );
  }

  if (activeBookId !== bookId) {
    return (
      <div className="fullscreen-loading">
        <AlertTriangle size={24} style={{ color: 'var(--color-danger)' }} />
        <p style={{ color: 'var(--color-danger)' }}>Failed to load book project.</p>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')} style={{ marginTop: 12 }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return <WorkspaceShell />;
};

const NavigationWrapper: React.FC = () => {
  const { user, authLoading } = useStore();

  if (authLoading) {
    return (
      <div className="fullscreen-loading">
        <div className="spinner"></div>
        <p>Verifying session credentials...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/auth" 
          element={user ? <Navigate to="/dashboard" replace /> : <AuthGate />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <BookDashboard /> : <Navigate to="/auth" replace />} 
        />
        <Route 
          path="/book/:bookId" 
          element={user ? <WorkspaceWrapper /> : <Navigate to="/auth" replace />} 
        />
        <Route 
          path="*" 
          element={<Navigate to={user ? "/dashboard" : "/auth"} replace />} 
        />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <StoreProvider>
      <NavigationWrapper />
    </StoreProvider>
  )
}

export default App;
