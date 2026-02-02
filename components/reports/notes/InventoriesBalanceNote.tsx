import React from 'react';
// FIX: Add file extension to fix module resolution error.
import { InventoryBalanceRow } from '../../../types.ts';

interface InventoriesBalanceNoteProps {
    data: InventoryBalanceRow[];
    valuationMode: string;
}

const formatCurrency = (val: string): string => {
    const num = parseFloat(val.replace(/,/g, ''));
    if (isNaN(num) || num === 0) return '-';
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

export const InventoriesBalanceNote: React.FC<InventoriesBalanceNoteProps> = ({ data, valuationMode }) => {
    const parse = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;
    const totalCy = data.reduce((sum, item) => sum + parse(item.amountCy), 0);
    const totalPy = data.reduce((sum, item) => sum + parse(item.amountPy), 0);
    
    return (
        <div className="space-y-4">
            <div className="text-sm">
                <span className="font-semibold text-gray-400">Mode of Valuation: </span>
                <span>{valuationMode}</span>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm max-w-lg">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="p-2 text-left font-medium w-3/5">Particulars</th>
                            <th className="p-2 text-right font-medium">Amount CY (₹)</th>
                            <th className="p-2 text-right font-medium">Amount PY (₹)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                        {data.map(item => (
                            <tr key={item.id}>
                                <td className="p-2">{item.item}</td>
                                <td className="p-2 text-right font-mono">{formatCurrency(item.amountCy)}</td>
                                <td className="p-2 text-right font-mono">{formatCurrency(item.amountPy)}</td>
                            </tr>
                        ))}
                        <tr className="font-bold bg-gray-700/30">
                            <td className="p-2">Total</td>
                            <td className="p-2 text-right font-mono">{formatCurrency(totalCy.toString())}</td>
                            <td className="p-2 text-right font-mono">{formatCurrency(totalPy.toString())}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};