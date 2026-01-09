import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function stringToColor(str) {
  if (!str) return '#94A3B8'; // gray for unassigned
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', 
    '#F59E0B', '#10B981', '#06B6D4', '#6366F1'
  ];
  
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name) {
  if (!name) return '?';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

export default function UserAvatar({ assignedTo, size = 'default' }) {
  const isUnassigned = !assignedTo;
  const initials = getInitials(assignedTo);
  const bgColor = stringToColor(assignedTo);
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    default: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm'
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`}
            style={{ backgroundColor: isUnassigned ? '#94A3B8' : bgColor }}
          >
            {initials}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            {isUnassigned ? 'Unassigned' : `Assigned to: ${assignedTo}`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}