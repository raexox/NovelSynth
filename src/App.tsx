import React, { useState, useRef, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { LeftSidebar } from './components/left-sidebar/LeftSidebar';
import { Editor } from './components/Editor';
import { RightSidebar } from './components/right-sidebar/RightSidebar';
import { ToastHost } from './components/ToastHost';
import { isSupabaseConfigured } from './services/supabaseClient';
import { notify } from './services/notifications';
import { 
  Sparkles, Search, History, Settings, Download, Upload, 
  Menu, X, BookOpen, LogOut, Plus, ChevronRight, Lock, Mail, Key, AlertTriangle
} from 'lucide-react';
import { DEFAULT_THEME, THEME_OPTIONS, type ThemeId, isThemeId } from './theme/themes';

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
        notify({
          tone: 'success',
          title: 'Account created',
          message: 'You can now sign in.'
        });
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
  const { booksList, createBook, signOut, user, booksLoading, updateUserSettings } = useStore();
  const [newBookName, setNewBookName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const navigate = useNavigate();

  const userSettings = user?.user_metadata?.novelsynth_settings || {};
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-1.5-flash');
  const [provider, setProvider] = useState('gemini');
  const [aiTemp, setAiTemp] = useState(0.7);
  const [accountTheme, setAccountTheme] = useState<ThemeId>(
    isThemeId(userSettings.theme) ? userSettings.theme : DEFAULT_THEME
  );

  useEffect(() => {
    if (userSettings) {
      setApiKey(userSettings.apiKey || '');
      setModel(userSettings.model || 'gemini-1.5-flash');
      setProvider(userSettings.provider || 'gemini');
      setAiTemp(userSettings.aiTemperature || 0.7);
      setAccountTheme(isThemeId(userSettings.theme) ? userSettings.theme : DEFAULT_THEME);
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.dataset.theme = accountTheme;
  }, [accountTheme]);

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

  const handleAccountSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserSettings({
      apiKey: apiKey.trim(),
      model: model.trim(),
      provider,
      aiTemperature: aiTemp,
      theme: accountTheme
    });
    setShowAccountSettings(false);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="brand-section">
          <Sparkles className="dashboard-logo" size={20} />
          <span className="dashboard-title">NovelSynth</span>
        </div>
        <div className="user-section" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div 
            onClick={() => setShowAccountSettings(true)}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-purple), hsla(265, 80%, 65%, 0.6))',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              border: '2px solid var(--border-color)',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              userSelect: 'none'
            }}
            title="Account & AI Settings"
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1.0)'}
          >
            {user?.email ? user.email[0].toUpperCase() : 'U'}
          </div>
          <button className="btn btn-secondary logout-btn" onClick={handleLogout} style={{ padding: '6px 10px', fontSize: 11.5 }}>
            <LogOut size={13} /> Log Out
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

      {/* Account & AI Settings Modal */}
      {showAccountSettings && (
        <div className="settings-overlay">
          <form onSubmit={handleAccountSave} className="settings-modal settings-modal-wide">
            <div className="settings-modal-header">
              <div className="settings-modal-title">
                <Settings size={18} />
                <div>
                  <span>Account Settings</span>
                  <p>AI provider, model defaults, and workspace appearance.</p>
                </div>
              </div>
              <button type="button" className="btn-icon" onClick={() => setShowAccountSettings(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="settings-modal-body">
              <section className="settings-section">
                <div className="settings-section-heading">
                  <h3>Profile</h3>
                </div>
                <div className="settings-info-row">
                  <strong>Signed in as</strong>
                  <span>{user?.email}</span>
                </div>
              </section>

              <section className="settings-section">
                <div className="settings-section-heading">
                  <h3>Workspace Theme</h3>
                </div>
                <div className="theme-grid">
                  {THEME_OPTIONS.map(theme => (
                    <button
                      key={theme.id}
                      type="button"
                      className={`theme-choice ${accountTheme === theme.id ? 'active' : ''}`}
                      onClick={() => setAccountTheme(theme.id)}
                    >
                      <span className="theme-choice-swatch-row">
                        {theme.swatches.map(color => (
                          <span
                            key={color}
                            className="theme-choice-swatch"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </span>
                      <span className="theme-choice-name">{theme.name}</span>
                      <span className="theme-choice-description">{theme.description}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="settings-section">
                <div className="settings-section-heading">
                  <h3>AI Defaults</h3>
                </div>

                <div className="settings-form-grid">
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
                    <label className="form-label">AI Temperature</label>
                    <div className="range-control">
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={aiTemp}
                        onChange={e => setAiTemp(parseFloat(e.target.value))}
                      />
                      <span>{aiTemp}</span>
                    </div>
                  </div>
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
                  <span className="form-help">
                    OpenAI: <code>gpt-4o</code>, <code>gpt-4o-mini</code>. Gemini: <code>gemini-1.5-flash</code>, <code>gemini-1.5-pro</code>. OpenRouter: <code>google/gemini-2.5-flash</code>.
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
                  <span className="form-help">Required for AI scans and generation.</span>
                </div>
              </section>
            </div>

            <div className="settings-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAccountSettings(false)}>
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

const WorkspaceShell: React.FC = () => {
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
    updateBookDetails
  } = useStore();

  // Toolbar toggles
  const [showSettings, setShowSettings] = useState(false);
  
  // Book Settings Form Inputs
  const [bookTitle, setBookTitle] = useState(project.projectName);
  const [bookGenre, setBookGenre] = useState(project.settings.genre || '');
  const [bookTargetWords, setBookTargetWords] = useState(project.settings.targetWordCount || 50000);
  const [bookDesc, setBookDesc] = useState(project.settings.description || '');

  const navigate = useNavigate();

  // Sync state with store updates
  useEffect(() => {
    setBookTitle(project.projectName);
    setBookGenre(project.settings.genre || '');
    setBookTargetWords(project.settings.targetWordCount || 50000);
    setBookDesc(project.settings.description || '');
  }, [project.projectName, project.settings.genre, project.settings.targetWordCount, project.settings.description]);

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
    updateBookDetails(bookTitle.trim(), {
      genre: bookGenre.trim(),
      targetWordCount: Number(bookTargetWords),
      description: bookDesc.trim()
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
        <div className="settings-overlay">
          <form onSubmit={handleSettingsSave} className="settings-modal">
            <div className="settings-modal-header">
              <div className="settings-modal-title">
                <Settings size={18} />
                <div>
                  <span>Book Settings</span>
                  <p>Project details used for organization and planning.</p>
                </div>
              </div>
              <button type="button" className="btn-icon" onClick={() => setShowSettings(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="settings-modal-body">
              <section className="settings-section">
                <div className="settings-section-heading">
                  <h3>Project Identity</h3>
                </div>

                <div className="form-group">
                  <label className="form-label">Book Title</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="Enter book title..."
                    value={bookTitle}
                    onChange={e => setBookTitle(e.target.value)}
                  />
                </div>

                <div className="settings-form-grid">
                  <div className="form-group">
                    <label className="form-label">Genre</label>
                    <select
                      className="form-select"
                      value={bookGenre}
                      onChange={e => setBookGenre(e.target.value)}
                    >
                      <option value="">Select Genre...</option>
                      <option value="Fantasy">Fantasy</option>
                      <option value="Sci-Fi">Sci-Fi</option>
                      <option value="Mystery">Mystery</option>
                      <option value="Thriller">Thriller</option>
                      <option value="Romance">Romance</option>
                      <option value="Historical Fiction">Historical Fiction</option>
                      <option value="Non-Fiction">Non-Fiction</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Word Count</label>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      step="5000"
                      value={bookTargetWords}
                      onChange={e => setBookTargetWords(Number(e.target.value))}
                    />
                  </div>
                </div>
              </section>

              <section className="settings-section">
                <div className="settings-section-heading">
                  <h3>Synopsis</h3>
                </div>
                <div className="form-group">
                  <label className="form-label">Description / Synopsis</label>
                  <textarea
                    className="form-textarea settings-large-textarea"
                    placeholder="Brief summary of the book plot or objective..."
                    value={bookDesc}
                    onChange={e => setBookDesc(e.target.value)}
                  />
                </div>
              </section>
            </div>

            <div className="settings-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowSettings(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Book Settings
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

  useEffect(() => {
    const userTheme = user?.user_metadata?.novelsynth_settings?.theme;
    document.documentElement.dataset.theme = isThemeId(userTheme) ? userTheme : DEFAULT_THEME;
  }, [user]);

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
      <ToastHost />
    </StoreProvider>
  )
}

export default App;
