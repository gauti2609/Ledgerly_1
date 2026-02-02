

import React from 'react';
// FIX: Add file extension to fix module resolution error.
import { ContingentLiability } from '../../../types.ts';

interface ContingentLiabilitiesNoteProps {
    data: ContingentLiability[];
}

const formatCurrency = (val: string): string => {
    const num = parseFloat(val.replace(/,/g, ''));
    if (isNaN(num) || num === 0) return '-';
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

export const ContingentLiabilitiesNote: React.FC<ContingentLiabilitiesNoteProps> = ({ data }) => {
    return (
        <div className="overflow-x-auto">
             <table className="min-w-full text-sm">
                <thead className="bg-gray-700/50">
                    <tr>
                        <th className="p-2 text-left font-medium w-3/5">Nature of Liability / Commitment</th>
                        <th className="p-2 text-right font-medium">Amount CY (₹)</th>
                        <th className="p-2 text-right font-medium">Amount PY (₹)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                    {data.length > 0 ? data.map(item => (
                        <tr key={item.id}>
                            <td className="p-2">{item.nature}</td>
                            <td className="p-2 text-right font-mono">{formatCurrency(item.amountCy)}</td>
                            <td className="p-2 text-right font-mono">{formatCurrency(item.amountPy)}</td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={3} className="p-4 text-center text-xs text-gray-500">No contingent liabilities or commitments to report.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};