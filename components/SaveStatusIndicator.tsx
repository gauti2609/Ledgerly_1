import React from 'react';
import { SaveStatus } from '../hooks/useDebouncedSave.ts';
import { CheckCircleIcon, CloudArrowUpIcon, ExclamationCircleIcon } from './icons.tsx';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({ status }) => {
  const statusConfig = {
    unsaved: { text: 'Unsaved changes...', icon: <span className="w-4 h-4 rounded-full bg-yellow-500 inline-block animate-pulse"></span>, color: 'text-yellow-400' },
    saving: { text: 'Saving...', icon: <CloudArrowUpIcon className="w-5 h-5 animate-pulse" />, color: 'text-blue-400' },
    saved: { text: 'All changes saved', icon: <CheckCircleIcon className="w-5 h-5" />, color: 'text-green-400' },
    error: { text: 'Save failed', icon: <ExclamationCircleIcon className="w-5 h-5" />, color: 'text-red-400' },
    idle: { text: '', icon: null, color: '' },
  };

  const currentStatus = statusConfig[status];

  if (status === 'idle') return null;

  return (
    <div className={`flex items-center space-x-2 text-sm ${currentStatus.color}`}>
      {currentStatus.icon}
      <span>{currentStatus.text}</span>
    </div>
  );
};