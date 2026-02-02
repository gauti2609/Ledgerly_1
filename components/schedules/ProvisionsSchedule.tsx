// components/schedules/ProvisionsSchedule.tsx
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ProvisionsData, ProvisionReconciliationRow } from '../../types.ts';
import { PlusIcon, TrashIcon } from '../icons.tsx';

interface ProvisionsScheduleProps {
    data: ProvisionsData;
    onUpdate: (data: ProvisionsData) => void;
    isFinalized: boolean;
}

const ProvisionTable: React.FC<{
    title: string;
    rows: ProvisionReconciliationRow[];
    type: 'longTerm' | 'shortTerm';
    onUpdate: (type: 'longTerm' | 'shortTerm', id: string, field: keyof Omit<ProvisionReconciliationRow, 'id' | 'closing'>, value: string) => void;
    onAdd: (type: 'longTerm' | 'shortTerm') => void;
    onRemove: (type: 'longTerm' | 'shortTerm', id: string) => void;
    isFinalized: boolean;
}> = ({ title, rows, type, onUpdate, onAdd, onRemove, isFinalized }) => {

    const renderCell = (row: ProvisionReconciliationRow, field: 'opening' | 'additions' | 'usedOrReversed') => (
        <td className="p-0">
            <input
                type="text"
                value={row[field]}
                onChange={e => onUpdate(type, row.id, field, e.target.value)}
                disabled={isFinalized}
                className="w-full h-full bg-transparent p-2 text-right border-none focus:ring-0 focus:outline-none focus:bg-gray-700/50"
            />
        </td>
    );

    return (
        <div>
            <h4 className="text-md font-semibold text-gray-300 mb-2">{title}</h4>
            <div className="overflow-x-auto border border-gray-600 rounded-lg">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="p-2 text-left font-medium w-2/5">Provision</th>
                            <th className="p-2 text-right font-medium">Opening Balance</th>
                            <th className="p-2 text-right font-medium">Additions</th>
                            <th className="p-2 text-right font-medium">Used / Reversed</th>
                            <th className="p-2 text-right font-medium">Closing Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                        {rows.map(row => {
                            const parse = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;
                            const closing = parse(row.opening) + parse(row.additions) - parse(row.usedOrReversed);
                            return (
                                <tr key={row.id}>
                                    <td className="p-0 flex items-center">
                                        {!isFinalized && <button onClick={() => onRemove(type, row.id)} className="p-2 text-gray-500 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>}
                                        <input type="text" value={row.provisionName} onChange={e => onUpdate(type, row.id, 'provisionName', e.target.value)} disabled={isFinalized} className="w-full bg-transparent p-2 border-none focus:ring-0 focus:outline-none focus:bg-gray-700/50"/>
                                    </td>
                                    {renderCell(row, 'opening')}
                                    {renderCell(row, 'additions')}
                                    {renderCell(row, 'usedOrReversed')}
                                    <td className="p-2 text-right font-mono bg-gray-800/50">{closing.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {!isFinalized && <button onClick={() => onAdd(type)} className="mt-2 flex items-center text-sm text-brand-blue-light hover:text-white"><PlusIcon className="w-4 h-4 mr-1"/> Add Provision</button>}
        </div>
    );
};

export const ProvisionsSchedule: React.FC<ProvisionsScheduleProps> = ({ data, onUpdate, isFinalized }) => {

    const handleUpdate = (type: 'longTerm' | 'shortTerm', id: string, field: keyof Omit<ProvisionReconciliationRow, 'id' | 'closing'>, value: string) => {
        onUpdate({ ...data, [type]: data[type].map(r => r.id === id ? { ...r, [field]: value } : r) });
    };

    const addRow = (type: 'longTerm' | 'shortTerm') => {
        const newRow: ProvisionReconciliationRow = { id: uuidv4(), provisionName: '', opening: '0', additions: '0', usedOrReversed: '0', closing: '0' };
        onUpdate({ ...data, [type]: [...data[type], newRow] });
    };

    const removeRow = (type: 'longTerm' | 'shortTerm', id: string) => {
        onUpdate({ ...data, [type]: data[type].filter(r => r.id !== id) });
    };

    return (
        <div className="space-y-8">
            <h3 className="text-lg font-semibold text-white">AS 29: Provisions - Reconciliation</h3>
            <ProvisionTable 
                title="Long-Term Provisions" 
                rows={data.longTerm} 
                type="longTerm" 
                onUpdate={handleUpdate} 
                onAdd={addRow} 
                onRemove={removeRow} 
                isFinalized={isFinalized}
            />
             <ProvisionTable 
                title="Short-Term Provisions" 
                rows={data.shortTerm} 
                type="shortTerm" 
                onUpdate={handleUpdate} 
                onAdd={addRow} 
                onRemove={removeRow} 
                isFinalized={isFinalized}
            />
        </div>
    );
};