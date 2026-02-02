
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
// FIX: Add file extension to fix module resolution error.
import { ChangesInInventoriesData, ScheduleData, InventoryRow } from '../../types.ts';
import { PlusIcon, TrashIcon } from '../icons.tsx';

interface CostOfMaterialsConsumedScheduleProps {
    data: ChangesInInventoriesData;
    onUpdate: React.Dispatch<React.SetStateAction<ScheduleData>>;
    isFinalized: boolean;
}

const InventoryTable: React.FC<{
    title: string;
    rows: InventoryRow[];
    onUpdate: (type: 'opening' | 'closing', id: string, field: 'name' | 'amountCy' | 'amountPy', value: string) => void;
    onAdd: (type: 'opening' | 'closing') => void;
    onRemove: (type: 'opening' | 'closing', id: string) => void;
    type: 'opening' | 'closing';
    isFinalized: boolean;
}> = ({ title, rows, onUpdate, onAdd, onRemove, type, isFinalized }) => (
    <div>
        <h4 className="text-md font-semibold text-gray-300 mb-2">{title}</h4>
        <div className="space-y-2">
            {rows.map(row => (
                <div key={row.id} className="flex items-center space-x-2">
                    <input type="text" placeholder="Material Name" value={row.name} onChange={e => onUpdate(type, row.id, 'name', e.target.value)} disabled={isFinalized} className="w-1/2 bg-gray-700 p-2 rounded-md"/>
                    <input type="text" placeholder="Amount (CY)" value={row.amountCy} onChange={e => onUpdate(type, row.id, 'amountCy', e.target.value)} disabled={isFinalized} className="w-1/4 bg-gray-700 p-2 rounded-md"/>
                    <input type="text" placeholder="Amount (PY)" value={row.amountPy} onChange={e => onUpdate(type, row.id, 'amountPy', e.target.value)} disabled={isFinalized} className="w-1/4 bg-gray-700 p-2 rounded-md"/>
                    {!isFinalized && <button onClick={() => onRemove(type, row.id)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>}
                </div>
            ))}
        </div>
        {!isFinalized && <button onClick={() => onAdd(type)} className="mt-2 flex items-center text-sm text-brand-blue-light hover:text-white"><PlusIcon className="w-4 h-4 mr-1"/> Add Row</button>}
    </div>
);


export const CostOfMaterialsConsumedSchedule: React.FC<CostOfMaterialsConsumedScheduleProps> = ({ data, onUpdate, isFinalized }) => {

    const handleUpdate = (type: 'opening' | 'closing', id: string, field: 'name' | 'amountCy' | 'amountPy', value: string) => {
        onUpdate(prev => ({ ...prev, costOfMaterialsConsumed: { ...prev.costOfMaterialsConsumed, [type]: prev.costOfMaterialsConsumed[type].map(r => r.id === id ? { ...r, [field]: value } : r) }}));
    };

    const addRow = (type: 'opening' | 'closing') => {
        const newRow: InventoryRow = { id: uuidv4(), name: '', amountCy: '', amountPy: '' };
        onUpdate(prev => ({ ...prev, costOfMaterialsConsumed: { ...prev.costOfMaterialsConsumed, [type]: [...prev.costOfMaterialsConsumed[type], newRow] }}));
    };

    const removeRow = (type: 'opening' | 'closing', id: string) => {
        onUpdate(prev => ({ ...prev, costOfMaterialsConsumed: { ...prev.costOfMaterialsConsumed, [type]: prev.costOfMaterialsConsumed[type].filter(r => r.id !== id) }}));
    };
    
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Cost of Materials Consumed</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InventoryTable title="Opening Stock" rows={data.opening} onUpdate={handleUpdate} onAdd={addRow} onRemove={removeRow} type="opening" isFinalized={isFinalized}/>
                <InventoryTable title="Closing Stock" rows={data.closing} onUpdate={handleUpdate} onAdd={addRow} onRemove={removeRow} type="closing" isFinalized={isFinalized}/>
            </div>
        </div>
    );
};
