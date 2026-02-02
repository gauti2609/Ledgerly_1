import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GenericScheduleItem, NoteLineItem, AllData } from '../../types.ts';
import { GenericSchedule } from './GenericSchedule.tsx';
import { PlusIcon, TrashIcon } from '../icons.tsx';

interface OtherExpensesScheduleProps {
    data: GenericScheduleItem[];
    onUpdate: (data: GenericScheduleItem[]) => void;
    setAllData: (setter: React.SetStateAction<AllData | null>) => void;
    noteLineItems: NoteLineItem[];
    isFinalized: boolean;
    trialBalanceData?: any[];
}

const noteId = 'otherExpenses';

export const OtherExpensesSchedule: React.FC<OtherExpensesScheduleProps> = ({ data, onUpdate, setAllData, noteLineItems, isFinalized, trialBalanceData }) => {

    const relevantLineItems = noteLineItems.filter(item => item.noteId === noteId);

    const handleAddLineItem = () => {
        const newItem: NoteLineItem = { id: uuidv4(), noteId: noteId, name: '' };
        setAllData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                scheduleData: {
                    ...prev.scheduleData,
                    noteLineItems: [...prev.scheduleData.noteLineItems, newItem]
                }
            };
        });
    };

    const handleUpdateLineItem = (id: string, name: string) => {
        setAllData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                scheduleData: {
                    ...prev.scheduleData,
                    noteLineItems: prev.scheduleData.noteLineItems.map(item => item.id === id ? { ...item, name } : item)
                }
            };
        });
    };

    const handleRemoveLineItem = (id: string) => {
        // FIX: Correctly update both scheduleData and trialBalanceData using setAllData.
        setAllData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                scheduleData: {
                    ...prev.scheduleData,
                    noteLineItems: prev.scheduleData.noteLineItems.filter(item => item.id !== id),
                },
                // Also un-map any trial balance items that were mapped to this line item
                trialBalanceData: prev.trialBalanceData.map(tb => tb.noteLineItemId === id ? { ...tb, isMapped: false, majorHeadCode: null, minorHeadCode: null, groupingCode: null, noteLineItemId: null } : tb)
            };
        });
    };

    return (
        <div className="space-y-8">
            <div className="p-4 bg-gray-900/50 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Manage Line Items for Other Expenses</h3>
                <p className="text-sm text-gray-400 mb-4">Create custom groupings for your Other Expenses note. Ledgers from the trial balance will be mapped to these items.</p>
                <div className="space-y-2">
                    {relevantLineItems.map(item => (
                        <div key={item.id} className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={item.name}
                                onChange={e => handleUpdateLineItem(item.id, e.target.value)}
                                disabled={isFinalized}
                                placeholder="e.g., Rent, Legal & Professional Fees"
                                className="flex-1 bg-gray-700 p-2 rounded-md"
                            />
                            {!isFinalized && (
                                <button onClick={() => handleRemoveLineItem(item.id)} className="p-2 text-gray-400 hover:text-red-400">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                {!isFinalized && (
                    <button onClick={handleAddLineItem} className="mt-4 flex items-center text-sm text-brand-blue-light hover:text-white transition-colors font-medium">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Add Line Item
                    </button>
                )}
            </div>

            <GenericSchedule
                title="Other Expenses (Direct Mapping - for items not requiring sub-grouping)"
                data={data}
                onUpdate={onUpdate}
                isFinalized={isFinalized}
                trialBalanceData={trialBalanceData}
            />
        </div>
    );
};