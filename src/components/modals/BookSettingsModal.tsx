import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { notify } from '../../services/notifications';
import { Settings, X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';

interface BookSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookSettingsModal: React.FC<BookSettingsModalProps> = ({ isOpen, onClose }) => {
  const { project, updateBookDetails, updateUserSettings, deleteBook } = useStore();
  const navigate = useNavigate();

  const [bookTitle, setBookTitle] = useState(project.projectName);
  const [bookGenre, setBookGenre] = useState(project.settings.genre || '');
  const [bookTargetWords, setBookTargetWords] = useState(project.settings.targetWordCount || 50000);
  const [bookDesc, setBookDesc] = useState(project.settings.description || '');
  const [bookCoverImageUrl, setBookCoverImageUrl] = useState(project.settings.coverImageUrl || '');
  const [apiKey, setApiKey] = useState(project.settings.apiKey || '');
  const [model, setModel] = useState(project.settings.model || 'gemini-1.5-flash');
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'openrouter'>(project.settings.provider || 'gemini');
  const [aiTemp, setAiTemp] = useState(project.settings.aiTemperature || 0.7);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingBook, setDeletingBook] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBookTitle(project.projectName);
    setBookGenre(project.settings.genre || '');
    setBookTargetWords(project.settings.targetWordCount || 50000);
    setBookDesc(project.settings.description || '');
    setBookCoverImageUrl(project.settings.coverImageUrl || '');
    setApiKey(project.settings.apiKey || '');
    setModel(project.settings.model || 'gemini-1.5-flash');
    setProvider(project.settings.provider || 'gemini');
    setAiTemp(project.settings.aiTemperature || 0.7);
    setDeleteConfirmText('');
  }, [
    project.projectName,
    project.settings.genre,
    project.settings.targetWordCount,
    project.settings.description,
    project.settings.coverImageUrl,
    project.settings.apiKey,
    project.settings.model,
    project.settings.provider,
    project.settings.aiTemperature
  ]);

  if (!isOpen) return null;

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify({
        tone: 'warning',
        title: 'Image required',
        message: 'Choose a PNG, JPG, or other image file for the book cover.'
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      notify({
        tone: 'warning',
        title: 'Cover too large',
        message: 'Choose an image under 2 MB so it can be stored with the book settings.'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      setBookCoverImageUrl(String(event.target?.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const aiSettings = {
      apiKey: apiKey.trim(),
      model: model.trim(),
      provider,
      aiTemperature: aiTemp
    };

    await updateUserSettings(aiSettings);
    updateBookDetails(bookTitle.trim(), {
      genre: bookGenre.trim(),
      targetWordCount: Number(bookTargetWords),
      description: bookDesc.trim(),
      coverImageUrl: bookCoverImageUrl.trim(),
      ...aiSettings
    });
    onClose();
  };

  const handleDeleteBook = async () => {
    if (deleteConfirmText !== project.projectName) {
      notify({
        tone: 'warning',
        title: 'Confirmation mismatch',
        message: 'Type the exact book title before deleting.'
      });
      return;
    }

    setDeletingBook(true);
    try {
      const deleted = await deleteBook();
      if (deleted) {
        onClose();
        navigate('/dashboard');
      }
    } finally {
      setDeletingBook(false);
    }
  };

  return (
    <div className="settings-overlay">
      <form onSubmit={handleSettingsSave} className="settings-modal settings-modal-wide book-settings-modal">
        <div className="settings-modal-header">
          <div className="settings-modal-title">
            <Settings size={18} />
            <div>
              <span>Book Settings</span>
              <p>Project details used for organization and planning.</p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="settings-modal-body">
          <div className="book-settings-grid">
            <section className="settings-section">
              <div className="settings-section-heading">
                <h3>Metadata</h3>
              </div>
              <p className="settings-section-copy">
                This is the metadata of your novel, used for organizing your book collection.
              </p>

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

            <section className="settings-section cover-settings-section">
              <div className="settings-section-heading">
                <h3>Cover</h3>
              </div>
              <p className="settings-section-copy">
                This image appears on the bookshelf and in collection views.
              </p>

              <div className="cover-preview-frame">
                {bookCoverImageUrl ? (
                  <img src={bookCoverImageUrl} alt="Book cover preview" className="cover-preview-image" />
                ) : (
                  <div className="cover-preview-empty">
                    <ImageIcon size={28} />
                    <span>No cover selected</span>
                  </div>
                )}
              </div>

              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverFileChange}
                style={{ display: 'none' }}
              />

              <div className="cover-actions">
                <button type="button" className="btn btn-secondary" onClick={() => coverInputRef.current?.click()}>
                  <Upload size={14} />
                  Upload Image
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setBookCoverImageUrl('')} disabled={!bookCoverImageUrl}>
                  Remove
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Cover Image URL</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://..."
                  value={bookCoverImageUrl}
                  onChange={e => setBookCoverImageUrl(e.target.value)}
                />
                <span className="form-help">Use a hosted image URL or upload an image under 2 MB.</span>
              </div>
            </section>
          </div>

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
                    else setModel('google/gemini-2.5-flash');
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

          <section className="settings-section danger-section">
            <div className="settings-section-heading">
              <h3>Danger Zone</h3>
            </div>
            <div className="danger-zone-copy">
              <strong>Delete this book</strong>
              <span>This permanently removes chapters, scenes, story bible entries, notes, plot threads, memory updates, and snapshots.</span>
            </div>
            <div className="form-group">
              <label className="form-label">Type "{project.projectName}" to confirm</label>
              <input
                type="text"
                className="form-input"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder={project.projectName}
                disabled={deletingBook}
              />
            </div>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDeleteBook}
              disabled={deletingBook || deleteConfirmText !== project.projectName}
            >
              <Trash2 size={14} />
              {deletingBook ? 'Deleting...' : 'Delete Book'}
            </button>
          </section>
        </div>

        <div className="settings-modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save Book Settings
          </button>
        </div>
      </form>
    </div>
  );
};
