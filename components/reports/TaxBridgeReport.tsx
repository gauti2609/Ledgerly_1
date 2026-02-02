import React, { useMemo } from 'react';
import { TrialBalanceItem, Masters } from '../../types.ts';
import { generateTaxBridge, formatTaxBridgeAmount, TaxBridgeResult } from '../../services/taxBridgeService.ts';
import { DownloadIcon, DocumentTextIcon } from '../icons.tsx';

interface TaxBridgeReportProps {
    trialBalanceData: TrialBalanceItem[];
    masters: Masters;
}

export const TaxBridgeReport: React.FC<TaxBridgeReportProps> = ({
    trialBalanceData,
    masters
}) => {
    // Generate tax bridge from mapped data
    const bridge = useMemo(() => {
        return generateTaxBridge(trialBalanceData, masters);
    }, [trialBalanceData, masters]);

    const format = (amount: number) => formatTaxBridgeAmount(amount);

    const additionAdjustments = bridge.adjustments.filter(a => a.direction === 'ADD');
    const deductionAdjustments = bridge.adjustments.filter(a => a.direction === 'LESS');

    return (
        <div className="p-6 bg-gray-900 min-h-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <DocumentTextIcon className="w-6 h-6 text-orange-400" />
                        Book to Tax Reconciliation
                    </h2>
                    <p className="text-sm text-gray-400">Bridge from Accounting Profit to Taxable Income</p>
                </div>
                <button className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium">
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    Export
                </button>
            </div>

            {/* Tax Bridge Table */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="text-left p-3 text-gray-300 font-semibold">Particulars</th>
                            <th className="text-center p-3 text-gray-300 font-semibold w-24">Section</th>
                            <th className="text-right p-3 text-gray-300 font-semibold w-40">Current Year</th>
                            <th className="text-right p-3 text-gray-300 font-semibold w-40">Previous Year</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {/* Book Profit */}
                        <tr className="bg-blue-900/20 font-bold">
                            <td className="p-3 text-blue-300">Net Profit as per Books (Before Tax)</td>
                            <td className="p-3 text-center text-gray-400">-</td>
                            <td className={`p-3 text-right ${bridge.bookProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {format(bridge.bookProfit)}
                            </td>
                            <td className="p-3 text-right text-gray-400">{format(bridge.bookProfitPY)}</td>
                        </tr>

                        {/* Additions Header */}
                        <tr className="bg-red-900/20">
                            <td colSpan={4} className="p-3 font-bold text-red-300">
                                ADD: Disallowances / Add-backs
                            </td>
                        </tr>

                        {/* Addition Items */}
                        {additionAdjustments.map((adj, idx) => (
                            <tr key={adj.id} className="hover:bg-gray-700/30">
                                <td className="p-3 pl-6 text-gray-300">
                                    {adj.description}
                                    {adj.isManual && (
                                        <span className="ml-2 text-xs text-yellow-500">[Manual Entry Required]</span>
                                    )}
                                </td>
                                <td className="p-3 text-center text-purple-400 font-mono text-xs">{adj.section}</td>
                                <td className={`p-3 text-right ${adj.amountCY > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                                    {adj.amountCY > 0 ? format(adj.amountCY) : '-'}
                                </td>
                                <td className="p-3 text-right text-gray-400">
                                    {adj.amountPY > 0 ? format(adj.amountPY) : '-'}
                                </td>
                            </tr>
                        ))}

                        {/* Total Additions */}
                        <tr className="bg-red-900/30 font-semibold">
                            <td className="p-3 pl-6 text-red-200">Total Additions (A)</td>
                            <td className="p-3"></td>
                            <td className="p-3 text-right text-red-400">{format(bridge.totalAdditions)}</td>
                            <td className="p-3 text-right text-gray-400">{format(bridge.totalAdditionsPY)}</td>
                        </tr>

                        {/* Deductions Header */}
                        <tr className="bg-green-900/20">
                            <td colSpan={4} className="p-3 font-bold text-green-300">
                                LESS: Deductions / Exempt Income
                            </td>
                        </tr>

                        {/* Deduction Items */}
                        {deductionAdjustments.map((adj, idx) => (
                            <tr key={adj.id} className="hover:bg-gray-700/30">
                                <td className="p-3 pl-6 text-gray-300">
                                    {adj.description}
                                    {adj.isManual && (
                                        <span className="ml-2 text-xs text-yellow-500">[Manual Entry Required]</span>
                                    )}
                                </td>
                                <td className="p-3 text-center text-purple-400 font-mono text-xs">{adj.section}</td>
                                <td className={`p-3 text-right ${adj.amountCY > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                                    {adj.amountCY > 0 ? format(adj.amountCY) : '-'}
                                </td>
                                <td className="p-3 text-right text-gray-400">
                                    {adj.amountPY > 0 ? format(adj.amountPY) : '-'}
                                </td>
                            </tr>
                        ))}

                        {/* Total Deductions */}
                        <tr className="bg-green-900/30 font-semibold">
                            <td className="p-3 pl-6 text-green-200">Total Deductions (B)</td>
                            <td className="p-3"></td>
                            <td className="p-3 text-right text-green-400">{format(bridge.totalDeductions)}</td>
                            <td className="p-3 text-right text-gray-400">{format(bridge.totalDeductionsPY)}</td>
                        </tr>

                        {/* Final Taxable Income */}
                        <tr className="bg-gray-700/50">
                            <td colSpan={4} className="p-1"></td>
                        </tr>
                        <tr className="bg-orange-900/30 font-bold text-lg">
                            <td className="p-4 text-orange-300">
                                TAXABLE INCOME (Book Profit + A - B)
                            </td>
                            <td className="p-4"></td>
                            <td className={`p-4 text-right ${bridge.taxableIncome >= 0 ? 'text-orange-400' : 'text-red-400'}`}>
                                {format(bridge.taxableIncome)}
                            </td>
                            <td className="p-4 text-right text-gray-400">{format(bridge.taxableIncomePY)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700 text-xs text-gray-400">
                <p className="font-semibold mb-2">Notes:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>[Manual Entry Required] items need manual input - cannot be auto-calculated from mappings</li>
                    <li>Book Depreciation is added back; Tax Depreciation (as per IT Act rates) is deducted</li>
                    <li>Sec 43B items are disallowed if not paid before ITR filing due date</li>
                    <li>Review and adjust amounts in Form 3CD for accurate figures</li>
                </ul>
            </div>

            {/* Quick Summary */}
            <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-blue-300">Book Profit</p>
                    <p className={`text-xl font-bold ${bridge.bookProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                        {format(bridge.bookProfit)}
                    </p>
                </div>
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-red-300">Net Additions</p>
                    <p className="text-xl font-bold text-red-400">
                        +{format(bridge.totalAdditions - bridge.totalDeductions)}
                    </p>
                </div>
                <div className="bg-orange-900/20 border border-orange-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-orange-300">Taxable Income</p>
                    <p className={`text-xl font-bold ${bridge.taxableIncome >= 0 ? 'text-orange-400' : 'text-red-400'}`}>
                        {format(bridge.taxableIncome)}
                    </p>
                </div>
            </div>
        </div>
    );
};
