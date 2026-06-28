import React, { useState } from 'react';
import { useStore } from '../../store';
import { Sparkles, Zap, Check, FileText, Layers, MapPin, User, Users, GitBranch, BookOpen } from 'lucide-react';

interface AiActionCardProps {
  action: {
    type: string;
    targetScene?: string;
    summary?: string;
    addBeats?: string[];
    location?: string;
    pov?: string;
    name?: string;
    age?: string;
    era?: string;
    role?: string;
    personality?: string;
    appearance?: string;
    goals?: string;
    description?: string;
    landmarks?: string;
    rules?: string;
    leader?: string;
    beliefs?: string;
    title?: string;
    threadType?: string;
    content?: string;
  };
}

export const AiActionCard: React.FC<AiActionCardProps> = ({ action }) => {
  const { applyAiChatAction } = useStore();
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    setLoading(true);
    try {
      const success = await applyAiChatAction(action);
      if (success) {
        setApplied(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const actionType = String(action.type || '').toLowerCase();

  let title = 'Proposed Action';
  let badgeLabel = 'System Update';
  let applyLabel = '⚡ Click to Apply';
  let appliedLabel = '✓ Applied';
  let icon = <Sparkles size={13} />;

  if (actionType === 'create_character' || actionType === 'add_character') {
    title = 'New Character Profile';
    badgeLabel = action.name || 'Character';
    applyLabel = '⚡ Click to Add to Story Bible';
    appliedLabel = '✓ Added to Story Bible';
    icon = <User size={13} />;
  } else if (actionType === 'create_location' || actionType === 'add_location') {
    title = 'New Location Profile';
    badgeLabel = action.name || 'Location';
    applyLabel = '⚡ Click to Add to Story Bible';
    appliedLabel = '✓ Added to Story Bible';
    icon = <MapPin size={13} />;
  } else if (actionType === 'create_lore' || actionType === 'add_lore') {
    title = 'New World Lore Entry';
    badgeLabel = action.name || 'World Lore';
    applyLabel = '⚡ Click to Add to World Lore';
    appliedLabel = '✓ Added to World Lore';
    icon = <BookOpen size={13} />;
  } else if (actionType === 'create_power_system' || actionType === 'create_magic' || actionType === 'add_power_system' || actionType === 'add_magic') {
    title = 'New Magic & Power System';
    badgeLabel = action.name || 'Power System';
    applyLabel = '⚡ Click to Add to Power Systems';
    appliedLabel = '✓ Added to Power Systems';
    icon = <Sparkles size={13} />;
  } else if (actionType === 'create_faction' || actionType === 'add_faction') {
    title = 'New Faction Profile';
    badgeLabel = action.name || 'Faction';
    applyLabel = '⚡ Click to Add to Story Bible';
    appliedLabel = '✓ Added to Story Bible';
    icon = <Users size={13} />;
  } else if (actionType === 'create_plot_thread' || actionType === 'add_plot_thread') {
    title = 'New Plot Thread';
    badgeLabel = action.title || 'Plot Thread';
    applyLabel = '⚡ Click to Add Plot Thread';
    appliedLabel = '✓ Added to Plot Threads';
    icon = <GitBranch size={13} />;
  } else if (actionType === 'add_note' || actionType === 'create_note') {
    title = 'New Note Scrap';
    badgeLabel = action.title || 'Note';
    applyLabel = '⚡ Click to Save Note';
    appliedLabel = '✓ Saved to Scrapbook';
    icon = <FileText size={13} />;
  } else {
    title = 'Proposed Outline Update';
    badgeLabel = action.targetScene || 'Scene';
    applyLabel = '⚡ Click to Apply to Outline';
    appliedLabel = '✓ Applied to Outline';
    icon = <Layers size={13} />;
  }

  return (
    <div style={{
      marginTop: 10,
      padding: 12,
      borderRadius: 8,
      backgroundColor: 'var(--bg-tertiary, #0c111d)',
      border: '1px solid var(--accent-purple, #9333ea)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      boxShadow: '0 4px 14px rgba(147, 51, 234, 0.15)'
    }}>
      {/* Card Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-purple, #d8b4fe)', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {icon}
          <span>{title}</span>
        </div>
        <span style={{ fontSize: 10.5, backgroundColor: 'rgba(147, 51, 234, 0.2)', color: '#d8b4fe', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
          {badgeLabel}
        </span>
      </div>

      {/* Details Preview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-primary, #f8fafc)' }}>
        {/* Outline Summary */}
        {action.summary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted, #94a3b8)', fontWeight: 700, textTransform: 'uppercase' }}>Concept Summary:</span>
            <div style={{ fontStyle: 'italic', backgroundColor: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: 4 }}>"{action.summary}"</div>
          </div>
        )}

        {/* Beats */}
        {Array.isArray(action.addBeats) && action.addBeats.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted, #94a3b8)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Layers size={11} /> Plot Beats (+{action.addBeats.length}):
            </span>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11.5, color: 'var(--text-secondary, #cbd5e1)' }}>
              {action.addBeats.map((beat, idx) => (
                <li key={idx} style={{ marginBottom: 2 }}>{beat}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Lore / Power System details */}
        {(actionType === 'create_lore' || actionType === 'add_lore') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5 }}>
            {(action as any).era && <div><strong>Era:</strong> {(action as any).era}</div>}
            {((action as any).description || action.rules || (action as any).history) && (
              <div>
                <strong>Overview / History:</strong>
                <div style={{ maxHeight: 90, overflowY: 'auto', backgroundColor: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: 4, marginTop: 2, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                  {(action as any).description || action.rules || (action as any).history}
                </div>
              </div>
            )}
          </div>
        )}

        {(actionType === 'create_power_system' || actionType === 'create_magic' || actionType === 'add_power_system' || actionType === 'add_magic') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5 }}>
            {(action.rules || action.description) && (
              <div>
                <strong>Rules & Mechanics:</strong>
                <div style={{ maxHeight: 90, overflowY: 'auto', backgroundColor: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: 4, marginTop: 2, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                  {action.rules || action.description}
                </div>
              </div>
            )}
            {(action as any).limitations && <div><strong>Limitations:</strong> {(action as any).limitations}</div>}
            {(action as any).costs && <div><strong>Costs:</strong> {(action as any).costs}</div>}
          </div>
        )}

        {/* Faction details */}
        {(actionType === 'create_faction' || actionType === 'add_faction') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5 }}>
            {action.leader && <div><strong>Leader:</strong> {action.leader}</div>}
            {(action as any).members && <div><strong>Members:</strong> {(action as any).members}</div>}
            {action.beliefs && <div><strong>Beliefs & Ideology:</strong> {action.beliefs}</div>}
            {action.description && (
              <div>
                <strong>Description:</strong>
                <div style={{ maxHeight: 90, overflowY: 'auto', backgroundColor: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: 4, marginTop: 2, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                  {action.description}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Character details */}
        {(actionType === 'create_character' || actionType === 'add_character') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5 }}>
            {action.age && <div><strong>Age:</strong> {action.age}</div>}
            {action.role && <div><strong>Role:</strong> {action.role}</div>}
            {action.appearance && <div><strong>Appearance:</strong> {action.appearance}</div>}
            {action.personality && <div><strong>Personality:</strong> {action.personality}</div>}
            {action.goals && <div><strong>Goals:</strong> {action.goals}</div>}
            {(action as any).fears && <div><strong>Fears:</strong> {(action as any).fears}</div>}
            {(action.description || (action as any).history || (action as any).backstory) && (
              <div>
                <strong>Description / Backstory:</strong>
                <div style={{ maxHeight: 90, overflowY: 'auto', backgroundColor: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: 4, marginTop: 2, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                  {action.description || (action as any).history || (action as any).backstory}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Location details */}
        {(actionType === 'create_location' || actionType === 'add_location') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5 }}>
            {action.description && (
              <div>
                <strong>Description:</strong>
                <div style={{ maxHeight: 90, overflowY: 'auto', backgroundColor: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: 4, marginTop: 2, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                  {action.description}
                </div>
              </div>
            )}
            {(action as any).culture && <div><strong>Culture:</strong> {(action as any).culture}</div>}
            {action.landmarks && <div><strong>Landmarks:</strong> {action.landmarks}</div>}
          </div>
        )}

        {/* Plot thread details */}
        {(actionType === 'create_plot_thread' || actionType === 'add_plot_thread') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5 }}>
            {action.description && (
              <div>
                <strong>Description:</strong>
                <div style={{ maxHeight: 90, overflowY: 'auto', backgroundColor: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: 4, marginTop: 2, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                  {action.description}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Note details */}
        {(actionType === 'add_note' || actionType === 'create_note') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5 }}>
            {(action.content || action.description) && (
              <div>
                <strong>Content / Note:</strong>
                <div style={{ maxHeight: 90, overflowY: 'auto', backgroundColor: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: 4, marginTop: 2, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                  {action.content || action.description}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive Apply Button */}
      <div style={{ marginTop: 4, display: 'flex', justifyContent: 'flex-end' }}>
        {applied ? (
          <button 
            type="button" 
            className="btn btn-secondary btn-xs" 
            disabled 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4, 
              color: '#10b981', 
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fontWeight: 700 
            }}
          >
            <Check size={13} />
            <span>{appliedLabel}</span>
          </button>
        ) : (
          <button 
            type="button" 
            className="btn btn-primary btn-xs" 
            onClick={handleApply}
            disabled={loading}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4, 
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(147, 51, 234, 0.4)'
            }}
          >
            <Zap size={13} />
            <span>{loading ? 'Applying...' : applyLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};
