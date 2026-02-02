// components/schedules/OtherEquitySchedule.tsx
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { OtherEquityItem } from '../../types.ts';
import { PlusIcon, TrashIcon } from '../icons.tsx';
import { FormattedInput } from '../FormattedInput.tsx';
import { useNumberFormat } from '../../context/NumberFormatContext.tsx';

interface OtherEquityScheduleProps {
    data: OtherEquityItem[];
    onUpdate: (data: OtherEquityItem[]) => void;
    isFinalized: boolean;
}

export const OtherEquitySchedule: React.FC<OtherEquityScheduleProps> = ({ data, onUpdate, isFinalized }) => {
    const { formatAmount } = useNumberFormat();

    const handleUpdate = (id: string, field: keyof Omit<OtherEquityItem, 'id'>, value: string) => {
        onUpdate(data.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const addRow = () => {
        const newRow: OtherEquityItem = { id: uuidv4(), reserveName: '', opening: '', additions: '', deductions: '', closing: '', openingPy: '', additionsPy: '', deductionsPy: '' };
        onUpdate([...data, newRow]);
    };

    const removeRow = (id: string) => {
        onUpdate(data.filter(row => row.id !== id));
    };

    const renderCell = (row: OtherEquityItem, field: keyof Omit<OtherEquityItem, 'id' | 'closing' | 'reserveName'>) => (
        <td className="p-0">
            <FormattedInput
                value={row[field]}
                onChange={val => handleUpdate(row.id, field, val)}
                disabled={isFinalized}
                className="w-full h-full bg-transparent p-2 text-right border-none focus:ring-0 focus:outline-none focus:bg-gray-700/50"
            />
        </td>
    );

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Other Equity - Reconciliation of Reserves</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm border border-gray-600">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="p-2 text-left font-medium w-2/5">Reserve</th>
                            <th className="p-2 text-right font-medium">Opening Balance</th>
                            <th className="p-2 text-right font-medium">Additions during the year</th>
                            <th className="p-2 text-right font-medium">Deductions during the year</th>
                            <th className="p-2 text-right font-medium">Closing Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                        {data.map(row => {
                            const parse = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;
                            const closing = parse(row.opening) + parse(row.additions) - parse(row.deductions);
                            return (
                                <tr key={row.id} className="hover:bg-gray-700/30">
                                    <td className="p-0 flex items-center">
                                        {!isFinalized &&
                                            <button onClick={() => removeRow(row.id)} className="p-2 text-gray-500 hover:text-red-400">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        }
                                        <input
                                            type="text"
                                            value={row.reserveName}
                                            onChange={e => handleUpdate(row.id, 'reserveName', e.target.value)}
                                            disabled={isFinalized}
                                            className="w-full bg-transparent p-2 border-none focus:ring-0 focus:outline-none focus:bg-gray-700/50"
                                            placeholder="e.g., Retained Earnings"
                                        />
                                    </td>
                                    {renderCell(row, 'opening')}
                                    {renderCell(row, 'additions')}
                                    {renderCell(row, 'deductions')}
                                    <td className="p-2 text-right font-mono bg-gray-800/50">
                                        {formatAmount(closing)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {!isFinalized && (
                <button onClick={addRow} className="mt-4 flex items-center text-sm text-brand-blue-light hover:text-white transition-colors font-medium">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Reserve
                </button>
            )}
        </div>
    );
};
