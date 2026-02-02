import React, { useState, useMemo } from 'react';
import { TrialBalanceItem, Masters } from '../../types.ts';
import { generateCashFlowStatement, formatCashFlowAmount, CashFlowStatement } from '../../services/cashFlowService.ts';
import { DownloadIcon, SparklesIcon } from '../icons.tsx';

interface CashFlowGeneratorProps {
    trialBalanceData: TrialBalanceItem[];
    masters: Masters;
}

export const CashFlowGenerator: React.FC<CashFlowGeneratorProps> = ({
    trialBalanceData,
    masters
}) => {
    const [showDetails, setShowDetails] = useState(false);

    // Generate cash flow statement from mapped data
    const cashFlow = useMemo(() => {
        return generateCashFlowStatement(trialBalanceData, masters);
    }, [trialBalanceData, masters]);

    const formatCurrency = (amount: number) => formatCashFlowAmount(amount);

    return (
        <div className="p-6 bg-gray-900 min-h-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-purple-400" />
                        Cash Flow Statement
                    </h2>
                    <p className="text-sm text-gray-400">Auto-generated using Indirect Method</p>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-400">
                        <input
                            type="checkbox"
                            checked={showDetails}
                            onChange={e => setShowDetails(e.target.checked)}
                            className="w-4 h-4 accent-purple-500"
                        />
                        Show source groupings
                    </label>
                    <button className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium">
                        <DownloadIcon className="w-4 h-4 mr-2" />
                        Export
                    </button>
                </div>
            </div>

            {/* Cash Flow Table */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="text-left p-3 text-gray-300 font-semibold">Particulars</th>
                            <th className="text-right p-3 text-gray-300 font-semibold w-40">Current Year</th>
                            <th className="text-right p-3 text-gray-300 font-semibold w-40">Previous Year</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {/* === OPERATING ACTIVITIES === */}
                        <tr className="bg-blue-900/20">
                            <td colSpan={3} className="p-3 font-bold text-blue-300">
                                A. CASH FLOW FROM OPERATING ACTIVITIES
                            </td>
                        </tr>
                        <tr className="font-medium">
                            <td className="p-3 pl-6 text-gray-200">Net Profit Before Tax</td>
                            <td className="p-3 text-right text-gray-200">{formatCurrency(cashFlow.netProfitBeforeTax)}</td>
                            <td className="p-3 text-right text-gray-400">{formatCurrency(cashFlow.netProfitBeforeTaxPY)}</td>
                        </tr>
                        <tr>
                            <td className="p-3 pl-6 text-gray-400 italic">Adjustments for:</td>
                            <td></td>
                            <td></td>
                        </tr>
                        {cashFlow.operatingActivities.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-700/30">
                                <td className="p-3 pl-10 text-gray-300">
                                    {item.name}
                                    {showDetails && item.sourceGroupings && (
                                        <span className="ml-2 text-xs text-gray-500">
                                            [{item.sourceGroupings.join(', ')}]
                                        </span>
                                    )}
                                </td>
                                <td className={`p-3 text-right ${item.amountCY >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {formatCurrency(item.amountCY)}
                                </td>
                                <td className="p-3 text-right text-gray-400">{formatCurrency(item.amountPY)}</td>
                            </tr>
                        ))}
                        <tr className="bg-blue-900/30 font-semibold">
                            <td className="p-3 pl-6 text-blue-200">Net Cash from Operating Activities</td>
                            <td className={`p-3 text-right ${cashFlow.netCashFromOperating >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                {formatCurrency(cashFlow.netCashFromOperating)}
                            </td>
                            <td className="p-3 text-right text-gray-400">{formatCurrency(cashFlow.netCashFromOperatingPY)}</td>
                        </tr>

                        {/* === INVESTING ACTIVITIES === */}
                        <tr className="bg-purple-900/20">
                            <td colSpan={3} className="p-3 font-bold text-purple-300">
                                B. CASH FLOW FROM INVESTING ACTIVITIES
                            </td>
                        </tr>
                        {cashFlow.investingActivities.length > 0 ? cashFlow.investingActivities.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-700/30">
                                <td className="p-3 pl-10 text-gray-300">
                                    {item.name}
                                    {showDetails && item.sourceGroupings && (
                                        <span className="ml-2 text-xs text-gray-500">
                                            [{item.sourceGroupings.join(', ')}]
                                        </span>
                                    )}
                                </td>
                                <td className={`p-3 text-right ${item.amountCY >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {formatCurrency(item.amountCY)}
                                </td>
                                <td className="p-3 text-right text-gray-400">{formatCurrency(item.amountPY)}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="p-3 pl-10 text-gray-500 italic">No investing activities detected</td>
                            </tr>
                        )}
                        <tr className="bg-purple-900/30 font-semibold">
                            <td className="p-3 pl-6 text-purple-200">Net Cash from Investing Activities</td>
                            <td className={`p-3 text-right ${cashFlow.netCashFromInvesting >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                {formatCurrency(cashFlow.netCashFromInvesting)}
                            </td>
                            <td className="p-3 text-right text-gray-400">{formatCurrency(cashFlow.netCashFromInvestingPY)}</td>
                        </tr>

                        {/* === FINANCING ACTIVITIES === */}
                        <tr className="bg-orange-900/20">
                            <td colSpan={3} className="p-3 font-bold text-orange-300">
                                C. CASH FLOW FROM FINANCING ACTIVITIES
                            </td>
                        </tr>
                        {cashFlow.financingActivities.length > 0 ? cashFlow.financingActivities.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-700/30">
                                <td className="p-3 pl-10 text-gray-300">
                                    {item.name}
                                    {showDetails && item.sourceGroupings && (
                                        <span className="ml-2 text-xs text-gray-500">
                                            [{item.sourceGroupings.join(', ')}]
                                        </span>
                                    )}
                                </td>
                                <td className={`p-3 text-right ${item.amountCY >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {formatCurrency(item.amountCY)}
                                </td>
                                <td className="p-3 text-right text-gray-400">{formatCurrency(item.amountPY)}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="p-3 pl-10 text-gray-500 italic">No financing activities detected</td>
                            </tr>
                        )}
                        <tr className="bg-orange-900/30 font-semibold">
                            <td className="p-3 pl-6 text-orange-200">Net Cash from Financing Activities</td>
                            <td className={`p-3 text-right ${cashFlow.netCashFromFinancing >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                {formatCurrency(cashFlow.netCashFromFinancing)}
                            </td>
                            <td className="p-3 text-right text-gray-400">{formatCurrency(cashFlow.netCashFromFinancingPY)}</td>
                        </tr>

                        {/* === SUMMARY === */}
                        <tr className="bg-gray-700/50">
                            <td colSpan={3} className="p-1"></td>
                        </tr>
                        <tr className="font-bold text-lg">
                            <td className="p-3 text-white">Net Increase/(Decrease) in Cash and Cash Equivalents</td>
                            <td className={`p-3 text-right ${cashFlow.netIncreaseInCash >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatCurrency(cashFlow.netIncreaseInCash)}
                            </td>
                            <td className="p-3 text-right text-gray-400">{formatCurrency(cashFlow.netIncreaseInCashPY)}</td>
                        </tr>
                        <tr>
                            <td className="p-3 text-gray-300">Add: Cash and Cash Equivalents at the beginning</td>
                            <td className="p-3 text-right text-gray-200">{formatCurrency(cashFlow.openingCash)}</td>
                            <td className="p-3 text-right text-gray-400">{formatCurrency(cashFlow.openingCashPY)}</td>
                        </tr>
                        <tr className="bg-green-900/20 font-bold text-lg">
                            <td className="p-3 text-green-300">Cash and Cash Equivalents at the end</td>
                            <td className="p-3 text-right text-green-400">{formatCurrency(cashFlow.closingCash)}</td>
                            <td className="p-3 text-right text-gray-400">{formatCurrency(cashFlow.closingCashPY)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700 text-xs text-gray-400">
                <p className="font-semibold mb-2">Notes:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Cash Flow generated using Indirect Method as per Ind AS 7</li>
                    <li>Working capital changes calculated from year-on-year balance differences</li>
                    <li>Figures in brackets represent outflows or reductions</li>
                    <li>Review and adjust for non-cash items not captured in mappings</li>
                </ul>
            </div>
        </div>
    );
};
