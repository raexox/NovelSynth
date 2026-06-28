import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { notify } from '../../services/notifications';
import { Settings, X, Upload, Image as ImageIcon, Trash2, BookOpen, Edit3, Sparkles, HelpCircle, User, Info, Users, Download, Archive, Tag } from 'lucide-react';

interface BookSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookSettingsModal: React.FC<BookSettingsModalProps> = ({ isOpen, onClose }) => {
  const { project, updateBookDetails, updateUserSettings, deleteBook } = useStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'metadata' | 'writing' | 'ai'>('writing');
  const [bookTitle, setBookTitle] = useState(project.projectName);
  const [authorName, setAuthorName] = useState(project.settings.authorName || '');
  const [seriesName, setSeriesName] = useState(project.settings.seriesName || '');
  const [seriesIndex, setSeriesIndex] = useState(project.settings.seriesIndex || '');
  const [bookGenre, setBookGenre] = useState(project.settings.genre || '');
  const [bookTargetWords, setBookTargetWords] = useState(project.settings.targetWordCount || 50000);
  const [bookDesc, setBookDesc] = useState(project.settings.description || '');
  const [bookCoverImageUrl, setBookCoverImageUrl] = useState(project.settings.coverImageUrl || '');
  const [apiKey, setApiKey] = useState(project.settings.apiKey || '');
  const [model, setModel] = useState(project.settings.model || 'gemini-1.5-flash');
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'openrouter'>(project.settings.provider || 'gemini');
  const [aiTemp, setAiTemp] = useState(project.settings.aiTemperature || 0.7);
  const [proseTense, setProseTense] = useState<'Past' | 'Present'>(project.settings.proseTense || 'Past');
  const [proseLanguage, setProseLanguage] = useState(project.settings.proseLanguage || 'US English');
  const [povType, setPovType] = useState(project.settings.povType || '3rd Person (Limited)');
  const [defaultPovCharacter, setDefaultPovCharacter] = useState(project.settings.defaultPovCharacter || '');
  const [povNotes, setPovNotes] = useState(project.settings.povNotes || '');
  const [isCustomPov, setIsCustomPov] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingBook, setDeletingBook] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBookTitle(project.projectName);
    setAuthorName(project.settings.authorName || '');
    setSeriesName(project.settings.seriesName || '');
    setSeriesIndex(project.settings.seriesIndex || '');
    setBookGenre(project.settings.genre || '');
    setBookTargetWords(project.settings.targetWordCount || 50000);
    setBookDesc(project.settings.description || '');
    setBookCoverImageUrl(project.settings.coverImageUrl || '');
    setApiKey(project.settings.apiKey || '');
    setModel(project.settings.model || 'gemini-1.5-flash');
    setProvider(project.settings.provider || 'gemini');
    setAiTemp(project.settings.aiTemperature || 0.7);
    setProseTense(project.settings.proseTense || 'Past');
    setProseLanguage(project.settings.proseLanguage || 'US English');
    setPovType(project.settings.povType || '3rd Person (Limited)');
    setDefaultPovCharacter(project.settings.defaultPovCharacter || '');
    setPovNotes(project.settings.povNotes || '');
    setIsCustomPov(false);
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
    project.settings.aiTemperature,
    project.settings.proseTense,
    project.settings.proseLanguage,
    project.settings.povType,
    project.settings.defaultPovCharacter,
    project.settings.povNotes,
    project.settings.authorName,
    project.settings.seriesName,
    project.settings.seriesIndex
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

  const bibleCharacters = project.storyBible?.characters || [];
  const povCharacterOptions = Array.from(new Set([
    ...bibleCharacters.map(c => c.name),
    ...(defaultPovCharacter && !bibleCharacters.some(c => c.name === defaultPovCharacter) ? [defaultPovCharacter] : [])
  ]));

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
      proseTense,
      proseLanguage: proseLanguage.trim(),
      povType,
      defaultPovCharacter: defaultPovCharacter.trim(),
      povNotes: povNotes.trim(),
      authorName: authorName.trim(),
      seriesName: seriesName.trim(),
      seriesIndex: seriesIndex.trim(),
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

        {/* Top Tab Navigation Bar */}
        <div className="book-settings-tab-bar">
          <button
            type="button"
            className={`book-settings-tab ${activeTab === 'metadata' ? 'active' : ''}`}
            onClick={() => setActiveTab('metadata')}
          >
            <Info size={15} />
            <span>Metadata</span>
          </button>
          <button
            type="button"
            className={`book-settings-tab ${activeTab === 'writing' ? 'active' : ''}`}
            onClick={() => setActiveTab('writing')}
          >
            <BookOpen size={15} />
            <span>Writing</span>
          </button>
          <button
            type="button"
            className={`book-settings-tab ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <Sparkles size={15} />
            <span>AI Defaults</span>
          </button>
          <button
            type="button"
            className="book-settings-tab disabled"
            title="Collaboration tools coming soon"
          >
            <Users size={15} />
            <span>Collaboration</span>
          </button>
          <button
            type="button"
            className="book-settings-tab disabled"
            title="Export tools available in main editor menu"
          >
            <Download size={15} />
            <span>Export</span>
          </button>
        </div>

        <div className="settings-modal-body">
          {/* TAB 1: METADATA */}
          {activeTab === 'metadata' && (
            <div className="tab-pane">
              <div className="book-settings-grid">
                <section className="settings-section">
                  <div className="settings-section-heading">
                    <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '13px' }}>METADATA</h3>
                  </div>
                  <p className="settings-section-copy">
                    This is the metadata of your novel, used for organizing your novel collection.
                  </p>

                  <div className="form-group">
                    <label className="form-label">Novel Title</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="Enter novel title..."
                      value={bookTitle}
                      onChange={e => setBookTitle(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>Author / Pen name</label>
                      <span title="The author or pen name shown on published works"><HelpCircle size={13} style={{ color: 'var(--text-muted)' }} /></span>
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Raymond F"
                      value={authorName}
                      onChange={e => setAuthorName(e.target.value)}
                    />
                  </div>

                  <div className="settings-form-grid" style={{ marginBottom: '14px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Series (optional)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Select or type series..."
                        value={seriesName}
                        onChange={e => setSeriesName(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Series index</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Book 1"
                        value={seriesIndex}
                        onChange={e => setSeriesIndex(e.target.value)}
                      />
                    </div>
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
                  <div className="settings-section-heading" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '13px' }}>COVER</h3>
                    <span title="Displayed on the novel collection page"><HelpCircle size={13} style={{ color: 'var(--text-muted)' }} /></span>
                  </div>
                  <p className="settings-section-copy">
                    This is the cover of your novel. It will be displayed on the novel collection page.
                  </p>

                  <div className="cover-preview-frame">
                    {bookCoverImageUrl ? (
                      <img src={bookCoverImageUrl} alt="Book cover preview" className="cover-preview-image" />
                    ) : (
                      <div className="cover-preview-empty">
                        <ImageIcon size={28} />
                        <span>No Cover Image</span>
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

              <section className="settings-section danger-section" style={{ marginTop: '16px' }}>
                <div className="settings-section-heading">
                  <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '13px' }}>DANGER ZONE</h3>
                </div>
                <div className="danger-zone-copy">
                  <span>Some actions in this section cannot be undone and may have unintended consequences.</span>
                </div>
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="form-label">Type "{project.projectName}" to confirm deletion</label>
                  <input
                    type="text"
                    className="form-input"
                    value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                    placeholder={project.projectName}
                    disabled={deletingBook}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => notify({ tone: 'info', title: 'Novel Archived', message: 'Novel state archived.' })}
                  >
                    <Archive size={14} />
                    Archive Novel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDeleteBook}
                    disabled={deletingBook || deleteConfirmText !== project.projectName}
                  >
                    <Trash2 size={14} />
                    {deletingBook ? 'Deleting...' : 'Delete Novel'}
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: WRITING */}
          {activeTab === 'writing' && (
            <div className="tab-pane">
              <div className="book-settings-grid">
                {/* Left Column: LABELS/MARKERS */}
                <section className="settings-section">
                  <div className="settings-section-heading" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '13px' }}>LABELS/MARKERS</h3>
                    <span title="Organize scenes by status, subplot, etc."><HelpCircle size={13} style={{ color: 'var(--text-muted)' }} /></span>
                  </div>
                  <p className="settings-section-copy">
                    Use these to organize your scenes by status, subplot, etc. You can also prefix them with a group (e.g. "Status: Draft").
                  </p>

                  <div className="labels-empty-box">
                    <Tag size={20} style={{ opacity: 0.5, marginBottom: '4px' }} />
                    <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>No Labels</strong>
                    <span>There are no labels for this novel.</span>
                  </div>
                </section>

                {/* Right Column: PROSE */}
                <section className="settings-section prose-settings-section">
                  <div className="settings-section-heading">
                    <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '13px' }}>PROSE</h3>
                  </div>

                  {/* Tense Field */}
                  <div className="prose-field-group">
                    <div className="prose-field-header">
                      <span>Tense</span>
                      <span className="help-icon" title="Passed to the AI during prose generation"><HelpCircle size={14} /></span>
                      <span className="sparkle-icon"><Sparkles size={14} /></span>
                    </div>
                    <p className="prose-field-desc">This is the tense of your novel. It will be passed on to the AI for prose generation.</p>
                    <div className="prose-segmented-group">
                      <button
                        type="button"
                        className={`prose-pill-button ${proseTense === 'Past' ? 'active' : ''}`}
                        onClick={() => setProseTense('Past')}
                      >
                        Past
                      </button>
                      <button
                        type="button"
                        className={`prose-pill-button ${proseTense === 'Present' ? 'active' : ''}`}
                        onClick={() => setProseTense('Present')}
                      >
                        Present
                      </button>
                    </div>
                  </div>

                  {/* Language Field */}
                  <div className="prose-field-group">
                    <div className="prose-field-header">
                      <span>Language</span>
                      <span className="sparkle-icon"><Sparkles size={14} /></span>
                    </div>
                    <p className="prose-field-desc">This is the language of your novel. It will be used for spell checking and hyphenation.</p>
                    <input
                      type="text"
                      className="form-input"
                      style={{ maxWidth: '340px' }}
                      value={proseLanguage}
                      onChange={e => setProseLanguage(e.target.value)}
                      placeholder="e.g. US English, UK English..."
                    />
                  </div>

                  {/* Point of View Field */}
                  <div className="prose-field-group">
                    <div className="prose-field-header">
                      <span>Point of View</span>
                      <span className="help-icon" title="General point of view for AI generation"><HelpCircle size={14} /></span>
                      <span className="sparkle-icon"><Sparkles size={14} /></span>
                    </div>
                    <p className="prose-field-desc">This is the general point of view of your novel. It will be passed on to the AI for prose generation. (You can override this on a per-scene basis.)</p>

                    <div className="pov-rows-container">
                      <div className="pov-row">
                        <div className="pov-row-label">Type</div>
                        <div className="pov-row-content">
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
                            {['1st Person', '2nd Person', '3rd Person'].map(t => (
                              <button
                                key={t}
                                type="button"
                                className={`prose-pill-button ${povType === t ? 'active' : ''}`}
                                onClick={() => setPovType(t)}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%', marginTop: '4px' }}>
                            {['3rd Person (Limited)', '3rd Person (Omniscient)'].map(t => (
                              <button
                                key={t}
                                type="button"
                                className={`prose-pill-button ${povType === t ? 'active' : ''}`}
                                onClick={() => setPovType(t)}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pov-row" style={{ alignItems: 'center' }}>
                        <div className="pov-row-label" style={{ paddingTop: 0 }}>Character</div>
                        <div className="pov-row-content" style={{ alignItems: 'center' }}>
                          <div className="char-select-badge">
                            <User size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            {isCustomPov ? (
                              <input
                                type="text"
                                className="form-input"
                                style={{ background: 'transparent', border: 'none', padding: 0, height: 'auto', outline: 'none', fontSize: '13px', color: 'var(--text-primary)' }}
                                placeholder="Enter name..."
                                value={defaultPovCharacter}
                                onChange={e => setDefaultPovCharacter(e.target.value)}
                              />
                            ) : (
                              <select
                                value={defaultPovCharacter}
                                onChange={e => {
                                  if (e.target.value === '__CUSTOM__') {
                                    setIsCustomPov(true);
                                  } else {
                                    setDefaultPovCharacter(e.target.value);
                                  }
                                }}
                              >
                                <option value="">Select Character...</option>
                                {povCharacterOptions.map((charName, idx) => (
                                  <option key={idx} value={charName}>{charName}</option>
                                ))}
                                <option value="__CUSTOM__">+ Enter custom name...</option>
                              </select>
                            )}
                          </div>
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}
                            onClick={() => setIsCustomPov(!isCustomPov)}
                          >
                            {isCustomPov ? <BookOpen size={12} /> : <Edit3 size={12} />}
                            <span>{isCustomPov ? 'Bible List' : 'Custom'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* TAB 3: AI DEFAULTS */}
          {activeTab === 'ai' && (
            <div className="tab-pane">
              <section className="settings-section">
                <div className="settings-section-heading">
                  <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '13px' }}>AI DEFAULTS</h3>
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
            </div>
          )}
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
