import React from 'react';
import { 
  FileText, CheckCircle, AlertTriangle, Clock, User, 
  MessageSquare, Building, Send, Bot, Eye, Banknote
} from 'lucide-react';
import { format } from 'date-fns';

const ACTION_ICONS = {
  intake: FileText,
  validation: CheckCircle,
  analysis: Building,
  delivery: Send,
  chase: MessageSquare,
  decision: CheckCircle,
  commercial: Banknote,
  stage_change: Clock,
  manual_override: User
};

const ACTION_COLORS = {
  intake: 'bg-slate-100 text-slate-600',
  validation: 'bg-blue-100 text-blue-600',
  analysis: 'bg-purple-100 text-purple-600',
  delivery: 'bg-indigo-100 text-indigo-600',
  chase: 'bg-amber-100 text-amber-600',
  decision: 'bg-emerald-100 text-emerald-600',
  commercial: 'bg-green-100 text-green-600',
  stage_change: 'bg-cyan-100 text-cyan-600',
  manual_override: 'bg-orange-100 text-orange-600'
};

export default function CaseTimeline({ logs = [] }) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Clock className="w-8 h-8 mb-2" />
        <p className="text-sm">No activity recorded yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />

      <div className="space-y-4">
        {logs.map((log, idx) => {
          const Icon = ACTION_ICONS[log.action_category] || Clock;
          const color = ACTION_COLORS[log.action_category] || 'bg-slate-100 text-slate-600';

          return (
            <div key={log.id || idx} className="relative flex gap-4 pl-2">
              {/* Icon */}
              <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center ${color}`}>
                {log.actor === 'agent' ? (
                  <Bot className="w-3.5 h-3.5" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{log.action}</p>
                    {log.actor_email && log.actor === 'user' && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        by {log.actor_email.split('@')[0]}
                      </p>
                    )}
                    {log.actor === 'agent' && (
                      <p className="text-xs text-slate-500 mt-0.5">Automated</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {format(new Date(log.created_date || log.timestamp), 'MMM d, HH:mm')}
                  </span>
                </div>

                {/* Stage change indicator */}
                {log.stage_from && log.stage_to && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <span className="px-2 py-0.5 bg-slate-100 rounded">{log.stage_from}</span>
                    <span>→</span>
                    <span className="px-2 py-0.5 bg-slate-200 rounded font-medium">{log.stage_to}</span>
                  </div>
                )}

                {/* Details */}
                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-600">
                    {Object.entries(log.details).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="text-slate-400">{key}:</span>
                        <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}