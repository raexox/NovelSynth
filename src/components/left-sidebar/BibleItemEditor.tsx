import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store';
import type { Character, Location, Faction, PowerSystem } from '../../types';
import { ArrowLeft, User, MapPin, Sparkles, Users, FileText, Share2, Search, Tag, Camera, X } from 'lucide-react';

export const BibleItemEditor: React.FC = () => {
  const {
    project,
    activeBibleCategory,
    activeBibleItemId,
    setBibleItemId,
    updateBibleItem,
    createBibleItemVersion,
    loadBibleItemVersions,
    selectScene
  } = useStore();

  const [activeTab, setActiveTab] = useState<'details' | 'research' | 'relations' | 'mentions'>('details');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const item = project.storyBible[activeBibleCategory].find((i: any) => i.id === activeBibleItemId);
  const textValue = (value: unknown) => typeof value === 'string' ? value : '';
  const initialItemRef = useRef<any | null>(null);
  const storyBibleRef = useRef(project.storyBible);

  storyBibleRef.current = project.storyBible;

  useEffect(() => {
    if (!item || !activeBibleItemId) return;

    initialItemRef.current = JSON.parse(JSON.stringify(item));

    return () => {
      const initialItem = initialItemRef.current;
      const currentItem = (storyBibleRef.current[activeBibleCategory] as any[]).find(i => i.id === activeBibleItemId);
      if (!initialItem || !currentItem || initialItem.id !== activeBibleItemId) return;

      const initialSerialized = JSON.stringify(initialItem);
      const currentSerialized = JSON.stringify(currentItem);
      if (initialSerialized === currentSerialized) return;

      const { id: _id, name, ...data } = initialItem;
      createBibleItemVersion({
        bookId: undefined,
        bibleItemId: activeBibleItemId,
        category: activeBibleCategory,
        name,
        data,
        sourceSceneId: null,
        reason: 'Manual Story Bible edit'
      });
    };
  }, [activeBibleCategory, activeBibleItemId]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        updateBibleItem(activeBibleCategory, { ...item, avatarUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  if (!item) {
    return (
      <div style={{ fontSize: 12, padding: 12, color: 'var(--text-muted)' }}>
        Item not found.
        <button type="button" className="btn btn-secondary" style={{ marginTop: 8 }} onClick={() => setBibleItemId(null)}>
          Close Inspector
        </button>
      </div>
    );
  }

  const CategoryIcon = activeBibleCategory === 'characters' ? User :
                       activeBibleCategory === 'locations' ? MapPin :
                       activeBibleCategory === 'factions' ? Users : Sparkles;

  const categoryLabel = activeBibleCategory === 'characters' ? 'Character' :
                        activeBibleCategory === 'locations' ? 'Location' :
                        activeBibleCategory === 'factions' ? 'Faction' : 'Magic System';

  const itemFacts = project.continuityFacts
    .filter(fact => fact.entityId === item.id || fact.entityName.toLowerCase() === item.name.toLowerCase())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="bible-editor" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Back / Close button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          type="button"
          className="btn btn-secondary" 
          style={{ padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
          onClick={() => setBibleItemId(null)}
        >
          <ArrowLeft size={12} />
          <span>Back to Codex</span>
        </button>
        <button 
          type="button"
          className="btn-icon" 
          style={{ padding: 4, color: 'var(--text-secondary)' }}
          onClick={() => setBibleItemId(null)}
          title="Close Inspector"
        >
          <X size={14} />
        </button>
      </div>

      {/* Hero Header with perfectly centered & clickable Avatar */}
      <div style={{ 
        backgroundColor: 'var(--bg-tertiary)', 
        border: '1px solid var(--border-color)', 
        borderRadius: 8, 
        padding: 12,
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        position: 'relative',
        gap: 12
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--accent-purple)', fontWeight: 600 }}>
            <CategoryIcon size={12} />
            <span>{categoryLabel}</span>
          </div>
          
          {/* Title Editor */}
          <input 
            type="text"
            value={item.name}
            onChange={e => updateBibleItem(activeBibleCategory, { ...item, name: e.target.value })}
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text-primary)',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px dashed transparent',
              padding: 0,
              outline: 'none',
              width: '100%'
            }}
            onFocus={e => e.currentTarget.style.borderBottomColor = 'var(--accent-purple)'}
            onBlur={e => e.currentTarget.style.borderBottomColor = 'transparent'}
            placeholder="Item name..."
          />
        </div>

        {/* Top Right Clickable Profile Avatar Box (Perfectly centered icon/image + upload) */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{ 
            width: 52, 
            height: 52, 
            borderRadius: '50%', 
            backgroundColor: 'var(--bg-secondary)', 
            border: '2px solid var(--border-color)',
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--text-muted)',
            flexShrink: 0,
            overflow: 'hidden',
            cursor: 'pointer',
            position: 'relative',
            boxSizing: 'border-box',
            lineHeight: 0,
            fontSize: 0,
            padding: 0
          }}
          title="Click to change avatar image"
        >
          {item.avatarUrl ? (
            <img 
              src={item.avatarUrl} 
              alt={item.name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
            />
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', lineHeight: 0 }}>
              <CategoryIcon size={24} style={{ display: 'block', margin: '0 auto', verticalAlign: 'middle' }} />
            </span>
          )}
          
          {/* Hover Overlay */}
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              opacity: 0,
              transition: 'opacity 0.2s ease',
              color: '#fff'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0'}
          >
            <Camera size={16} />
          </div>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          style={{ display: 'none' }} 
          onChange={handleAvatarUpload} 
        />
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: 4, backgroundColor: 'var(--bg-secondary)', padding: '2px 4px', borderRadius: 6 }}>
        <button
          type="button"
          className={`btn ${activeTab === 'details' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '4px 6px', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
          onClick={() => setActiveTab('details')}
        >
          <FileText size={11} />
          <span>Details</span>
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'relations' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '4px 6px', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
          onClick={() => setActiveTab('relations')}
        >
          <Share2 size={11} />
          <span>Relations</span>
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'mentions' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '4px 6px', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
          onClick={() => setActiveTab('mentions')}
        >
          <Tag size={11} />
          <span>Mentions ({itemFacts.length})</span>
        </button>
      </div>

      {/* Tab Content Panels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {activeTab === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            
            {/* Aliases / Nicknames input box */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Tag size={10} /> Aliases / Nicknames
              </label>
              <input 
                type="text" 
                className="form-input" 
                style={{ padding: '5px 8px', fontSize: 11.5 }}
                value={textValue((item as any).aliases || (item as any).keyFacts)} 
                onChange={e => updateBibleItem(activeBibleCategory, { ...item, aliases: e.target.value, keyFacts: e.target.value })}
                placeholder="Add aliases, nicknames, titles..."
              />
              <span style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 2 }}>
                Names detected in prose for continuity tracking.
              </span>
            </div>

            {/* Character Specific Fields */}
            {activeBibleCategory === 'characters' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: 10 }}>Role</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '4px 8px', fontSize: 11.5 }}
                      value={textValue((item as Character).role)}
                      onChange={e => updateBibleItem('characters', { ...item, role: e.target.value })}
                      placeholder="e.g. Protagonist / Rival"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: 10 }}>Age</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '4px 8px', fontSize: 11.5 }}
                      value={textValue((item as Character).age)}
                      onChange={e => updateBibleItem('characters', { ...item, age: e.target.value })}
                      placeholder="e.g. 24"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 10 }}>Description & Background</label>
                  <textarea 
                    className="form-textarea" 
                    rows={4}
                    style={{ padding: 8, fontSize: 11.5, lineHeight: 1.4 }}
                    value={textValue((item as Character).history)}
                    onChange={e => updateBibleItem('characters', { ...item, history: e.target.value })}
                    placeholder="Write about all the necessary backstory and origin details..."
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 10 }}>Personality & Traits</label>
                  <textarea 
                    className="form-textarea" 
                    rows={3}
                    style={{ padding: 8, fontSize: 11.5, lineHeight: 1.4 }}
                    value={textValue((item as Character).personality)}
                    onChange={e => updateBibleItem('characters', { ...item, personality: e.target.value })}
                    placeholder="Competitive, stubborn, charismatic..."
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 10 }}>Appearance</label>
                  <textarea 
                    className="form-textarea" 
                    rows={3}
                    style={{ padding: 8, fontSize: 11.5 }}
                    value={textValue((item as Character).appearance)}
                    onChange={e => updateBibleItem('characters', { ...item, appearance: e.target.value })}
                    placeholder="Physical appearance, clothing style, distinctive marks..."
                  />
                </div>
              </>
            )}

            {/* Location Specific Fields */}
            {activeBibleCategory === 'locations' && (
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 10 }}>Description & Features</label>
                  <textarea 
                    className="form-textarea" 
                    rows={4}
                    style={{ padding: 8, fontSize: 11.5, lineHeight: 1.4 }}
                    value={(item as Location).description} 
                    onChange={e => updateBibleItem('locations', { ...item, description: e.target.value })}
                    placeholder="Describe the manor, magical enhancements, gardens, structure..."
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 10 }}>Culture & Landmarks</label>
                  <textarea 
                    className="form-textarea" 
                    rows={3}
                    style={{ padding: 8, fontSize: 11.5 }}
                    value={(item as Location).culture || (item as Location).landmarks || ''} 
                    onChange={e => updateBibleItem('locations', { ...item, culture: e.target.value, landmarks: e.target.value })}
                    placeholder="Local culture, prominent landmarks..."
                  />
                </div>
              </>
            )}

            {/* Faction Specific Fields */}
            {activeBibleCategory === 'factions' && (
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 10 }}>Leader & Hierarchy</label>
                  <input 
                    type="text"
                    className="form-input" 
                    style={{ padding: '4px 8px', fontSize: 11.5 }}
                    value={(item as Faction).leader} 
                    onChange={e => updateBibleItem('factions', { ...item, leader: e.target.value })}
                    placeholder="Leader name..."
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 10 }}>Beliefs & Goals</label>
                  <textarea 
                    className="form-textarea" 
                    rows={4}
                    style={{ padding: 8, fontSize: 11.5 }}
                    value={(item as Faction).beliefs} 
                    onChange={e => updateBibleItem('factions', { ...item, beliefs: e.target.value })}
                    placeholder="Faction ideology, goals, resources..."
                  />
                </div>
              </>
            )}

            {/* Magic System Specific Fields */}
            {activeBibleCategory === 'powerSystems' && (
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 10 }}>System Rules & Mechanics</label>
                  <textarea 
                    className="form-textarea" 
                    rows={4}
                    style={{ padding: 8, fontSize: 11.5, lineHeight: 1.4 }}
                    value={(item as PowerSystem).rules} 
                    onChange={e => updateBibleItem('powerSystems', { ...item, rules: e.target.value })}
                    placeholder="Energy sources, casting rules, elemental magic mechanics..."
                  />
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'relations' && (
          <div style={{ padding: 8, backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>Connected Story Bible Items</span>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <textarea 
                className="form-textarea" 
                rows={4}
                style={{ padding: 8, fontSize: 11, lineHeight: 1.4 }}
                value={textValue((item as any).relationships)} 
                onChange={e => updateBibleItem(activeBibleCategory, { ...item, relationships: e.target.value })}
                placeholder="Describe relationships with other characters, allies, or locations..."
              />
            </div>
          </div>
        )}

        {activeTab === 'mentions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>Continuity Mentions & Facts</span>
            {itemFacts.length > 0 ? (
              itemFacts.map((fact, idx) => (
                <div key={idx} style={{ padding: 8, backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: 11, lineHeight: 1.35 }}>
                  <div style={{ fontSize: 9.5, color: 'var(--accent-purple)', fontWeight: 600, textTransform: 'uppercase' }}>
                    {fact.factType} • {fact.status}
                  </div>
                  <div style={{ color: 'var(--text-primary)', marginTop: 2 }}>{fact.factText}</div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', padding: 8 }}>
                No active continuity facts recorded for this item yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
