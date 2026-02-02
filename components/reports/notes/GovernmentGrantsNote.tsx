// components/reports/notes/GovernmentGrantsNote.tsx
import React from 'react';
import { GovernmentGrantsData } from '../../../types.ts';

interface GovernmentGrantsNoteProps {
    data: GovernmentGrantsData;
}

const format = (val: string) => {
    const num = parseFloat(val) || 0;
    return num === 0 ? '-' : num.toLocaleString('en-IN', {minimumFractionDigits: 2});
};

export const GovernmentGrantsNote: React.FC<GovernmentGrantsNoteProps> = ({ data }) => {
    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-400">
                Disclosures as required by Accounting Standard (AS) 12 on Accounting for Government Grants.
            </p>
            <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="p-2 text-left w-1/3">Nature of Grant</th>
                            <th className="p-2 text-right w-1/4">Amount Recognised</th>
                            <th className="p-2 text-left w-2/5">Accounting Policy Adopted</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                        {data.items.length > 0 ? data.items.map(item => (
                            <tr key={item.id}>
                                <td className="p-2">{item.nature}</td>
                                <td className="p-2 text-right font-mono">{format(item.amountRecognised)}</td>
                                <td className="p-2">{item.policy}</td>
                            </tr>
                        )) : (
                             <tr>
                                <td colSpan={3} className="p-4 text-center text-gray-500 italic">No government grants were recognised during the period.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
