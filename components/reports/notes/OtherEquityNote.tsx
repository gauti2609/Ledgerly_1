
// components/reports/notes/OtherEquityNote.tsx
import React from 'react';
import { OtherEquityItem } from '../../../types.ts';

interface OtherEquityNoteProps {
    data: OtherEquityItem[];
}

const format = (val: string) => {
    const num = parseFloat(val.replace(/,/g, '')) || 0;
    return num.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

export const OtherEquityNote: React.FC<OtherEquityNoteProps> = ({ data }) => {
    return (
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
                            <tr key={row.id}>
                                <td className="p-2">{row.reserveName}</td>
                                <td className="p-2 text-right font-mono">{format(row.opening)}</td>
                                <td className="p-2 text-right font-mono">{format(row.additions)}</td>
                                <td className="p-2 text-right font-mono">{format(row.deductions)}</td>
                                <td className="p-2 text-right font-mono bg-gray-800/50">
                                    {closing.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};