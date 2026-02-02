// components/reports/notes/DiscontinuingOperationsNote.tsx
import React from 'react';
import { DiscontinuingOperationData, ManualInput } from '../../../types.ts';

interface DiscontinuingOperationsNoteProps {
    data: DiscontinuingOperationData;
}

const getValue = (val: string | ManualInput | undefined): string => {
    if (!val) return '';
    return typeof val === 'string' ? val : val.value;
};

const shouldShow = (val: string | ManualInput | undefined): boolean => {
    if (!val) return false;
    if (typeof val === 'string') return val.length > 0;
    return val.isSelected;
};

const getValStr = (val: string | ManualInput | undefined): string => {
    if (!val) return '';
    return typeof val === 'string' ? val : val.value;
}

const format = (val: string) => {
    const num = parseFloat(val) || 0;
    return num === 0 ? '-' : num.toLocaleString('en-IN', { minimumFractionDigits: 2 });
};

export const DiscontinuingOperationsNote: React.FC<DiscontinuingOperationsNoteProps> = ({ data }) => {

    // Check if any significant data is present to show the note at all? 
    // Usually if description is present, we show it.

    const parse = (val: string | ManualInput) => parseFloat(getValue(val)) || 0;

    const preTaxProfit = parse(data.revenue) - parse(data.expenses);
    const netProfit = preTaxProfit - parse(data.incomeTaxExpense);

    return (
        <div className="space-y-6 text-sm">
            <div>
                {shouldShow(data.description) && <p className="italic text-gray-400">{getValue(data.description)}</p>}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
                    {shouldShow(data.initialDisclosureDate) && (
                        <>
                            <span className="font-semibold text-gray-300">Initial Disclosure Date:</span><span>{getValue(data.initialDisclosureDate)}</span>
                        </>
                    )}
                    {shouldShow(data.expectedCompletionDate) && (
                        <>
                            <span className="font-semibold text-gray-300">Expected Completion:</span><span>{getValue(data.expectedCompletionDate)}</span>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-semibold text-gray-300 mb-2">Assets to be Disposed Of</h4>
                    <table className="min-w-full text-xs"><tbody>{data.assets.map(a => <tr key={a.id}><td className="p-1">{a.particular}</td><td className="p-1 text-right font-mono">{format(a.carryingAmount)}</td></tr>)}</tbody></table>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-300 mb-2">Liabilities to be Settled</h4>
                    <table className="min-w-full text-xs"><tbody>{data.liabilities.map(l => <tr key={l.id}><td className="p-1">{l.particular}</td><td className="p-1 text-right font-mono">{format(l.carryingAmount)}</td></tr>)}</tbody></table>
                </div>
            </div>

            <div>
                <h4 className="font-semibold text-gray-300 mb-2">Financial Performance of Discontinuing Operation</h4>
                <table className="min-w-full text-sm max-w-md">
                    <tbody className="divide-y divide-gray-700">
                        {shouldShow(data.revenue) && <tr><td className="p-1">Revenue</td><td className="p-1 text-right font-mono">{format(getValue(data.revenue))}</td></tr>}
                        {shouldShow(data.expenses) && <tr><td className="p-1">Expenses</td><td className="p-1 text-right font-mono">({format(getValue(data.expenses))})</td></tr>}
                        <tr className="border-t-2 border-gray-500"><td className="p-1 font-semibold">Pre-tax Profit/(Loss)</td><td className="p-1 text-right font-mono font-semibold">{format(preTaxProfit.toString())}</td></tr>
                        {shouldShow(data.incomeTaxExpense) && <tr><td className="p-1">Income Tax Expense</td><td className="p-1 text-right font-mono">({format(getValue(data.incomeTaxExpense))})</td></tr>}
                        <tr className="font-bold bg-gray-700/30"><td className="p-1">Net Profit/(Loss)</td><td className="p-1 text-right font-mono">{format(netProfit.toString())}</td></tr>
                    </tbody>
                </table>
            </div>

        </div>
    );
};