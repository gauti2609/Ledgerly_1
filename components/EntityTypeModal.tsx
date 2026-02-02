import React, { useState } from 'react';
import { EntityType } from '../types.ts';

interface EntityTypeModalProps {
  isOpen: boolean;
  onSelect: (type: EntityType) => void;
}

export const EntityTypeModal: React.FC<EntityTypeModalProps> = ({ isOpen, onSelect }) => {
  const [selectedType, setSelectedType] = useState<EntityType>('Company');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 w-full max-w-md">
        <header className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-gray-100">Select Entity Type</h2>
        </header>
        <main className="p-6">
          <p className="text-gray-300 mb-4">Please select the type of entity for which you are preparing financial statements. This will tailor the application to the correct format and disclosure requirements.</p>
          <div className="space-y-3">
            <label className="flex items-center p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
              <input 
                type="radio" 
                name="entityType" 
                value="Company" 
                checked={selectedType === 'Company'}
                onChange={() => setSelectedType('Company')}
                className="h-4 w-4 text-brand-blue bg-gray-600 border-gray-500 focus:ring-brand-blue"
              />
              <span className="ml-3 text-gray-200">Company (as per Schedule III)</span>
            </label>
            <label className="flex items-center p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
              <input 
                type="radio" 
                name="entityType" 
                value="LLP" 
                checked={selectedType === 'LLP'}
                onChange={() => setSelectedType('LLP')}
                className="h-4 w-4 text-brand-blue bg-gray-600 border-gray-500 focus:ring-brand-blue"
              />
              <span className="ml-3 text-gray-200">Limited Liability Partnership (LLP)</span>
            </label>
            <label className="flex items-center p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
              <input 
                type="radio" 
                name="entityType" 
                value="Non-Corporate" 
                checked={selectedType === 'Non-Corporate'}
                onChange={() => setSelectedType('Non-Corporate')}
                className="h-4 w-4 text-brand-blue bg-gray-600 border-gray-500 focus:ring-brand-blue"
              />
              <span className="ml-3 text-gray-200">Non-Corporate Entity</span>
            </label>
          </div>
        </main>
        <footer className="p-4 bg-gray-800/50 border-t border-gray-700 flex justify-end items-center">
          <button onClick={() => onSelect(selectedType)} className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
            Confirm and Continue
          </button>
        </footer>
      </div>
    </div>
  );
};