
import React from 'react';
// FIX: Add file extension to fix module resolution error.
import { TradePayablesAgeingRow } from '../../../types.ts';

interface TradePayablesAgeingNoteProps {
    data: TradePayablesAgeingRow[];
}

export const TradePayablesAgeingNote: React.FC<TradePayablesAgeingNoteProps> = ({ data }) => {
    const headers = ['< 1 Year', '1-2 Years', '2-3 Years', '> 3 Years', 'Total'];
    const fields: (keyof Omit<TradePayablesAgeingRow, 'category'>)[] = ['lessThan1Year', '1To2Years', '2To3Years', 'moreThan3Years'];
    const rowConfig = [
        { category: 'msme', label: 'MSME' },
        { category: 'others', label: 'Others' },
        { category: 'disputedMsme', label: 'Disputed Dues - MSME' },
        { category: 'disputedOthers', label: 'Disputed Dues - Others' },
    ] as const;

    const parse = (val: string) => parseFloat(val) || 0;
    const format = (val: string) => (parse(val) === 0 ? '-' : parse(val).toLocaleString('en-IN', {minimumFractionDigits: 2}));

    return (
        <div>
            <h4 className="font-semibold text-gray-300 mb-2">Trade Payables Ageing</h4>
            <table className="min-w-full text-sm border-collapse border border-gray-600">
                <thead className="bg-gray-700/50">
                    <tr>
                        <th className="p-2 text-left border border-gray-600">Particulars</th>
                        {headers.map(h => <th key={h} className="p-2 text-right border border-gray-600">{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {rowConfig.map(config => {
                         const rowData = data.find(r => r.category === config.category);
                         if (!rowData) return null;
                         // FIX: Replaced reduce with explicit sum for type safety.
                         const total = parse(rowData.lessThan1Year) + parse(rowData['1To2Years']) + parse(rowData['2To3Years']) + parse(rowData.moreThan3Years);
                        return (
                             <tr key={config.category}>
                                <td className="p-2 border border-gray-600">{config.label}</td>
                                {fields.map(field => (
                                    <td key={field} className="p-2 border border-gray-600 text-right font-mono">
                                        {format(rowData[field])}
                                    </td>
                                ))}
                                 <td className="p-2 border border-gray-600 text-right font-mono bg-gray-800/50">{total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
};
