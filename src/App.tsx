import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { AuthGate } from './components/auth/AuthGate';
import { BookDashboard } from './components/dashboard/BookDashboard';
import { WorkspaceShell } from './components/workspace/WorkspaceShell';
import { ToastHost } from './components/ToastHost';
import { AlertTriangle } from 'lucide-react';
import { DEFAULT_THEME, isThemeId } from './theme/themes';

const WorkspaceWrapper: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const { activeBookId, loadBook, booksLoading } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (bookId && activeBookId !== bookId) {
      loadBook(bookId);
    }
  }, [bookId, activeBookId, loadBook]);

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
  );
}

export default App;
