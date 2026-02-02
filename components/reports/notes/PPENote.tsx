import React from 'react';
import { PpeScheduleData, ManualInput } from '../../../types.ts';

interface PPENoteProps {
    data: PpeScheduleData;
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

export const PPENote: React.FC<PPENoteProps> = ({ data }) => {
    const { assets, commitments, pledgedAssets, borrowingCostsCapitalized } = data;
    const hasLeasedAssets = assets.some(row => row.isUnderLease);
    return (
        <div className="space-y-4">
            <div className="overflow-x-auto">
                <table className="min-w-full text-xs border-collapse border border-gray-600">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th rowSpan={2} className="p-2 text-left font-medium border border-gray-600 w-1/4">Asset Class</th>
                            <th colSpan={4} className="p-2 text-center font-medium border border-gray-600">Gross Block</th>
                            <th colSpan={4} className="p-2 text-center font-medium border border-gray-600">Accumulated Depreciation</th>
                            <th colSpan={2} className="p-2 text-center font-medium border border-gray-600">Impairment (AS 28)</th>
                            <th rowSpan={2} className="p-2 text-right font-medium border border-gray-600">Net Block</th>
                        </tr>
                        <tr>
                            <th className="p-2 text-right font-medium border border-gray-600">Opening</th>
                            <th className="p-2 text-right font-medium border border-gray-600">Additions</th>
                            <th className="p-2 text-right font-medium border border-gray-600">Disposals</th>
                            <th className="p-2 text-right font-medium border border-gray-600">Closing</th>
                            <th className="p-2 text-right font-medium border border-gray-600">Opening</th>
                            <th className="p-2 text-right font-medium border border-gray-600">For the Year</th>
                            <th className="p-2 text-right font-medium border border-gray-600">On Disposals</th>
                            <th className="p-2 text-right font-medium border border-gray-600">Closing</th>
                            <th className="p-2 text-right font-medium border border-gray-600">Loss</th>
                            <th className="p-2 text-right font-medium border border-gray-600">Reversal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assets.map(row => {
                            const parse = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;
                            const format = (num: number) => num === 0 ? '-' : num.toLocaleString('en-IN', { minimumFractionDigits: 2 });

                            const grossClosing = parse(row.grossBlockOpening) + parse(row.grossBlockAdditions) - parse(row.grossBlockDisposals);
                            const depClosing = parse(row.depreciationOpening) + parse(row.depreciationForYear) - parse(row.depreciationOnDisposals);
                            const netClosing = grossClosing - depClosing - parse(row.impairmentLoss) + parse(row.impairmentReversal);

                            return (
                                <tr key={row.id}>
                                    <td className="p-2 border border-gray-600">{row.assetClass}{row.isUnderLease ? '*' : ''}</td>
                                    <td className="p-2 border border-gray-600 text-right font-mono">{format(parse(row.grossBlockOpening))}</td>
                                    <td className="p-2 border border-gray-600 text-right font-mono">{format(parse(row.grossBlockAdditions))}</td>
                                    <td className="p-2 border border-gray-600 text-right font-mono">{format(parse(row.grossBlockDisposals))}</td>
                                    <td className="p-2 border border-gray-600 text-right font-mono bg-gray-800/50">{format(grossClosing)}</td>
                                    <td className="p-2 border border-gray-600 text-right font-mono">{format(parse(row.depreciationOpening))}</td>
                                    <td className="p-2 border border-gray-600 text-right font-mono">{format(parse(row.depreciationForYear))}</td>
                                    <td className="p-2 border border-gray-600 text-right font-mono">{format(parse(row.depreciationOnDisposals))}</td>
                                    <td className="p-2 border border-gray-600 text-right font-mono bg-gray-800/50">{format(depClosing)}</td>
                                    <td className="p-2 border border-gray-600 text-right font-mono">{format(parse(row.impairmentLoss))}</td>
                                    <td className="p-2 border border-gray-600 text-right font-mono">{format(parse(row.impairmentReversal))}</td>
                                    <td className="p-2 border border-gray-600 text-right font-mono bg-gray-800/50">{format(netClosing)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {hasLeasedAssets && <p className="text-xs italic text-gray-400 mt-2">* Represents assets held under lease.</p>}
            </div>
            {shouldShow(commitments) && (
                <div className="text-xs mt-2">
                    <p className="font-semibold text-gray-400">Contractual Commitments:</p>
                    <p className="italic text-gray-500">{getValue(commitments)}</p>
                </div>
            )}
            {shouldShow(pledgedAssets) && (
                <div className="text-xs mt-2">
                    <p className="font-semibold text-gray-400">Assets Pledged as Security:</p>
                    <p className="italic text-gray-500">{getValue(pledgedAssets)}</p>
                </div>
            )}
            {shouldShow(borrowingCostsCapitalized) && (
                <div className="text-xs mt-2">
                    <p className="font-semibold text-gray-400">Borrowing Costs Capitalized (AS 16):</p>
                    <p className="italic text-gray-500">{getValue(borrowingCostsCapitalized)}</p>
                </div>
            )}
        </div>
    );
};