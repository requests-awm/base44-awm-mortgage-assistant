import React from 'react';

const TIMELINE_CONFIG = {
  overdue: {
    label: 'Overdue',
    emoji: '🔴',
    color: '#DC2626'
  },
  critical: {
    label: 'Critical',
    emoji: '🔴',
    color: '#EF4444'
  },
  soon: {
    label: 'Soon',
    emoji: '🟠',
    color: '#F59E0B'
  },
  standard: {
    label: 'Standard',
    emoji: '⚪',
    color: '#9CA3AF'
  }
};

export function TimelineBadge({ urgency, daysLeft, size = 'default' }) {
  const config = TIMELINE_CONFIG[urgency] || TIMELINE_CONFIG.standard;
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex items-center gap-1">
      <span className={textSize}>{config.emoji}</span>
      <span className={`${textSize} text-slate-600`}>
        {config.label}
        {daysLeft !== null && daysLeft !== undefined && urgency !== 'standard' && (
          <span className="text-slate-500 ml-1">
            ({Math.abs(daysLeft)} day{Math.abs(daysLeft) !== 1 ? 's' : ''}{daysLeft < 0 ? ' overdue' : ' left'})
          </span>
        )}
      </span>
    </div>
  );
}

export default TimelineBadge;