
import React from 'react';
// FIX: Add file extensions to fix module resolution errors.
import { CloseIcon } from './icons.tsx';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
  confirmButtonClass?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirm',
  confirmButtonClass = 'bg-red-600 hover:bg-red-700',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 w-full max-w-md">
        <header className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-100">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-6">
          <p className="text-gray-300">{message}</p>
        </main>
        <footer className="p-4 bg-gray-800/50 border-t border-gray-700 flex justify-end items-center space-x-3">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
            Cancel
          </button>
          <button onClick={onConfirm} className={`${confirmButtonClass} text-white font-bold py-2 px-4 rounded-md transition-colors text-sm`}>
            {confirmButtonText}
          </button>
        </footer>
      </div>
    </div>
  );
};