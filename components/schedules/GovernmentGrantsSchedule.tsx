// components/schedules/GovernmentGrantsSchedule.tsx
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GovernmentGrantsData, GovernmentGrantItem } from '../../types.ts';
import { PlusIcon, TrashIcon } from '../icons.tsx';

interface GovernmentGrantsScheduleProps {
    data: GovernmentGrantsData;
    onUpdate: (data: GovernmentGrantsData) => void;
    isFinalized: boolean;
}

export const GovernmentGrantsSchedule: React.FC<GovernmentGrantsScheduleProps> = ({ data, onUpdate, isFinalized }) => {

    const handleUpdate = (id: string, field: keyof Omit<GovernmentGrantItem, 'id'>, value: string) => {
        onUpdate({ items: data.items.map(item => item.id === id ? { ...item, [field]: value } : item) });
    };

    const addRow = () => {
        const newRow: GovernmentGrantItem = { id: uuidv4(), nature: '', amountRecognised: '', policy: '' };
        onUpdate({ items: [...data.items, newRow] });
    };

    const removeRow = (id: string) => {
        onUpdate({ items: data.items.filter(item => item.id !== id) });
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">AS 12: Government Grants</h3>
            <p className="text-sm text-gray-400">Enter details for government grants recognised in the financial statements.</p>
            
            <div className="space-y-4">
                {data.items.map(item => (
                    <div key={item.id} className="bg-gray-900/50 p-4 rounded-lg space-y-3 relative">
                         {!isFinalized && (
                             <button onClick={() => removeRow(item.id)} className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-400">
                                <TrashIcon className="w-4 h-4"/>
                            </button>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Nature of Grant" value={item.nature} onChange={v => handleUpdate(item.id, 'nature', v)} disabled={isFinalized} />
                            <InputField label="Amount Recognised" value={item.amountRecognised} onChange={v => handleUpdate(item.id, 'amountRecognised', v)} disabled={isFinalized} />
                        </div>
                        <InputField label="Accounting Policy Adopted" value={item.policy} onChange={v => handleUpdate(item.id, 'policy', v)} disabled={isFinalized} />
                    </div>
                ))}
            </div>

            {!isFinalized && (
                <button onClick={addRow} className="mt-4 flex items-center text-sm text-brand-blue-light hover:text-white transition-colors font-medium">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Grant
                </button>
            )}
             {data.items.length === 0 && <p className="text-sm text-gray-500">No government grants added.</p>}
        </div>
    );
};

const InputField: React.FC<{ label: string; value: string; onChange: (value: string) => void; disabled: boolean; }> = 
({ label, value, onChange, disabled }) => (
    <div>
        <label className="block text-xs font-medium text-gray-400">{label}</label>
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white text-sm disabled:bg-gray-800 disabled:cursor-not-allowed"
        />
    </div>
);
