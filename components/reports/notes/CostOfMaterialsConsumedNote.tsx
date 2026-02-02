


import React from 'react';
// FIX: Add file extension to fix module resolution error.
import { AllData } from '../../../types.ts';

interface CostOfMaterialsConsumedNoteProps {
    allData: AllData;
}

const formatCurrency = (val: string | number): string => {
    const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val;
    if (isNaN(num) || num === 0) return '-';
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

export const CostOfMaterialsConsumedNote: React.FC<CostOfMaterialsConsumedNoteProps> = ({ allData }) => {
    const { scheduleData, trialBalanceData } = allData;
    const { costOfMaterialsConsumed } = scheduleData;

    const getTBTotal = (groupingCode: string, year: 'cy' | 'py') => {
        const key = year === 'cy' ? 'closingCy' : 'closingPy';
        return trialBalanceData
            .filter(i => i.isMapped && i.groupingCode === groupingCode)
            .reduce((sum, item) => sum + item[key], 0);
    };
    
    const parse = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;
    
    const openingTotalCy = costOfMaterialsConsumed.opening.reduce((sum, item) => sum + parse(item.amountCy), 0);
    const closingTotalCy = costOfMaterialsConsumed.closing.reduce((sum, item) => sum + parse(item.amountCy), 0);
    const purchasesCy = getTBTotal('C.20.01', 'cy');
    const totalCy = openingTotalCy + purchasesCy - closingTotalCy;

    const openingTotalPy = costOfMaterialsConsumed.opening.reduce((sum, item) => sum + parse(item.amountPy), 0);
    const closingTotalPy = costOfMaterialsConsumed.closing.reduce((sum, item) => sum + parse(item.amountPy), 0);
    const purchasesPy = getTBTotal('C.20.01', 'py');
    const totalPy = openingTotalPy + purchasesPy - closingTotalPy;


    return (
        <div className="overflow-x-auto max-w-lg">
             <table className="min-w-full text-sm">
                <thead>
                    <tr>
                        <th className="p-2 text-left">Particulars</th>
                        <th className="p-2 text-right">Amount (CY)</th>
                        <th className="p-2 text-right">Amount (PY)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    <tr className="font-semibold"><td className="p-2">Opening Stock</td><td className="p-2 text-right font-mono">{formatCurrency(openingTotalCy)}</td><td className="p-2 text-right font-mono">{formatCurrency(openingTotalPy)}</td></tr>
                    {costOfMaterialsConsumed.opening.map(item => <tr key={item.id}><td className="p-2 pl-6">{item.name}</td><td className="p-2 text-right font-mono">{formatCurrency(item.amountCy)}</td><td className="p-2 text-right font-mono">{formatCurrency(item.amountPy)}</td></tr>)}
                    
                    <tr className="font-semibold"><td className="p-2">Add: Purchases</td><td className="p-2 text-right font-mono">{formatCurrency(purchasesCy)}</td><td className="p-2 text-right font-mono">{formatCurrency(purchasesPy)}</td></tr>
                    
                    <tr className="font-semibold"><td className="p-2">Less: Closing Stock</td><td className="p-2 text-right font-mono">({formatCurrency(closingTotalCy)})</td><td className="p-2 text-right font-mono">({formatCurrency(closingTotalPy)})</td></tr>
                     {costOfMaterialsConsumed.closing.map(item => <tr key={item.id}><td className="p-2 pl-6">{item.name}</td><td className="p-2 text-right font-mono">{formatCurrency(item.amountCy)}</td><td className="p-2 text-right font-mono">{formatCurrency(item.amountPy)}</td></tr>)}

                    <tr className="font-bold bg-gray-700/30">
                        <td className="p-2">Cost of Materials Consumed</td>
                        <td className="p-2 text-right font-mono">{formatCurrency(totalCy)}</td>
                        <td className="p-2 text-right font-mono">{formatCurrency(totalPy)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};