import React, { useState, useEffect } from 'react';
import { TrialBalanceItem, Masters, MappingSuggestion, NoteLineItem } from '../types.ts';
import * as geminiService from '../services/geminiService.ts';
import { WandIcon, CheckCircleIcon, PlusIcon } from './icons.tsx';

interface MappingPanelProps {
  ledger: TrialBalanceItem | undefined;
  masters: Masters;
  noteLineItems: NoteLineItem[];
  onMapLedger: (ledgerId: string, mapping: { majorHeadCode: string; minorHeadCode: string; groupingCode: string, noteLineItemId: string | null }) => void;
  onAddLineItem: (noteId: string, name: string) => void;
  token: string;
  readOnly?: boolean;
}

// Hardcoded list of groupings that support line item clubbing
const groupingsWithLineItems = ['C.20.07']; // Other Expenses

const noteIdMap: Record<string, string> = {
  'C.20.07': 'otherExpenses',
  // Add other mappings as needed
};


export const MappingPanel: React.FC<MappingPanelProps> = ({ ledger, masters, noteLineItems, onMapLedger, onAddLineItem, token, readOnly = false }) => {
  const [majorHead, setMajorHead] = useState('');
  const [minorHead, setMinorHead] = useState('');
  const [grouping, setGrouping] = useState('');
  const [noteLineItemId, setNoteLineItemId] = useState<string | null>(null);
  const [isCreatingLineItem, setIsCreatingLineItem] = useState(false);
  const [newLineItemName, setNewLineItemName] = useState('');
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState<MappingSuggestion | null>(null);

  useEffect(() => {
    // Reset or Populate form when ledger changes
    if (ledger) {
      if (ledger.isMapped && ledger.majorHeadCode) {
        // Pre-populate for editing
        setMajorHead(ledger.majorHeadCode);
        setMinorHead(ledger.minorHeadCode || '');
        setGrouping(ledger.groupingCode || '');
        setNoteLineItemId(ledger.noteLineItemId || null);
      } else {
        // Reset for new mapping
        setMajorHead('');
        setMinorHead('');
        setGrouping('');
        setNoteLineItemId(null);
      }
      setSuggestion(null);
      setIsCreatingLineItem(false);
      setNewLineItemName('');
    }
  }, [ledger]);

  const handleCreateLineItem = () => {
    if (!newLineItemName.trim() || !grouping) return;
    const noteId = noteIdMap[grouping];
    if (noteId) {
      onAddLineItem(noteId, newLineItemName);
      setIsCreatingLineItem(false);
      setNewLineItemName('');
    }
  };

  const handleGenerateSuggestion = async () => {
    if (!ledger) return;
    setIsLoadingSuggestion(true);
    setSuggestion(null);
    const result = await geminiService.getMappingSuggestion(token, ledger.ledger, masters);
    if (result) {
      setSuggestion(result);
    }
    setIsLoadingSuggestion(false);
  };

  const handleApplySuggestion = () => {
    if (suggestion) {
      setMajorHead(suggestion.majorHeadCode);
      const suggestedMinorHead = masters.minorHeads.find(mh => mh.code === suggestion.minorHeadCode);
      if (suggestedMinorHead?.majorHeadCode === suggestion.majorHeadCode) {
        setMinorHead(suggestion.minorHeadCode);
        const suggestedGrouping = masters.groupings.find(g => g.code === suggestion.groupingCode);
        if (suggestedGrouping?.minorHeadCode === suggestion.minorHeadCode) {
          setGrouping(suggestion.groupingCode);
        } else {
          setGrouping('');
        }
      } else {
        setMinorHead('');
        setGrouping('');
      }
      setNoteLineItemId(null); // Reset line item on new suggestion
    }
  };

  const handleMap = () => {
    if (ledger && majorHead && minorHead && grouping) {
      const requiresLineItem = groupingsWithLineItems.includes(grouping);
      if (requiresLineItem && !noteLineItemId) {
        alert("Please select a Line Item for this grouping.");
        return;
      }

      onMapLedger(ledger.id, {
        majorHeadCode: majorHead,
        minorHeadCode: minorHead,
        groupingCode: grouping,
        noteLineItemId: requiresLineItem ? noteLineItemId : null,
      });
    }
  };

  if (!ledger) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h3 className="text-lg font-semibold text-gray-300">No Ledger Selected</h3>
        <p className="text-sm text-gray-500 mt-1">Select a ledger from the "To Be Mapped" list to begin.</p>
      </div>
    );
  }

  const availableMinorHeads = masters.minorHeads.filter(mh => mh.majorHeadCode === majorHead);
  const availableGroupings = masters.groupings.filter(g => g.minorHeadCode === minorHead);

  const showLineItems = groupingsWithLineItems.includes(grouping);
  const relevantNoteId = noteIdMap[grouping];
  const availableLineItems = showLineItems ? noteLineItems.filter(item => item.noteId === relevantNoteId) : [];

  return (
    <div className="p-4 flex flex-col h-full">
      <h2 className="text-xl font-bold text-white mb-1">Map Ledger</h2>
      <p className="text-lg text-brand-blue-light font-semibold mb-4 truncate" title={ledger.ledger}>{ledger.ledger}</p>

      {/* AI Suggestion Section */}
      <div className="mb-6">
        <button
          onClick={handleGenerateSuggestion}
          disabled={isLoadingSuggestion || readOnly}
          className="w-full flex items-center justify-center bg-brand-blue hover:bg-brand-blue-dark disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          <WandIcon className="w-5 h-5 mr-2" />
          {isLoadingSuggestion ? 'Generating...' : 'Get AI Suggestion'}
        </button>
        {suggestion && (
          <div className="mt-4 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
            <h4 className="font-semibold text-gray-200 text-sm">AI Suggestion (Confidence: {(suggestion.confidence * 100).toFixed(0)}%)</h4>
            <p className="text-xs text-gray-400 mt-1 italic">"{suggestion.reasoning}"</p>
            <div className="text-sm mt-2 text-gray-300">
              {masters.majorHeads.find(m => m.code === suggestion.majorHeadCode)?.name} &gt; {masters.minorHeads.find(m => m.code === suggestion.minorHeadCode)?.name} &gt; {masters.groupings.find(m => m.code === suggestion.groupingCode)?.name}
            </div>
            <button onClick={handleApplySuggestion} disabled={readOnly} className="text-sm text-brand-blue-light hover:underline mt-2 disabled:text-gray-500 disabled:no-underline">Apply Suggestion</button>
          </div>
        )}
      </div>

      {/* Manual Mapping Section */}
      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-sm font-medium text-gray-400">Major Head</label>
          <select value={majorHead} onChange={e => { setMajorHead(e.target.value); setMinorHead(''); setGrouping(''); setNoteLineItemId(null); }} disabled={readOnly} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white disabled:bg-gray-800 disabled:cursor-not-allowed">
            <option value="">Select Major Head</option>
            {masters.majorHeads.map(mh => <option key={mh.code} value={mh.code}>{mh.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400">Minor Head</label>
          <select value={minorHead} onChange={e => { setMinorHead(e.target.value); setGrouping(''); setNoteLineItemId(null); }} disabled={!majorHead || readOnly} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white disabled:bg-gray-800 disabled:cursor-not-allowed">
            <option value="">Select Minor Head</option>
            {availableMinorHeads.map(mh => <option key={mh.code} value={mh.code}>{mh.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400">Grouping</label>
          <select value={grouping} onChange={e => { setGrouping(e.target.value); setNoteLineItemId(null); }} disabled={!minorHead || readOnly} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white disabled:bg-gray-800 disabled:cursor-not-allowed">
            <option value="">Select Grouping</option>
            {availableGroupings.map(g => <option key={g.code} value={g.code}>{g.name}</option>)}
          </select>
        </div>
        {showLineItems && (
          <div>
            <label className="block text-sm font-medium text-gray-400">Line Item (Clubbing)</label>
            <div className="flex space-x-2 mt-1">
              <select
                value={noteLineItemId || ''}
                onChange={e => setNoteLineItemId(e.target.value)}
                disabled={!grouping || readOnly}
                className="block w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white disabled:bg-gray-800 disabled:cursor-not-allowed"
              >
                <option value="">Select Line Item</option>
                {availableLineItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <button
                onClick={() => setIsCreatingLineItem(true)}
                disabled={!grouping || readOnly}
                className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-md p-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                title="Create New Line Item"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>

            {isCreatingLineItem && (
              <div className="mt-2 p-3 bg-gray-800 border border-gray-600 rounded-md animate-in fade-in slide-in-from-top-1">
                <label className="block text-xs font-medium text-gray-400 mb-1">New Line Item Name</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newLineItemName}
                    onChange={(e) => setNewLineItemName(e.target.value)}
                    placeholder="e.g. Rent"
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-md p-1.5 text-sm text-white"
                    autoFocus
                  />
                  <button
                    onClick={handleCreateLineItem}
                    disabled={!newLineItemName.trim()}
                    className="bg-brand-blue hover:bg-brand-blue-dark text-white px-3 py-1 rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setIsCreatingLineItem(false); setNewLineItemName(''); }}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">Group multiple ledgers under a single line item in the notes.</p>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="mt-auto pt-4">
        <button
          onClick={handleMap}
          disabled={!majorHead || !minorHead || !grouping || (showLineItems && !noteLineItemId) || readOnly}
          className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2.5 px-4 rounded-md transition-colors"
        >
          <CheckCircleIcon className="w-5 h-5 mr-2" />
          {ledger?.isMapped ? 'Update Mapping' : 'Confirm Mapping'}
        </button>
      </div>
    </div>
  );
};