import React from 'react';
import { TrialBalanceItem, Masters } from '../types.ts';
import { SearchIcon, CloseIcon, CheckCircleIcon, InformationCircleIcon } from './icons.tsx';

interface TrialBalanceTableProps {
    ledgers: TrialBalanceItem[];
    activeLedgerId: string | null;
    onSelectLedger: (id: string) => void;
    selectedLedgerIds: Set<string>;
    onToggleSelection: (id: string, shiftKey: boolean) => void;
    onSelectAll: (select: boolean) => void;
    masters: Masters;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    isProcessing?: boolean;
    onBulkApprove?: () => void;
    onBulkReject?: () => void;
}

const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(num);
};

export const TrialBalanceTable: React.FC<TrialBalanceTableProps> = ({
    ledgers,
    activeLedgerId,
    onSelectLedger,
    selectedLedgerIds,
    onToggleSelection,
    onSelectAll,
    searchTerm,
    onSearchChange,
    masters,
    isProcessing,
    onBulkApprove,
    onBulkReject
}) => {
    const allSelected = ledgers.length > 0 && ledgers.every(l => selectedLedgerIds.has(l.id));
    const someSelected = ledgers.some(l => selectedLedgerIds.has(l.id)) && !allSelected;

    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm dark:shadow-none">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">To Be Mapped ({ledgers.length})</h2>
                    {isProcessing && (
                        <span className="text-xs text-purple-600 dark:text-purple-400 animate-pulse">Getting AI suggestions...</span>
                    )}
                </div>
                <div className="flex items-center">
                    {selectedLedgerIds.size > 0 && onBulkApprove && onBulkReject && (
                        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md px-3 py-1 mr-4 border border-gray-200 dark:border-gray-600">
                            <span className="text-gray-700 dark:text-white text-xs font-semibold mr-3">{selectedLedgerIds.size} Selected</span>
                            <button
                                onClick={onBulkApprove}
                                className="flex items-center text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors mr-3"
                                title="Approve Selected"
                            >
                                <CheckCircleIcon className="w-4 h-4 mr-1" />
                                <span className="text-xs">Approve</span>
                            </button>
                            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mr-3"></div>
                            <button
                                onClick={onBulkReject}
                                className="flex items-center text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                title="Reject Selected"
                            >
                                <CloseIcon className="w-4 h-4 mr-1" />
                                <span className="text-xs">Reject</span>
                            </button>
                        </div>
                    )}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search ledgers..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-48 pl-10 pr-8 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-brand-blue"
                        />
                        {searchTerm && (
                            <button onClick={() => onSearchChange('')} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <CloseIcon className="h-4 w-4 text-gray-400 hover:text-gray-900 dark:hover:text-white" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10 shadow-sm">
                        <tr>
                            <th className="p-2 w-8 bg-gray-50 dark:bg-gray-800">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={input => { if (input) input.indeterminate = someSelected; }}
                                    onChange={(e) => onSelectAll(e.target.checked)}
                                    className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-brand-blue focus:ring-brand-blue"
                                />
                            </th>
                            <th className="p-2 text-left font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">Ledger Name</th>
                            <th className="p-2 text-left font-medium text-purple-600 dark:text-purple-300 bg-gray-50 dark:bg-gray-800">Suggested Major</th>
                            <th className="p-2 text-left font-medium text-purple-600 dark:text-purple-300 bg-gray-50 dark:bg-gray-800">Suggested Minor</th>
                            <th className="p-2 text-left font-medium text-purple-600 dark:text-purple-300 bg-gray-50 dark:bg-gray-800">Suggested Grouping</th>
                            <th className="p-2 text-right font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">Balance (CY)</th>
                            <th className="p-2 w-8 bg-gray-50 dark:bg-gray-800"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {ledgers.length > 0 ? ledgers.map((item, index) => (
                            <tr
                                key={item.id}
                                onClick={() => onSelectLedger(item.id)}
                                className={`cursor-pointer transition-colors ${activeLedgerId === item.id
                                    ? 'bg-blue-50 dark:bg-brand-blue/20'
                                    : selectedLedgerIds.has(item.id)
                                        ? 'bg-purple-50 dark:bg-purple-900/20'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                <td className="p-2" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selectedLedgerIds.has(item.id)}
                                        onChange={(e) => onToggleSelection(item.id, (e.nativeEvent as any).shiftKey)}
                                        className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-brand-blue focus:ring-brand-blue"
                                    />
                                </td>
                                <td className="p-2 font-medium text-gray-900 dark:text-gray-200">{item.ledger}</td>
                                <td className="p-2 text-sm text-purple-700 dark:text-purple-200">
                                    {item.suggestedMajorHeadCode
                                        ? masters.majorHeads.find(h => h.code === item.suggestedMajorHeadCode)?.name || item.suggestedMajorHeadCode
                                        : <span className="text-gray-400 dark:text-gray-500">-</span>}
                                </td>
                                <td className="p-2 text-sm text-purple-700 dark:text-purple-200">
                                    {item.suggestedMinorHeadCode
                                        ? masters.minorHeads.find(h => h.code === item.suggestedMinorHeadCode)?.name || item.suggestedMinorHeadCode
                                        : <span className="text-gray-400 dark:text-gray-500">-</span>}
                                </td>
                                <td className="p-2 text-sm text-purple-700 dark:text-purple-200 font-medium">
                                    {item.suggestedGroupingCode
                                        ? masters.groupings.find(g => g.code === item.suggestedGroupingCode)?.name || item.suggestedGroupingCode
                                        : <span className="text-gray-400 dark:text-gray-500">-</span>}
                                </td>
                                <td className="p-2 text-right font-mono text-gray-700 dark:text-gray-300">{formatCurrency(item.closingCy)}</td>
                                <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                                    {item.suggestionReasoning && (
                                        <div className="group relative inline-block">
                                            <InformationCircleIcon className="w-4 h-4 text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 cursor-help" />
                                            <div className={`hidden group-hover:block absolute right-full mr-2 w-64 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-50 text-xs text-gray-700 dark:text-gray-200 whitespace-normal text-left ${index >= ledgers.length - 2 ? 'bottom-0' : 'top-0'}`}>
                                                <div className="font-semibold text-purple-700 dark:text-purple-300 mb-1">AI Reasoning:</div>
                                                {item.suggestionReasoning}
                                            </div>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="p-4 text-center text-gray-500">
                                    No unmapped ledgers. All items have been mapped.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};