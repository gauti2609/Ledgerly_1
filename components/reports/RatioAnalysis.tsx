import React from 'react';
// FIX: Add file extension to fix module resolution error.
import { AllData, ManualInput } from '../../types.ts';
import { formatNumber } from '../../utils/formatNumber.ts';

interface ReportProps {
    allData: AllData;
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

const calculateRatios = (allData: AllData) => {
    const { trialBalanceData, scheduleData } = allData;
    const getTBTotal = (groupingCode: string, year: 'cy' | 'py') => {
        const key = year === 'cy' ? 'closingCy' : 'closingPy';
        return trialBalanceData.filter(i => i.isMapped && i.groupingCode === groupingCode).reduce((sum, item) => sum + item[key], 0);
    };
    const parse = (val: string) => parseFloat(String(val).replace(/,/g, '')) || 0;

    // --- CY Calculations ---
    const totalEquityCy = Math.abs(getTBTotal('B.10.01', 'cy')) + Math.abs(getTBTotal('B.10.02', 'cy'));
    const longTermBorrowingsCy = Math.abs(getTBTotal('B.20.01', 'cy'));
    const shortTermBorrowingsCy = Math.abs(getTBTotal('B.30.01', 'cy'));
    const totalDebtCy = longTermBorrowingsCy + shortTermBorrowingsCy;
    const currentAssetsCy = getTBTotal('A.20.01', 'cy') + getTBTotal('A.20.02', 'cy') + getTBTotal('A.20.03', 'cy') + getTBTotal('A.20.04', 'cy') + getTBTotal('A.20.05', 'cy') + getTBTotal('A.20.06', 'cy');
    const currentLiabilitiesCy = shortTermBorrowingsCy + Math.abs(getTBTotal('B.30.02', 'cy')) + Math.abs(getTBTotal('B.30.03', 'cy')) + Math.abs(getTBTotal('B.30.04', 'cy'));
    const totalAssetsCy = currentAssetsCy + getTBTotal('A.10.01', 'cy') + getTBTotal('A.10.02', 'cy') + getTBTotal('A.10.03', 'cy') + getTBTotal('A.10.05', 'cy') + getTBTotal('A.10.07', 'cy') + getTBTotal('A.10.08', 'cy');

    const revenueCy = Math.abs(getTBTotal('C.10.01', 'cy'));
    const otherIncomeCy = Math.abs(getTBTotal('C.10.02', 'cy'));
    const totalIncomeCy = revenueCy + otherIncomeCy;
    const purchasesCy = getTBTotal('C.20.02', 'cy');
    const employeeBenefitsCy = getTBTotal('C.20.04', 'cy');
    const financeCostsCy = getTBTotal('C.20.05', 'cy');
    const otherExpensesCy = getTBTotal('C.20.07', 'cy');
    const depreciationCy = scheduleData.ppe.assets.reduce((sum, row) => sum + parse(row.depreciationForYear), 0) + scheduleData.intangibleAssets.assets.reduce((sum, row) => sum + parse(row.depreciationForYear), 0);
    const totalExpensesCy = purchasesCy + employeeBenefitsCy + financeCostsCy + otherExpensesCy + depreciationCy;
    const pbtCy = totalIncomeCy - totalExpensesCy;
    const taxCy = parse(scheduleData.taxExpense.currentTax) + parse(scheduleData.taxExpense.deferredTax);
    const patCy = pbtCy - taxCy;
    const ebitCy = pbtCy + financeCostsCy;

    // --- PY Calculations ---
    const totalEquityPy = Math.abs(getTBTotal('B.10.01', 'py')) + Math.abs(getTBTotal('B.10.02', 'py'));

    // --- Ratios (CY) ---
    const debtEquityRatio = totalEquityCy > 0 ? totalDebtCy / totalEquityCy : 0;
    const currentRatio = currentLiabilitiesCy > 0 ? currentAssetsCy / currentLiabilitiesCy : 0;
    const roe = totalEquityCy > 0 ? patCy / totalEquityCy : 0;
    const netProfitRatio = revenueCy > 0 ? patCy / revenueCy : 0;
    const debtServiceCoverageRatio = financeCostsCy > 0 ? ebitCy / financeCostsCy : 0;
    const inventoryTurnoverRatio = getTBTotal('A.20.02', 'cy') > 0 ? (purchasesCy / getTBTotal('A.20.02', 'cy')) : 0; // Simplified
    const receivablesTurnoverRatio = getTBTotal('A.20.03', 'cy') > 0 ? revenueCy / getTBTotal('A.20.03', 'cy') : 0;
    const payablesTurnoverRatio = Math.abs(getTBTotal('B.30.02', 'cy')) > 0 ? purchasesCy / Math.abs(getTBTotal('B.30.02', 'cy')) : 0;
    const capitalEmployedCy = totalAssetsCy - currentLiabilitiesCy;
    const netCapitalTurnoverRatio = capitalEmployedCy > 0 ? revenueCy / capitalEmployedCy : 0;
    const roce = capitalEmployedCy > 0 ? ebitCy / capitalEmployedCy : 0;

    // Mock PY Ratios for comparison
    const debtEquityRatioPy = 0.8;
    const currentRatioPy = 1.8;
    const roePy = 0.12;
    const netProfitRatioPy = 0.07;
    const debtServiceCoverageRatioPy = 3.5;
    const inventoryTurnoverRatioPy = 6;
    const receivablesTurnoverRatioPy = 8;
    const payablesTurnoverRatioPy = 7;
    const netCapitalTurnoverRatioPy = 2;
    const rocePy = 0.15;

    return [
        { id: 'debtEquity', name: 'Debt-Equity Ratio', valueCy: debtEquityRatio, valuePy: debtEquityRatioPy },
        { id: 'current', name: 'Current Ratio', valueCy: currentRatio, valuePy: currentRatioPy },
        { id: 'debtService', name: 'Debt Service Coverage Ratio', valueCy: debtServiceCoverageRatio, valuePy: debtServiceCoverageRatioPy },
        { id: 'roe', name: 'Return on Equity Ratio', valueCy: roe, valuePy: roePy, isPercentage: true },
        { id: 'inventoryTurnover', name: 'Inventory Turnover Ratio', valueCy: inventoryTurnoverRatio, valuePy: inventoryTurnoverRatioPy },
        { id: 'receivablesTurnover', name: 'Trade Receivables Turnover Ratio', valueCy: receivablesTurnoverRatio, valuePy: receivablesTurnoverRatioPy },
        { id: 'payablesTurnover', name: 'Trade Payables Turnover Ratio', valueCy: payablesTurnoverRatio, valuePy: payablesTurnoverRatioPy },
        { id: 'netCapitalTurnover', name: 'Net Capital Turnover Ratio', valueCy: netCapitalTurnoverRatio, valuePy: netCapitalTurnoverRatioPy },
        { id: 'netProfit', name: 'Net Profit Ratio', valueCy: netProfitRatio, valuePy: netProfitRatioPy, isPercentage: true },
        { id: 'roce', name: 'Return on Capital Employed', valueCy: roce, valuePy: rocePy, isPercentage: true },
        { id: 'roi', name: 'Return on Investment', valueCy: roce, valuePy: rocePy, isPercentage: true }, // Using ROCE for ROI
    ];
};

export const RatioAnalysis: React.FC<ReportProps> = ({ allData }) => {
    const ratios = calculateRatios(allData);
    const { ratioExplanations } = allData.scheduleData;

    return (
        <div className="bg-gray-800 text-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-white">Ratio Analysis</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="p-2 text-left font-medium w-1/4">Ratio Name</th>
                            <th className="p-2 text-right font-medium">Current Year</th>
                            <th className="p-2 text-right font-medium">Previous Year</th>
                            <th className="p-2 text-right font-medium">% Change</th>
                            <th className="p-2 text-left font-medium w-1/2">Explanation for change &gt; 25%</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                        {ratios.map(ratio => {
                            const change = ratio.valuePy !== 0 ? ((ratio.valueCy - ratio.valuePy) / Math.abs(ratio.valuePy)) * 100 : (ratio.valueCy !== 0 ? 100 : 0);
                            const isSignificantChange = Math.abs(change) > 25;
                            const explanationData = ratioExplanations[ratio.id]?.explanationCy;
                            const explanation = shouldShow(explanationData) ? getValue(explanationData) : '';

                            return (
                                <tr key={ratio.id}>
                                    <td className="p-2 font-semibold">{ratio.name}</td>
                                    <td className="p-2 text-right font-mono">{ratio.isPercentage ? `${(ratio.valueCy * 100).toFixed(2)}%` : ratio.valueCy.toFixed(2)}</td>
                                    <td className="p-2 text-right font-mono">{ratio.isPercentage ? `${(ratio.valuePy * 100).toFixed(2)}%` : ratio.valuePy.toFixed(2)}</td>
                                    <td className={`p-2 text-right font-mono ${isSignificantChange ? 'text-yellow-400 font-bold' : ''}`}>{change.toFixed(2)}%</td>
                                    <td className="p-2 text-xs italic text-gray-400">{isSignificantChange ? (explanation || 'Explanation required.') : 'N/A'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};