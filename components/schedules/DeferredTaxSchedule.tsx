// components/schedules/DeferredTaxSchedule.tsx
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DeferredTaxData, DeferredTaxRow } from '../../types.ts';
import { PlusIcon, TrashIcon } from '../icons.tsx';

interface DeferredTaxScheduleProps {
    data: DeferredTaxData;
    onUpdate: (data: DeferredTaxData) => void;
    isFinalized: boolean;
}

const TaxTable: React.FC<{
    title: string;
    rows: DeferredTaxRow[];
    type: 'assets' | 'liabilities';
    onUpdate: (type: 'assets' | 'liabilities', id: string, field: keyof Omit<DeferredTaxRow, 'id' | 'closingBalance'>, value: string) => void;
    onAdd: (type: 'assets' | 'liabilities') => void;
    onRemove: (type: 'assets' | 'liabilities', id: string) => void;
    isFinalized: boolean;
}> = ({ title, rows, type, onUpdate, onAdd, onRemove, isFinalized }) => {

    const renderCell = (row: DeferredTaxRow, field: 'openingBalance' | 'pnlCharge') => (
        <td className="p-0 border-l border-gray-600">
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
                            <th className="p-2 text-left font-medium w-2/5">Particulars</th>
                            <th className="p-2 text-right font-medium">Opening</th>
                            <th className="p-2 text-right font-medium">Charge/(Credit) to P&L</th>
                            <th className="p-2 text-right font-medium">Closing</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                        {rows.map(row => {
                            const parse = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;
                            const closing = parse(row.openingBalance) + parse(row.pnlCharge);
                            return (
                                <tr key={row.id}>
                                    <td className="p-0 flex items-center">
                                        {!isFinalized && <button onClick={() => onRemove(type, row.id)} className="p-2 text-gray-500 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>}
                                        <input type="text" value={row.particular} onChange={e => onUpdate(type, row.id, 'particular', e.target.value)} disabled={isFinalized} className="w-full bg-transparent p-2 border-none focus:ring-0 focus:outline-none focus:bg-gray-700/50"/>
                                    </td>
                                    {renderCell(row, 'openingBalance')}
                                    {renderCell(row, 'pnlCharge')}
                                    <td className="p-2 text-right font-mono bg-gray-800/50 border-l border-gray-600">{closing.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {!isFinalized && <button onClick={() => onAdd(type)} className="mt-2 flex items-center text-sm text-brand-blue-light hover:text-white"><PlusIcon className="w-4 h-4 mr-1"/> Add Row</button>}
        </div>
    );
};

export const DeferredTaxSchedule: React.FC<DeferredTaxScheduleProps> = ({ data, onUpdate, isFinalized }) => {

    const handleUpdate = (type: 'assets' | 'liabilities', id: string, field: keyof Omit<DeferredTaxRow, 'id' | 'closingBalance'>, value: string) => {
        onUpdate({ ...data, [type]: data[type].map(r => r.id === id ? { ...r, [field]: value } : r) });
    };

    const addRow = (type: 'assets' | 'liabilities') => {
        const newRow: DeferredTaxRow = { id: uuidv4(), particular: '', openingBalance: '0', pnlCharge: '0', closingBalance: '0' };
        onUpdate({ ...data, [type]: [...data[type], newRow] });
    };

    const removeRow = (type: 'assets' | 'liabilities', id: string) => {
        onUpdate({ ...data, [type]: data[type].filter(r => r.id !== id) });
    };
    
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Deferred Tax (Net)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <TaxTable title="Deferred Tax Assets" rows={data.assets} type="assets" onUpdate={handleUpdate} onAdd={addRow} onRemove={removeRow} isFinalized={isFinalized} />
                <TaxTable title="Deferred Tax Liabilities" rows={data.liabilities} type="liabilities" onUpdate={handleUpdate} onAdd={addRow} onRemove={removeRow} isFinalized={isFinalized} />
            </div>
        </div>
    );
};