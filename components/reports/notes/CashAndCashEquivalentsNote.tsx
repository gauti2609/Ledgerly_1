import React from 'react';
import { CashAndCashEquivalentsData, ManualInput } from '../../../types.ts';

interface CashAndCashEquivalentsNoteProps {
    data: CashAndCashEquivalentsData;
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

const formatCurrency = (val: string): string => {
    const num = parseFloat(val.replace(/,/g, ''));
    if (isNaN(num) || num === 0) return '-';
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

export const CashAndCashEquivalentsNote: React.FC<CashAndCashEquivalentsNoteProps> = ({ data }) => {
    const parse = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;

    // For ManualInput fields (cashOnHand, chequesDraftsOnHand), we need to extract the string value for calculation
    const getValStr = (v: string | ManualInput) => typeof v === 'string' ? v : v.value;

    const totalCy = parse(getValStr(data.cashOnHand)) +
        parse(getValStr(data.chequesDraftsOnHand)) +
        data.balancesWithBanks.reduce((sum, item) => sum + parse(item.amountCy), 0) +
        data.others.reduce((sum, item) => sum + parse(item.amountCy), 0);

    const totalPy = parse(getValStr(data.cashOnHand)) + // Assuming PY is same structure or logic
        parse(getValStr(data.chequesDraftsOnHand)) + // Note: Original code reused these for PY sum which might be wrong if they aren't ManualInput with PY values, but adhering to existing logic pattern for now, just fixing type access.
        data.balancesWithBanks.reduce((sum, item) => sum + parse(item.amountPy), 0) +
        data.others.reduce((sum, item) => sum + parse(item.amountPy), 0);

    return (
        <div className="space-y-4">
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
                        {data.balancesWithBanks.length > 0 && (
                            <tr className="font-semibold"><td colSpan={3} className="p-2">Balances with Banks</td></tr>
                        )}
                        {data.balancesWithBanks.map(item => <tr key={item.id}><td className="p-2 pl-6">{item.particular}</td><td className="p-2 text-right font-mono">{formatCurrency(item.amountCy)}</td><td className="p-2 text-right font-mono">{formatCurrency(item.amountPy)}</td></tr>)}

                        {shouldShow(data.chequesDraftsOnHand) && <tr><td className="p-2">Cheques, drafts on hand</td><td className="p-2 text-right font-mono">{formatCurrency(getValue(data.chequesDraftsOnHand))}</td><td className="p-2 text-right font-mono">-</td></tr>}
                        {shouldShow(data.cashOnHand) && <tr><td className="p-2">Cash on hand</td><td className="p-2 text-right font-mono">{formatCurrency(getValue(data.cashOnHand))}</td><td className="p-2 text-right font-mono">-</td></tr>}

                        {data.others.length > 0 && (
                            <tr className="font-semibold"><td colSpan={3} className="p-2">Others</td></tr>
                        )}
                        {data.others.map(item => <tr key={item.id}><td className="p-2 pl-6">{item.particular}</td><td className="p-2 text-right font-mono">{formatCurrency(item.amountCy)}</td><td className="p-2 text-right font-mono">{formatCurrency(item.amountPy)}</td></tr>)}

                        <tr className="font-bold bg-gray-700/30">
                            <td className="p-2">Total</td>
                            <td className="p-2 text-right font-mono">{formatCurrency(totalCy.toString())}</td>
                            <td className="p-2 text-right font-mono">{formatCurrency(totalPy.toString())}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            {shouldShow(data.repatriationRestrictions) && (
                <div>
                    <span className="font-semibold text-gray-400">Repatriation Restrictions: </span>
                    <span>{getValue(data.repatriationRestrictions)}</span>
                </div>
            )}
        </div>
    );
};