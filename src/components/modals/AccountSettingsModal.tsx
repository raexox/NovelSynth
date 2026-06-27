import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Settings, X } from 'lucide-react';
import { DEFAULT_THEME, THEME_OPTIONS, type ThemeId, isThemeId } from '../../theme/themes';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUserSettings } = useStore();
  const userSettings = user?.user_metadata?.novelsynth_settings || {};

  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-1.5-flash');
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'openrouter'>('gemini');
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

  if (!isOpen) return null;

  const handleAccountSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserSettings({
      apiKey: apiKey.trim(),
      model: model.trim(),
      provider,
      aiTemperature: aiTemp,
      theme: accountTheme
    });
    onClose();
  };

  return (
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
          <button type="button" className="btn-icon" onClick={onClose}>
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
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};
