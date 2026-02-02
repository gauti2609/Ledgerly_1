import React from 'react';
import { EpsData } from '../../../types.ts';

interface EarningsPerShareNoteProps {
    data: EpsData;
}

const formatCurrency = (val: string | number): string => {
    const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val;
    if (isNaN(num)) return '-';
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

const formatShares = (val: string | number): string => {
     const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val;
    if (isNaN(num)) return '-';
    return new Intl.NumberFormat('en-IN').format(num);
}

const ReconciliationTable: React.FC<{title: string, earnings: number, shares: number, eps: number}> = ({title, earnings, shares, eps}) => (
    <div>
        <h4 className="font-semibold text-gray-300 mb-1">{title}</h4>
        <table className="min-w-full text-sm">
             <tbody className="divide-y divide-gray-700">
                <tr>
                    <td className="p-1">Net Profit / (Loss) for the period attributable to Equity Shareholders</td>
                    <td className="p-1 text-right font-mono">{formatCurrency(earnings)}</td>
                </tr>
                 <tr>
                    <td className="p-1">Weighted average number of Equity Shares outstanding during the period</td>
                    <td className="p-1 text-right font-mono">{formatShares(shares)}</td>
                </tr>
                <tr className="font-bold bg-gray-700/30">
                    <td className="p-2">Earnings Per Share (₹)</td>
                    <td className="p-2 text-right font-mono">{eps.toFixed(2)}</td>
                </tr>
             </tbody>
        </table>
    </div>
)


export const EarningsPerShareNote: React.FC<EarningsPerShareNoteProps> = ({ data }) => {
    const parse = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;
    
    // Basic
    const pat = parse(data.pat);
    const prefDiv = parse(data.preferenceDividend);
    const basicEarnings = pat - prefDiv;
    const basicShares = parse(data.weightedAvgEquityShares);
    const basicEps = basicShares > 0 ? basicEarnings / basicShares : 0;

    // Diluted
    const profitAdjustment = parse(data.profitAdjustmentForDilution);
    const dilutedEarnings = basicEarnings + profitAdjustment;
    const dilutiveShares = parse(data.potentiallyDilutiveShares);
    const dilutedTotalShares = basicShares + dilutiveShares;
    const dilutedEps = dilutedTotalShares > 0 ? dilutedEarnings / dilutedTotalShares : 0;

    return (
        <div className="space-y-6">
            <ReconciliationTable title="a) Basic Earnings Per Share" earnings={basicEarnings} shares={basicShares} eps={basicEps} />
            <ReconciliationTable title="b) Diluted Earnings Per Share" earnings={dilutedEarnings} shares={dilutedTotalShares} eps={dilutedEps} />
        </div>
    );
};