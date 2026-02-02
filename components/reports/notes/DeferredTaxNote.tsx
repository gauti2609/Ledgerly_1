// components/reports/notes/DeferredTaxNote.tsx
import React from 'react';
import { DeferredTaxData, DeferredTaxRow } from '../../../types.ts';

interface DeferredTaxNoteProps {
    data: DeferredTaxData;
}

const format = (val: string) => {
    const num = parseFloat(val) || 0;
    return num === 0 ? '-' : num.toLocaleString('en-IN', {minimumFractionDigits: 2});
};

const TaxTable: React.FC<{title: string; rows: DeferredTaxRow[]}> = ({title, rows}) => {
    const parse = (val: string) => parseFloat(val) || 0;
    const totalClosing = rows.reduce((sum, row) => sum + parse(row.openingBalance) + parse(row.pnlCharge), 0);
    return (
        <div>
            <h4 className="text-md font-semibold text-gray-300 mb-2">{title}</h4>
            <table className="min-w-full text-sm">
                <thead>
                    <tr className="bg-gray-700/50">
                        <th className="p-2 text-left w-2/5">Particulars</th>
                        <th className="p-2 text-right">Opening</th>
                        <th className="p-2 text-right">Charge to P&L</th>
                        <th className="p-2 text-right">Closing</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(row => {
                         const closing = parse(row.openingBalance) + parse(row.pnlCharge);
                         return(
                            <tr key={row.id}>
                                <td className="p-2">{row.particular}</td>
                                <td className="p-2 text-right font-mono">{format(row.openingBalance)}</td>
                                <td className="p-2 text-right font-mono">{format(row.pnlCharge)}</td>
                                <td className="p-2 text-right font-mono">{closing.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                            </tr>
                         )
                    })}
                    <tr className="font-bold bg-gray-700/30">
                        <td className="p-2">Total</td>
                        <td colSpan={2}></td>
                        <td className="p-2 text-right font-mono">{totalClosing.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
};


export const DeferredTaxNote: React.FC<DeferredTaxNoteProps> = ({ data }) => {
    return (
        <div className="space-y-6">
            <TaxTable title="Deferred Tax Assets" rows={data.assets} />
            <TaxTable title="Deferred Tax Liabilities" rows={data.liabilities} />
        </div>
    );
};
