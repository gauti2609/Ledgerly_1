import React, { useState } from 'react';
import {
    ConsolidatedData,
    ConsolidationGroup,
    ConsolidatedTrialBalanceItem,
} from '../../types.ts';
import { ChartBarIcon, TableCellsIcon } from '../icons.tsx';

interface ConsolidatedReportsProps {
    consolidatedData: ConsolidatedData | null;
    group: ConsolidationGroup;
}

type ReportView = 'balance-sheet' | 'pnl' | 'detailed-tb';

export const ConsolidatedReports: React.FC<ConsolidatedReportsProps> = ({
    consolidatedData,
    group,
}) => {
    const [activeView, setActiveView] = useState<ReportView>('balance-sheet');
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const formatAmount = (amount: number) => {
        const absAmount = Math.abs(amount);
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(absAmount);
    };

    const toggleExpand = (code: string) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(code)) {
                next.delete(code);
            } else {
                next.add(code);
            }
            return next;
        });
    };

    if (!consolidatedData) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <ChartBarIcon className="w-16 h-16 mb-4 opacity-50" />
                <p>Click "Generate Report" to create consolidated statements</p>
                <p className="text-sm text-gray-600 mt-2">
                    Make sure you have added at least one subsidiary
                </p>
            </div>
        );
    }

    // Group consolidated TB by major head
    const groupedByMajorHead = consolidatedData.consolidatedTB.reduce((acc, item) => {
        if (!acc[item.majorHeadCode]) {
            acc[item.majorHeadCode] = {
                name: item.majorHeadName,
                items: [],
                totalCy: 0,
                totalPy: 0,
            };
        }
        acc[item.majorHeadCode].items.push(item);
        acc[item.majorHeadCode].totalCy += item.consolidatedCy;
        acc[item.majorHeadCode].totalPy += item.consolidatedPy;
        return acc;
    }, {} as Record<string, { name: string; items: ConsolidatedTrialBalanceItem[]; totalCy: number; totalPy: number }>);

    // Filter for Balance Sheet (Major Heads A and B)
    const assetsItems = consolidatedData.consolidatedTB.filter(i => i.majorHeadCode === 'A');
    const liabilitiesItems = consolidatedData.consolidatedTB.filter(i => i.majorHeadCode === 'B');

    // Filter for P&L (Major Head C)
    const pnlItems = consolidatedData.consolidatedTB.filter(i => i.majorHeadCode === 'C');

    const ViewButton: React.FC<{ view: ReportView; label: string }> = ({ view, label }) => (
        <button
            onClick={() => setActiveView(view)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === view
                    ? 'bg-brand-blue text-white'
                    : 'bg-gray-700 text-gray-400 hover:text-white'
                }`}
        >
            {label}
        </button>
    );

    const renderTableRow = (item: ConsolidatedTrialBalanceItem, indent: number = 0) => {
        const isExpanded = expandedItems.has(item.groupingCode);
        const hasBreakdown = item.entityBreakdown.length > 1;

        return (
            <React.Fragment key={item.groupingCode}>
                <tr
                    className="hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => hasBreakdown && toggleExpand(item.groupingCode)}
                >
                    <td className="px-4 py-2 text-left" style={{ paddingLeft: `${indent * 16 + 16}px` }}>
                        <span className="flex items-center">
                            {hasBreakdown && (
                                <span className="mr-2 text-gray-500">{isExpanded ? '▼' : '▶'}</span>
                            )}
                            <span className="text-gray-400 text-xs mr-2">{item.groupingCode}</span>
                            {item.groupingName}
                        </span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                        {formatAmount(item.closingCy)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-orange-400">
                        {item.eliminationCy !== 0 ? `(${formatAmount(item.eliminationCy)})` : '-'}
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-medium text-white">
                        {formatAmount(item.consolidatedCy)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-gray-400">
                        {formatAmount(item.consolidatedPy)}
                    </td>
                </tr>
                {isExpanded && hasBreakdown && (
                    <>
                        {item.entityBreakdown.map(eb => (
                            <tr key={`${item.groupingCode}-${eb.entityId}`} className="bg-gray-800/50 text-sm">
                                <td className="px-4 py-1.5 text-gray-500 italic" style={{ paddingLeft: '48px' }}>
                                    ↳ {eb.entityName}
                                </td>
                                <td className="px-4 py-1.5 text-right font-mono text-gray-500">
                                    {formatAmount(eb.amountCy)}
                                </td>
                                <td className="px-4 py-1.5"></td>
                                <td className="px-4 py-1.5"></td>
                                <td className="px-4 py-1.5 text-right font-mono text-gray-600">
                                    {formatAmount(eb.amountPy)}
                                </td>
                            </tr>
                        ))}
                    </>
                )}
            </React.Fragment>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium text-white">
                        Consolidated Financial Statements
                    </h3>
                    <p className="text-sm text-gray-400">
                        {group.name} • {1 + group.subsidiaries.length} entities
                    </p>
                </div>
                <div className="flex gap-2">
                    <ViewButton view="balance-sheet" label="Balance Sheet" />
                    <ViewButton view="pnl" label="Statement of P&L" />
                    <ViewButton view="detailed-tb" label="Detailed TB" />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-400">Total Assets</div>
                    <div className="text-xl font-bold text-green-400">
                        {formatAmount(consolidatedData.totalAssetsCy)}
                    </div>
                    <div className="text-xs text-gray-500">PY: {formatAmount(consolidatedData.totalAssetsPy)}</div>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-400">Total Liabilities & Equity</div>
                    <div className="text-xl font-bold text-blue-400">
                        {formatAmount(consolidatedData.totalLiabilitiesCy)}
                    </div>
                    <div className="text-xs text-gray-500">PY: {formatAmount(consolidatedData.totalLiabilitiesPy)}</div>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-400">Total Revenue</div>
                    <div className="text-xl font-bold text-white">
                        {formatAmount(consolidatedData.totalRevenueCy)}
                    </div>
                    <div className="text-xs text-gray-500">PY: {formatAmount(consolidatedData.totalRevenuePy)}</div>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-400">Net Profit / (Loss)</div>
                    <div className={`text-xl font-bold ${consolidatedData.netProfitCy >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {consolidatedData.netProfitCy >= 0 ? '' : '('}{formatAmount(consolidatedData.netProfitCy)}{consolidatedData.netProfitCy < 0 ? ')' : ''}
                    </div>
                    <div className="text-xs text-gray-500">PY: {formatAmount(consolidatedData.netProfitPy)}</div>
                </div>
            </div>

            {/* Minority Interest */}
            {consolidatedData.minorityInterests.length > 0 && (
                <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                    <h4 className="font-medium text-yellow-400 mb-2">Minority Interest</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        {consolidatedData.minorityInterests.map(mi => (
                            <div key={mi.entityId} className="p-2 bg-gray-800 rounded">
                                <div className="font-medium">{mi.entityName}</div>
                                <div className="text-gray-400">
                                    {mi.minorityPct}% minority
                                </div>
                                <div className="mt-1">
                                    <span className="text-gray-500">Equity: </span>
                                    <span className="text-white">{formatAmount(mi.equityCy)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Report Content */}
            <div className="bg-gray-700/50 rounded-lg overflow-hidden">
                {activeView === 'balance-sheet' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-400">Particulars</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-400">Aggregate</th>
                                    <th className="px-4 py-3 text-right font-medium text-orange-400">Eliminations</th>
                                    <th className="px-4 py-3 text-right font-medium text-white">Consolidated CY</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-400">Consolidated PY</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Assets Section */}
                                <tr className="bg-green-500/10">
                                    <td colSpan={5} className="px-4 py-2 font-bold text-green-400">
                                        ASSETS
                                    </td>
                                </tr>
                                {assetsItems.map(item => renderTableRow(item))}
                                <tr className="bg-green-500/20 font-bold">
                                    <td className="px-4 py-2">Total Assets</td>
                                    <td className="px-4 py-2 text-right font-mono">
                                        {formatAmount(assetsItems.reduce((s, i) => s + i.closingCy, 0))}
                                    </td>
                                    <td className="px-4 py-2 text-right font-mono text-orange-400">
                                        ({formatAmount(assetsItems.reduce((s, i) => s + i.eliminationCy, 0))})
                                    </td>
                                    <td className="px-4 py-2 text-right font-mono text-white">
                                        {formatAmount(consolidatedData.totalAssetsCy)}
                                    </td>
                                    <td className="px-4 py-2 text-right font-mono text-gray-400">
                                        {formatAmount(consolidatedData.totalAssetsPy)}
                                    </td>
                                </tr>

                                {/* Liabilities Section */}
                                <tr className="bg-blue-500/10">
                                    <td colSpan={5} className="px-4 py-2 font-bold text-blue-400">
                                        EQUITY AND LIABILITIES
                                    </td>
                                </tr>
                                {liabilitiesItems.map(item => renderTableRow(item))}
                                <tr className="bg-blue-500/20 font-bold">
                                    <td className="px-4 py-2">Total Equity & Liabilities</td>
                                    <td className="px-4 py-2 text-right font-mono">
                                        {formatAmount(liabilitiesItems.reduce((s, i) => s + i.closingCy, 0))}
                                    </td>
                                    <td className="px-4 py-2 text-right font-mono text-orange-400">
                                        ({formatAmount(liabilitiesItems.reduce((s, i) => s + i.eliminationCy, 0))})
                                    </td>
                                    <td className="px-4 py-2 text-right font-mono text-white">
                                        {formatAmount(consolidatedData.totalLiabilitiesCy)}
                                    </td>
                                    <td className="px-4 py-2 text-right font-mono text-gray-400">
                                        {formatAmount(consolidatedData.totalLiabilitiesPy)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {activeView === 'pnl' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-400">Particulars</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-400">Aggregate</th>
                                    <th className="px-4 py-3 text-right font-medium text-orange-400">Eliminations</th>
                                    <th className="px-4 py-3 text-right font-medium text-white">Consolidated CY</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-400">Consolidated PY</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pnlItems.map(item => renderTableRow(item))}
                                <tr className="bg-gray-800 font-bold border-t border-gray-600">
                                    <td className="px-4 py-3">Net Profit / (Loss)</td>
                                    <td></td>
                                    <td></td>
                                    <td className={`px-4 py-3 text-right font-mono ${consolidatedData.netProfitCy >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatAmount(consolidatedData.netProfitCy)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-gray-400">
                                        {formatAmount(consolidatedData.netProfitPy)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {activeView === 'detailed-tb' && (
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-800 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-400">Grouping</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-400">Aggregate CY</th>
                                    <th className="px-4 py-3 text-right font-medium text-orange-400">Eliminations</th>
                                    <th className="px-4 py-3 text-right font-medium text-white">Consolidated CY</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-400">Consolidated PY</th>
                                </tr>
                            </thead>
                            <tbody>
                                {consolidatedData.consolidatedTB.map(item => renderTableRow(item))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Elimination Details */}
            {group.eliminations.length > 0 && (
                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
                    <h4 className="font-medium text-orange-400 mb-2">Eliminations Applied</h4>
                    <ul className="text-sm space-y-1">
                        {group.eliminations.map(elim => (
                            <li key={elim.id} className="flex justify-between">
                                <span className="text-gray-400">{elim.description}</span>
                                <span className="text-orange-400">{formatAmount(elim.amountCy)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
