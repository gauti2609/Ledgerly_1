import React from 'react';
import { AssetAgeingRow } from '../../../types.ts';

interface CWIPAgeingNoteProps {
    data: AssetAgeingRow[];
}

const format = (val: string) => {
    const num = parseFloat(val) || 0;
    return num === 0 ? '-' : num.toLocaleString('en-IN', {minimumFractionDigits: 2});
};


export const CWIPAgeingNote: React.FC<CWIPAgeingNoteProps> = ({ data }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
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
                            <td className="p-2">{row.particular}</td>
                            <td className="p-2 text-right font-mono">{format(row.lessThan1Year)}</td>
                            <td className="p-2 text-right font-mono">{format(row['1To2Years'])}</td>
                            <td className="p-2 text-right font-mono">{format(row['2To3Years'])}</td>
                            <td className="p-2 text-right font-mono">{format(row.moreThan3Years)}</td>
                        </tr>
                    ))}
                    {data.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-xs text-gray-500">No CWIP ageing to report.</td></tr>}
                </tbody>
            </table>
        </div>
    );
};