import React from 'react';
// FIX: Add file extension to fix module resolution error.
import { CWIPRow } from '../../../types.ts';

interface CWIPNoteProps {
    data: CWIPRow[];
}

export const CWIPNote: React.FC<CWIPNoteProps> = ({ data }) => {
    
    const format = (val: string) => {
        const num = parseFloat(val.replace(/,/g, '')) || 0;
        return num.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-700/50">
                    <tr>
                        <th className="p-2 text-left font-medium w-2/5">Particulars</th>
                        <th className="p-2 text-right font-medium">Opening</th>
                        <th className="p-2 text-right font-medium">Additions</th>
                        <th className="p-2 text-right font-medium">Capitalized</th>
                        <th className="p-2 text-right font-medium">Closing</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                    {data.map(row => {
                        const parse = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;
                        const closing = parse(row.opening) + parse(row.additions) - parse(row.capitalized);
                        return (
                            <tr key={row.id}>
                                <td className="p-2">{row.particular}</td>
                                <td className="p-2 text-right font-mono">{format(row.opening)}</td>
                                <td className="p-2 text-right font-mono">{format(row.additions)}</td>
                                <td className="p-2 text-right font-mono">{format(row.capitalized)}</td>
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
