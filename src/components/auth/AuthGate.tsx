import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { notify } from '../../services/notifications';
import { Sparkles, Lock, Mail, Key, AlertTriangle } from 'lucide-react';

export const AuthGate: React.FC = () => {
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
