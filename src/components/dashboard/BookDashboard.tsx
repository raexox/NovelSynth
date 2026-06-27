import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { AccountSettingsModal } from '../modals/AccountSettingsModal';
import { Sparkles, LogOut, BookOpen, Plus, ChevronRight } from 'lucide-react';

export const BookDashboard: React.FC = () => {
  const { booksList, createBook, signOut, user, booksLoading } = useStore();
  const [newBookName, setNewBookName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
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
                <div className="book-cover-frame">
                  {book.settings?.coverImageUrl ? (
                    <img src={book.settings.coverImageUrl} alt={`${book.name} cover`} className="book-cover-image" />
                  ) : (
                    <div className="book-cover-placeholder">
                      <BookOpen size={26} />
                    </div>
                  )}
                </div>
                <div className="book-card-header">
                  <BookOpen size={24} className="book-icon" />
                  <h3>{book.name}</h3>
                </div>
                {book.settings?.genre && (
                  <div className="book-card-subtitle">{book.settings.genre}</div>
                )}
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
      <AccountSettingsModal 
        isOpen={showAccountSettings} 
        onClose={() => setShowAccountSettings(false)} 
      />
    </div>
  );
};
