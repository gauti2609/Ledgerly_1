

import React from 'react';
import { v4 as uuidv4 } from 'uuid';
// FIX: Add file extension to fix module resolution error.
import { ContingentLiability, ScheduleData } from '../../types.ts';
import { PlusIcon, TrashIcon } from '../icons.tsx';

interface ContingentLiabilitiesScheduleProps {
    data: ContingentLiability[];
    onUpdate: React.Dispatch<React.SetStateAction<ScheduleData>>;
    isFinalized: boolean;
}

export const ContingentLiabilitiesSchedule: React.FC<ContingentLiabilitiesScheduleProps> = ({ data, onUpdate, isFinalized }) => {

    const handleUpdate = (id: string, field: keyof Omit<ContingentLiability, 'id'>, value: string) => {
        onUpdate(prev => ({ ...prev, contingentLiabilities: prev.contingentLiabilities.map(row => row.id === id ? { ...row, [field]: value } : row) }));
    };

    const addRow = () => {
        const newRow: ContingentLiability = { id: uuidv4(), nature: '', amountCy: '', amountPy: '' };
        onUpdate(prev => ({ ...prev, contingentLiabilities: [...prev.contingentLiabilities, newRow] }));
    };

    const removeRow = (id: string) => {
        onUpdate(prev => ({ ...prev, contingentLiabilities: prev.contingentLiabilities.filter(row => row.id !== id) }));
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Contingent Liabilities and Commitments</h3>
            <div className="space-y-2">
                {data.map(item => (
                    <div key={item.id} className="flex items-center space-x-2 bg-gray-900/50 p-2 rounded-lg">
                        <input type="text" placeholder="Nature of Liability/Commitment" value={item.nature} onChange={e => handleUpdate(item.id, 'nature', e.target.value)} disabled={isFinalized} className="flex-1 bg-gray-700 p-2 rounded-md"/>
                        <input type="text" placeholder="Amount CY" value={item.amountCy} onChange={e => handleUpdate(item.id, 'amountCy', e.target.value)} disabled={isFinalized} className="w-1/6 bg-gray-700 p-2 rounded-md"/>
                        <input type="text" placeholder="Amount PY" value={item.amountPy} onChange={e => handleUpdate(item.id, 'amountPy', e.target.value)} disabled={isFinalized} className="w-1/6 bg-gray-700 p-2 rounded-md"/>
                        {!isFinalized && <button onClick={() => removeRow(item.id)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>}
                    </div>
                ))}
            </div>
             {!isFinalized && (
                <button onClick={addRow} className="mt-4 flex items-center text-sm text-brand-blue-light hover:text-white transition-colors font-medium">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Liability
                </button>
            )}
            {data.length === 0 && <p className="text-sm text-gray-500">No contingent liabilities recorded.</p>}
        </div>
    );
};