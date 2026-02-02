import React from 'react';
// FIX: Add file extension to fix module resolution error.
import { TaxExpenseData } from '../../../types.ts';

interface TaxExpenseNoteProps {
    data: TaxExpenseData;
}

const formatCurrency = (val: string): string => {
    const num = parseFloat(val.replace(/,/g, ''));
    if (isNaN(num)) return '-';
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

export const TaxExpenseNote: React.FC<TaxExpenseNoteProps> = ({ data }) => {
    const parse = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;
    const total = parse(data.currentTax) + parse(data.deferredTax);

    return (
        <div className="overflow-x-auto max-w-md">
            <table className="min-w-full text-sm">
                <tbody className="divide-y divide-gray-700">
                    <tr>
                        <td className="p-2">Current Tax</td>
                        <td className="p-2 text-right font-mono">{formatCurrency(data.currentTax)}</td>
                    </tr>
                     <tr>
                        <td className="p-2">Deferred Tax</td>
                        <td className="p-2 text-right font-mono">{formatCurrency(data.deferredTax)}</td>
                    </tr>
                    <tr className="font-bold bg-gray-700/30">
                        <td className="p-2">Total Tax Expense</td>
                        <td className="p-2 text-right font-mono">{formatCurrency(total.toString())}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
