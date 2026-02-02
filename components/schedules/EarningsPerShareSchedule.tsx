

import React from 'react';
// FIX: Add file extension to fix module resolution error.
import { EpsData, ScheduleData } from '../../types.ts';

interface EarningsPerShareScheduleProps {
    data: EpsData;
    onUpdate: React.Dispatch<React.SetStateAction<ScheduleData>>;
    isFinalized: boolean;
}

const InputField: React.FC<{ label: string; value: string; onChange: (value: string) => void; disabled: boolean; description?: string; }> = 
({ label, value, onChange, disabled, description }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400">{label}</label>
        {description && <p className="text-xs text-gray-500 mb-1">{description}</p>}
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white disabled:bg-gray-800 disabled:cursor-not-allowed"
        />
    </div>
);

const CalculationRow: React.FC<{label:string, value: string | number, isBold?: boolean, isSub?: boolean}> = ({label, value, isBold, isSub}) => (
     <tr className={isBold ? 'font-semibold' : ''}>
        <td className={`p-1 ${isSub ? 'pl-6' : ''}`}>{label}</td>
        <td className="p-1 text-right font-mono">{typeof value === 'number' ? value.toLocaleString('en-IN', {minimumFractionDigits: 2}) : value}</td>
    </tr>
)


export const EarningsPerShareSchedule: React.FC<EarningsPerShareScheduleProps> = ({ data, onUpdate, isFinalized }) => {

    const handleUpdate = (field: keyof EpsData, value: string) => {
        onUpdate(prev => ({ ...prev, eps: { ...prev.eps, [field]: value } }));
    };

    const parse = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;
    
    // Basic EPS Calculation
    const pat = parse(data.pat);
    const prefDiv = parse(data.preferenceDividend);
    const basicEarnings = pat - prefDiv;
    const basicShares = parse(data.weightedAvgEquityShares);
    const basicEps = basicShares > 0 ? basicEarnings / basicShares : 0;

    // Diluted EPS Calculation
    const profitAdjustment = parse(data.profitAdjustmentForDilution);
    const dilutedEarnings = basicEarnings + profitAdjustment;
    const dilutiveShares = parse(data.potentiallyDilutiveShares);
    const dilutedTotalShares = basicShares + dilutiveShares;
    const dilutedEps = dilutedTotalShares > 0 ? dilutedEarnings / dilutedTotalShares : 0;
    
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">AS 20: Earnings Per Share (EPS) Calculation</h3>
            
            <div className="p-4 bg-gray-900/50 rounded-lg">
                <h4 className="font-semibold text-gray-300 mb-4">Inputs</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InputField label="Profit After Tax (PAT)" value={data.pat} onChange={v => handleUpdate('pat', v)} disabled={isFinalized} />
                    <InputField label="Preference Dividend" value={data.preferenceDividend} onChange={v => handleUpdate('preferenceDividend', v)} disabled={isFinalized} />
                    <InputField label="Weighted Average Equity Shares (Basic)" value={data.weightedAvgEquityShares} onChange={v => handleUpdate('weightedAvgEquityShares', v)} disabled={isFinalized} />
                    <InputField label="Potentially Dilutive Equity Shares" description="e.g., from options, convertibles" value={data.potentiallyDilutiveShares} onChange={v => handleUpdate('potentiallyDilutiveShares', v)} disabled={isFinalized} />
                    <InputField label="Profit Adjustment for Dilution" description="e.g., interest on convertibles (net of tax)" value={data.profitAdjustmentForDilution} onChange={v => handleUpdate('profitAdjustmentForDilution', v)} disabled={isFinalized} />
                </div>
            </div>

             <div className="mt-4 p-4 bg-gray-900/50 rounded-lg">
                <h4 className="font-bold text-gray-300 mb-2">Reconciliation & Calculation Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                    {/* Basic EPS Table */}
                    <div>
                        <h5 className="font-semibold text-gray-400 mb-1">Basic EPS</h5>
                        <table className="w-full">
                            <tbody>
                                <CalculationRow label="Profit After Tax (A)" value={pat} />
                                <CalculationRow label="Less: Preference Dividend (B)" value={-prefDiv} />
                                <CalculationRow label="Net Profit for Basic EPS (C = A - B)" value={basicEarnings} isBold />
                                <tr className="h-4"></tr>
                                <CalculationRow label="Weighted Avg. Shares (D)" value={basicShares.toLocaleString('en-IN')} />
                                <tr className="h-4"></tr>
                                <CalculationRow label="Basic EPS (₹) (C / D)" value={basicEps.toFixed(2)} isBold />
                            </tbody>
                        </table>
                    </div>
                    {/* Diluted EPS Table */}
                    <div>
                        <h5 className="font-semibold text-gray-400 mb-1">Diluted EPS</h5>
                         <table className="w-full">
                            <tbody>
                                <CalculationRow label="Net Profit for Basic EPS (C)" value={basicEarnings} />
                                <CalculationRow label="Add: Profit Adj. for Dilution (E)" value={profitAdjustment} />
                                <CalculationRow label="Net Profit for Diluted EPS (F = C + E)" value={dilutedEarnings} isBold />
                                <tr className="h-4"></tr>
                                <CalculationRow label="Weighted Avg. Shares (D)" value={basicShares.toLocaleString('en-IN')} />
                                <CalculationRow label="Add: Potentially Dilutive Shares (G)" value={dilutiveShares.toLocaleString('en-IN')} />
                                <CalculationRow label="Total Shares for Diluted EPS (H = D + G)" value={dilutedTotalShares.toLocaleString('en-IN')} isBold />
                                <tr className="h-4"></tr>
                                <CalculationRow label="Diluted EPS (₹) (F / H)" value={dilutedEps.toFixed(2)} isBold />
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};