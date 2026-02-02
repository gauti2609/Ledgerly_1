// components/reports/notes/ProvisionsNote.tsx
import React from 'react';
import { ProvisionsData, ProvisionReconciliationRow } from '../../../types.ts';

interface ProvisionsNoteProps {
    data: ProvisionsData;
}

const format = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val;
    if (isNaN(num)) return '-';
    const formatted = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Math.abs(num));
    return num < 0 ? `(${formatted})` : formatted;
};

const ProvisionTable: React.FC<{title: string, rows: ProvisionReconciliationRow[]}> = ({title, rows}) => {
    const parse = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;
    
    return (
        <div>
            <h4 className="font-semibold text-gray-300 mb-2">{title}</h4>
            <table className="min-w-full text-xs">
                <thead className="bg-gray-700/50">
                    <tr>
                        <th className="p-2 text-left w-2/5">Provision</th>
                        <th className="p-2 text-right">Opening Balance</th>
                        <th className="p-2 text-right">Additions</th>
                        <th className="p-2 text-right">Used / Reversed</th>
                        <th className="p-2 text-right">Closing Balance</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                    {rows.map(row => {
                        const closing = parse(row.opening) + parse(row.additions) - parse(row.usedOrReversed);
                        return (
                            <tr key={row.id}>
                                <td className="p-2">{row.provisionName}</td>
                                <td className="p-2 text-right font-mono">{format(row.opening)}</td>
                                <td className="p-2 text-right font-mono">{format(row.additions)}</td>
                                <td className="p-2 text-right font-mono">{format(row.usedOrReversed)}</td>
                                <td className="p-2 text-right font-mono">{format(closing)}</td>
                            </tr>
                        );
                    })}
                     {rows.length === 0 && <tr><td colSpan={5} className="text-center p-4 text-gray-500 italic">No provisions to report.</td></tr>}
                </tbody>
            </table>
        </div>
    );
};

export const ProvisionsNote: React.FC<ProvisionsNoteProps> = ({ data }) => {
    return (
        <div className="space-y-6">
            <ProvisionTable title="Long-Term Provisions" rows={data.longTerm} />
            <ProvisionTable title="Short-Term Provisions" rows={data.shortTerm} />
        </div>
    );
};