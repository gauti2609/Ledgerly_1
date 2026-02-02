import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AssetAgeingRow } from '../../types.ts';
import { PlusIcon, TrashIcon } from '../icons.tsx';

interface CWIPAgeingScheduleProps {
    data: AssetAgeingRow[];
    onUpdate: (data: AssetAgeingRow[]) => void;
    isFinalized: boolean;
}

export const CWIPAgeingSchedule: React.FC<CWIPAgeingScheduleProps> = ({ data, onUpdate, isFinalized }) => {

    const handleUpdate = (id: string, field: keyof Omit<AssetAgeingRow, 'id'>, value: string) => {
        onUpdate(data.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const addRow = () => {
        const newRow: AssetAgeingRow = { id: uuidv4(), particular: '', lessThan1Year: '', '1To2Years': '', '2To3Years': '', moreThan3Years: '' };
        onUpdate([...data, newRow]);
    };

    const removeRow = (id: string) => {
        onUpdate(data.filter(item => item.id !== id));
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Capital Work-in-Progress Ageing</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm border border-gray-600">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="p-2 text-left font-medium w-2/5">Project</th>
                            <th className="p-2 text-right font-medium">&lt; 1 Year</th>
                            <th className="p-2 text-right font-medium">1-2 Years</th>
                            <th className="p-2 text-right font-medium">2-3 Years</th>
                            <th className="p-2 text-right font-medium">&gt; 3 Years</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                         {data.map(row => (
                            <tr key={row.id}>
                                <td className="p-0 flex items-center">
                                    {!isFinalized && <button onClick={() => removeRow(row.id)} className="p-2 text-gray-500 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>}
                                    <input type="text" value={row.particular} onChange={e => handleUpdate(row.id, 'particular', e.target.value)} disabled={isFinalized} className="w-full bg-transparent p-2 border-none focus:ring-0 focus:outline-none focus:bg-gray-700/50"/>
                                </td>
                                <td className="p-0"><input type="text" value={row.lessThan1Year} onChange={e => handleUpdate(row.id, 'lessThan1Year', e.target.value)} disabled={isFinalized} className="w-full bg-transparent p-2 text-right border-none focus:ring-0 focus:outline-none focus:bg-gray-700/50"/></td>
                                <td className="p-0"><input type="text" value={row['1To2Years']} onChange={e => handleUpdate(row.id, '1To2Years', e.target.value)} disabled={isFinalized} className="w-full bg-transparent p-2 text-right border-none focus:ring-0 focus:outline-none focus:bg-gray-700/50"/></td>
                                <td className="p-0"><input type="text" value={row['2To3Years']} onChange={e => handleUpdate(row.id, '2To3Years', e.target.value)} disabled={isFinalized} className="w-full bg-transparent p-2 text-right border-none focus:ring-0 focus:outline-none focus:bg-gray-700/50"/></td>
                                <td className="p-0"><input type="text" value={row.moreThan3Years} onChange={e => handleUpdate(row.id, 'moreThan3Years', e.target.value)} disabled={isFinalized} className="w-full bg-transparent p-2 text-right border-none focus:ring-0 focus:outline-none focus:bg-gray-700/50"/></td>
                            </tr>
                         ))}
                    </tbody>
                </table>
            </div>
             {!isFinalized && (
                <button onClick={addRow} className="mt-4 flex items-center text-sm text-brand-blue-light hover:text-white transition-colors font-medium">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Project
                </button>
            )}
        </div>
    );
};