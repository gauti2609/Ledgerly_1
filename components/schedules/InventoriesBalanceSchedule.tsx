import React from 'react';
import { v4 as uuidv4 } from 'uuid';
// FIX: Add file extension to fix module resolution error.
import { InventoryBalanceRow, ScheduleData } from '../../types.ts';
import { PlusIcon, TrashIcon } from '../icons.tsx';

interface InventoriesBalanceScheduleProps {
    data: InventoryBalanceRow[];
    valuationMode: string;
    onUpdate: React.Dispatch<React.SetStateAction<ScheduleData>>;
    isFinalized: boolean;
}

export const InventoriesBalanceSchedule: React.FC<InventoriesBalanceScheduleProps> = ({ data, valuationMode, onUpdate, isFinalized }) => {

    const handleUpdate = (id: string, field: keyof Omit<InventoryBalanceRow, 'id'>, value: string) => {
        onUpdate(prev => ({ ...prev, inventories: prev.inventories.map(row => row.id === id ? { ...row, [field]: value } : row) }));
    };

    const handleValuationUpdate = (value: string) => {
        onUpdate(prev => ({ ...prev, inventoriesValuationMode: value }));
    }

    const addRow = () => {
        const newRow: InventoryBalanceRow = { id: uuidv4(), item: '', amountCy: '', amountPy: '' };
        onUpdate(prev => ({ ...prev, inventories: [...prev.inventories, newRow] }));
    };

    const removeRow = (id: string) => {
        onUpdate(prev => ({ ...prev, inventories: prev.inventories.filter(row => row.id !== id) }));
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white">Inventories (Balance Sheet Note)</h3>
                <div className="mt-4">
                     <label className="block text-sm font-medium text-gray-400">Mode of Valuation</label>
                     <input
                        type="text"
                        value={valuationMode}
                        onChange={(e) => handleValuationUpdate(e.target.value)}
                        disabled={isFinalized}
                        className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white disabled:bg-gray-800 disabled:cursor-not-allowed"
                        placeholder="e.g., At cost or Net Realisable Value, whichever is lower."
                    />
                </div>
            </div>

            <div className="space-y-2">
                {data.map(item => (
                    <div key={item.id} className="flex items-center space-x-2 bg-gray-900/50 p-2 rounded-lg">
                        <input type="text" placeholder="e.g., Raw Materials, Goods-in-transit" value={item.item} onChange={e => handleUpdate(item.id, 'item', e.target.value)} disabled={isFinalized} className="flex-1 bg-gray-700 p-2 rounded-md"/>
                        <input type="text" placeholder="Amount CY" value={item.amountCy} onChange={e => handleUpdate(item.id, 'amountCy', e.target.value)} disabled={isFinalized} className="w-1/4 bg-gray-700 p-2 rounded-md"/>
                        <input type="text" placeholder="Amount PY" value={item.amountPy} onChange={e => handleUpdate(item.id, 'amountPy', e.target.value)} disabled={isFinalized} className="w-1/4 bg-gray-700 p-2 rounded-md"/>
                        {!isFinalized && <button onClick={() => removeRow(item.id)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>}
                    </div>
                ))}
            </div>
             {!isFinalized && (
                <button onClick={addRow} className="mt-4 flex items-center text-sm text-brand-blue-light hover:text-white transition-colors font-medium">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Inventory Type
                </button>
            )}
        </div>
    );
};