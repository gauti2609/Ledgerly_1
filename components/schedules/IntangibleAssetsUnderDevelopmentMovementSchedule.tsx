// components/schedules/IntangibleAssetsUnderDevelopmentMovementSchedule.tsx
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CWIPRow } from '../../types.ts';
import { PlusIcon, TrashIcon } from '../icons.tsx';

interface IntangibleAssetsUnderDevelopmentMovementScheduleProps {
    data: CWIPRow[];
    onUpdate: (data: CWIPRow[]) => void;
    isFinalized: boolean;
}

export const IntangibleAssetsUnderDevelopmentMovementSchedule: React.FC<IntangibleAssetsUnderDevelopmentMovementScheduleProps> = ({ data, onUpdate, isFinalized }) => {

    const handleUpdate = (id: string, field: keyof Omit<CWIPRow, 'id'>, value: string) => {
        onUpdate(data.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const addRow = () => {
        const newRow: CWIPRow = { id: uuidv4(), particular: '', opening: '', additions: '', capitalized: '', closing: '' };
        onUpdate([...data, newRow]);
    };

    const removeRow = (id: string) => {
        onUpdate(data.filter(row => row.id !== id));
    };
    
    // Using a generic cell renderer
    const renderCell = (row: CWIPRow, field: keyof Omit<CWIPRow, 'id' | 'closing' | 'particular'>) => (
        <td className="p-0">
            <input
                type="text"
                value={row[field]}
                onChange={e => handleUpdate(row.id, field, e.target.value)}
                disabled={isFinalized}
                className="w-full h-full bg-transparent p-2 text-right border-none focus:ring-0 focus:outline-none focus:bg-gray-700/50"
            />
        </td>
    );

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Intangible Assets Under Development - Movement</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm border border-gray-600">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="p-2 text-left font-medium w-2/5">Particulars</th>
                            <th className="p-2 text-right font-medium">Opening</th>
                            <th className="p-2 text-right font-medium">Additions</th>
                            <th className="p-2 text-right font-medium">Capitalized/Amortized</th>
                            <th className="p-2 text-right font-medium">Closing</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                        {data.map(row => {
                            const parse = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;
                            const closing = parse(row.opening) + parse(row.additions) - parse(row.capitalized);
                            return (
                                <tr key={row.id}>
                                    <td className="p-0 flex items-center">
                                        {!isFinalized && <button onClick={() => removeRow(row.id)} className="p-2 text-gray-500 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>}
                                        <input type="text" value={row.particular} onChange={e => handleUpdate(row.id, 'particular', e.target.value)} disabled={isFinalized} className="w-full bg-transparent p-2 border-none focus:ring-0 focus:outline-none focus:bg-gray-700/50"/>
                                    </td>
                                    {renderCell(row, 'opening')}
                                    {renderCell(row, 'additions')}
                                    {renderCell(row, 'capitalized')}
                                    <td className="p-2 text-right font-mono bg-gray-800/50">{closing.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {!isFinalized && <button onClick={addRow} className="mt-4 flex items-center text-sm text-brand-blue-light"><PlusIcon className="w-4 h-4 mr-2"/>Add Item</button>}
        </div>
    );
};
