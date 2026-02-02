
import React, { useState } from 'react';
// Force HMR update
// FIX: Add file extension to fix module resolution error.
import { TrialBalanceItem, Masters, NoteLineItem, LedgerAttributes, Grouping } from '../types.ts';
import { exportMappedLedgersToExcel } from '../services/exportService.ts';
import { InformationCircleIcon, PencilIcon, ArrowUturnLeftIcon } from './icons.tsx';
import { AttributeEditor } from './AttributeEditor.tsx';

// Download icon
const DownloadIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

// Search icon
const SearchIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

interface MappedLedgersTableProps {
    ledgers: TrialBalanceItem[];
    masters: Masters;
    noteLineItems: NoteLineItem[];
    activeLedgerId?: string | null;
    onSelectLedger?: (id: string) => void;
    // Bulk selection props
    selectedMappedIds?: Set<string>;
    onToggleMappedSelection?: (id: string) => void;
    onSelectAllMapped?: (select: boolean) => void;
    // Attribute editing
    onUpdateAttributes?: (ledgerId: string, attributes: LedgerAttributes) => void;
    // New: Unmap functionality
    onUnmapLedger?: (ledgerId: string) => void;
}

const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(num);
};

// Helper to render attribute badges
const AttributeBadges: React.FC<{ attributes?: LedgerAttributes }> = ({ attributes }) => {
    if (!attributes) return <span className="text-gray-500 text-xs">-</span>;

    const badges: { label: string; color: string }[] = [];

    if (attributes.isMSME) badges.push({ label: 'MSME', color: 'bg-green-600' });
    if (attributes.isRelatedParty) badges.push({ label: 'RP', color: 'bg-purple-600' });
    if (attributes.securedUnsecured === 'Secured') badges.push({ label: 'Sec', color: 'bg-blue-600' });
    if (attributes.securedUnsecured === 'Unsecured') badges.push({ label: 'Unsec', color: 'bg-yellow-600' });
    if (attributes.isDisputed) badges.push({ label: 'Disputed', color: 'bg-red-600' });
    if (attributes.isForeignCurrency) badges.push({ label: 'FC', color: 'bg-cyan-600' });
    if (attributes.isExceptional) badges.push({ label: 'Exc', color: 'bg-orange-600' });

    if (badges.length === 0) return <span className="text-gray-500 text-xs">-</span>;

    return (
        <div className="flex flex-wrap gap-1">
            {badges.map((b, i) => (
                <span key={i} className={`${b.color} text-white text-[10px] px-1.5 py-0.5 rounded font-medium`}>
                    {b.label}
                </span>
            ))}
        </div>
    );
};

export const MappedLedgersTable: React.FC<MappedLedgersTableProps> = ({
    ledgers,
    masters,
    noteLineItems,
    activeLedgerId,
    onSelectLedger,
    selectedMappedIds = new Set(),
    onToggleMappedSelection,
    onSelectAllMapped,
    onUpdateAttributes,
    onUnmapLedger
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingLedger, setEditingLedger] = useState<TrialBalanceItem | null>(null);

    // Create lookup maps
    const majorHeadMap = new Map<string, string>(masters.majorHeads.map(m => [m.code, m.name]));
    const minorHeadMap = new Map<string, string>(masters.minorHeads.map(m => [m.code, m.name]));
    const groupingMap = new Map<string, string>(masters.groupings.map(g => [g.code, g.name]));
    const groupingLookup = new Map<string, Grouping>(masters.groupings.map(g => [g.code, g]));

    // Filter ledgers by search term
    const filteredLedgers = ledgers.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        const major = majorHeadMap.get(item.majorHeadCode || '') || '';
        const minor = minorHeadMap.get(item.minorHeadCode || '') || '';
        const grouping = groupingMap.get(item.groupingCode || '') || '';
        return item.ledger.toLowerCase().includes(searchLower) ||
            major.toLowerCase().includes(searchLower) ||
            minor.toLowerCase().includes(searchLower) ||
            grouping.toLowerCase().includes(searchLower);
    });

    const allSelected = filteredLedgers.length > 0 && filteredLedgers.every(l => selectedMappedIds.has(l.id));
    const someSelected = filteredLedgers.some(l => selectedMappedIds.has(l.id));

    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm dark:shadow-none">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mapped ({filteredLedgers.length}/{ledgers.length})</h2>
                <div className="flex items-center gap-2">
                    {selectedMappedIds.size > 0 && (
                        <span className="text-sm text-purple-600 dark:text-purple-400">{selectedMappedIds.size} selected</span>
                    )}
                    {ledgers.length > 0 && (
                        <button
                            onClick={() => exportMappedLedgersToExcel(ledgers, masters)}
                            className="flex items-center gap-1 px-2 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                            title="Export mapped ledgers to Excel"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            Export
                        </button>
                    )}
                </div>
            </div>
            {/* Search input */}
            <div className="relative mb-2">
                <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search mapped ledgers..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
            </div>
            <div className="flex-1 overflow-y-auto">
                <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm">
                        <tr>
                            {onToggleMappedSelection && (
                                <th className="p-2 w-10 bg-gray-50 dark:bg-gray-800">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                                        onChange={() => onSelectAllMapped && onSelectAllMapped(!allSelected)}
                                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-purple-600 focus:ring-purple-500"
                                    />
                                </th>
                            )}
                            <th className="p-2 text-left font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">Ledger Name</th>
                            <th className="p-2 text-left font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">Major Head</th>
                            <th className="p-2 text-left font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">Minor Head</th>
                            <th className="p-2 text-left font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">Grouping</th>
                            <th className="p-2 text-left font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">Attributes</th>
                            <th className="p-2 text-right font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">Balance (CY)</th>
                            <th className="p-2 w-16 bg-gray-50 dark:bg-gray-800"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredLedgers.length > 0 ? filteredLedgers.map((item, index) => (
                            <tr
                                key={item.id}
                                className={`cursor-pointer transition-colors ${activeLedgerId === item.id ? 'bg-blue-50 dark:bg-brand-blue/20' : selectedMappedIds.has(item.id) ? 'bg-purple-50 dark:bg-purple-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
                                onClick={() => onSelectLedger && onSelectLedger(item.id)}
                            >
                                {onToggleMappedSelection && (
                                    <td className="p-2" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedMappedIds.has(item.id)}
                                            onChange={() => onToggleMappedSelection(item.id)}
                                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-purple-600 focus:ring-purple-500"
                                        />
                                    </td>
                                )}
                                <td className="p-2 text-gray-900 dark:text-white">{item.ledger}</td>
                                <td className="p-2 text-gray-600 dark:text-gray-300">{majorHeadMap.get(item.majorHeadCode || '') || item.majorHeadCode || '-'}</td>
                                <td className="p-2 text-gray-600 dark:text-gray-300">{minorHeadMap.get(item.minorHeadCode || '') || item.minorHeadCode || '-'}</td>
                                <td className="p-2 text-gray-600 dark:text-gray-300">{groupingMap.get(item.groupingCode || '') || item.groupingCode || '-'}</td>
                                <td className="p-2" onClick={e => e.stopPropagation()}>
                                    <AttributeBadges attributes={item.attributes} />
                                </td>
                                <td className="p-2 text-right font-mono text-gray-700 dark:text-gray-300">{formatCurrency(item.closingCy)}</td>
                                <td className="p-2 text-center flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    {onUnmapLedger && (
                                        <button
                                            onClick={() => onUnmapLedger(item.id)}
                                            className="p-1 text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                                            title="Undo Mapping (Unmap)"
                                        >
                                            <ArrowUturnLeftIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                    {onUpdateAttributes && (
                                        <button
                                            onClick={() => setEditingLedger(item)}
                                            className="p-1 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                                            title="Edit Attributes"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                    {item.suggestionReasoning && (
                                        <div className="group relative inline-block">
                                            <InformationCircleIcon className="w-4 h-4 text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 cursor-help" />
                                            <div className={`hidden group-hover:block absolute right-full mr-2 w-64 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-50 text-xs text-gray-700 dark:text-gray-200 whitespace-normal text-left ${index >= filteredLedgers.length - 2 ? 'bottom-0' : 'top-0'}`}>
                                                <div className="font-semibold text-purple-700 dark:text-purple-300 mb-1">AI Reasoning:</div>
                                                {item.suggestionReasoning}
                                            </div>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={onToggleMappedSelection ? 8 : 7} className="p-4 text-center text-gray-500">
                                    {ledgers.length === 0 ? 'No ledgers have been mapped yet.' : 'No matching ledgers found.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Attribute Editor Modal */}
            {editingLedger && onUpdateAttributes && (
                <AttributeEditor
                    ledger={editingLedger}
                    grouping={editingLedger.groupingCode ? groupingLookup.get(editingLedger.groupingCode) || null : null}
                    onSave={onUpdateAttributes}
                    onClose={() => setEditingLedger(null)}
                />
            )}
        </div>
    );
};
