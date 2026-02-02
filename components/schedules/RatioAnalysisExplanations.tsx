import React from 'react';
// FIX: Add file extension to fix module resolution error.
import { AllData, ScheduleData, RatioExplanation, ManualInput } from '../../types.ts';
import { InputWithCheckbox } from '../InputWithCheckbox.tsx';

interface RatioAnalysisExplanationsProps {
    allData: AllData;
    onUpdate: React.Dispatch<React.SetStateAction<ScheduleData>>;
    isFinalized: boolean;
}

export const RatioAnalysisExplanations: React.FC<RatioAnalysisExplanationsProps> = ({ allData, onUpdate, isFinalized }) => {
    const { ratioExplanations } = allData.scheduleData;

    const allRatios = [
        { id: 'debtEquity', name: 'Debt-Equity Ratio' },
        { id: 'current', name: 'Current Ratio' },
        { id: 'debtService', name: 'Debt Service Coverage Ratio' },
        { id: 'roe', name: 'Return on Equity Ratio' },
        { id: 'inventoryTurnover', name: 'Inventory Turnover Ratio' },
        { id: 'receivablesTurnover', name: 'Trade Receivables Turnover Ratio' },
        { id: 'payablesTurnover', name: 'Trade Payables Turnover Ratio' },
        { id: 'netCapitalTurnover', name: 'Net Capital Turnover Ratio' },
        { id: 'netProfit', name: 'Net Profit Ratio' },
        { id: 'roce', name: 'Return on Capital Employed' },
        { id: 'roi', name: 'Return on Investment' },
    ];

    const handleUpdate = (id: string, value: ManualInput) => {
        onUpdate(prev => ({
            ...prev,
            ratioExplanations: {
                ...prev.ratioExplanations,
                [id]: {
                    ...(prev.ratioExplanations[id] || { id, explanationPy: '' }),
                    explanationCy: value,
                }
            }
        }));
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Ratio Analysis - Explanations</h3>
            <p className="text-sm text-gray-400">Provide explanations for any ratio that has changed by more than 25% compared to the previous year. These explanations will be displayed in the Ratio Analysis report.</p>

            <div className="space-y-4">
                {allRatios.map(ratio => (
                    <div key={ratio.id}>
                        <InputWithCheckbox
                            label={ratio.name}
                            value={ratioExplanations[ratio.id]?.explanationCy || ''}
                            onChange={v => handleUpdate(ratio.id, v)}
                            disabled={isFinalized}
                            rows={2}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};