import React, { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ARAPListData, ARAPEntry, TrialBalanceItem } from '../../types.ts';
import { PlusIcon, TrashIcon, CloudArrowUpIcon, ExclamationCircleIcon, CheckCircleIcon } from '../icons.tsx';
import { useNumberFormat } from '../../context/NumberFormatContext.tsx';

interface ARAPInputSheetProps {
    title: string;
    type: 'AR' | 'AP';
    data: ARAPListData;
    onUpdate: (data: ARAPListData) => void;
    isFinalized: boolean;
    trialBalanceData: TrialBalanceItem[];
}

const PartyAmountInput: React.FC<{ value: string; onChange: (value: string) => void; disabled: boolean; }> = ({ value, onChange, disabled }) => {
    const { formatAmount, parseAmount } = useNumberFormat();
    const [displayValue, setDisplayValue] = React.useState(formatAmount(value));

    React.useEffect(() => {
        setDisplayValue(formatAmount(value));
    }, [value, formatAmount]);

    return (
        <input
            type="text"
            value={displayValue}
            onChange={(e) => setDisplayValue(e.target.value)}
            onBlur={() => {
                const parsed = parseAmount(displayValue);
                onChange(parsed);
                setDisplayValue(formatAmount(parsed));
            }}
            disabled={disabled}
            className="bg-transparent border-none focus:ring-0 text-white p-0 text-right font-mono"
        />
    );
};

export const ARAPInputSheet: React.FC<ARAPInputSheetProps> = ({ title, type, data, onUpdate, isFinalized, trialBalanceData }) => {
    const { formatAmount } = useNumberFormat();
    const [importError, setImportError] = useState<string | null>(null);

    const targetGroupingPrefix = type === 'AR' ? 'A.110' : 'B.80';
    const targetLedgerName = type === 'AR' ? 'Trade Receivables' : 'Trade Payables';

    const tbBalance = useMemo(() => {
        return trialBalanceData
            .filter(item => item.groupingCode?.startsWith(targetGroupingPrefix))
            .reduce((sum, item) => sum + item.closingCy, 0);
    }, [trialBalanceData, targetGroupingPrefix]);

    const totals = useMemo(() => {
        let tradeTotal = 0;
        let advancesTotal = 0;
        let netTotal = 0;

        data.entries.forEach(entry => {
            const amount = parseFloat(entry.amount) || 0;
            netTotal += amount;
            if (type === 'AR') {
                // AR: Positive = Trade Receivable, Negative = Advance from Customer
                if (amount >= 0) tradeTotal += amount;
                else advancesTotal += Math.abs(amount);
            } else {
                // AP: Negative = Trade Payable, Positive = Advance to Vendor
                if (amount <= 0) tradeTotal += Math.abs(amount);
                else advancesTotal += amount;
            }
        });

        return { tradeTotal, advancesTotal, netTotal };
    }, [data.entries, type]);

    const isMatch = Math.abs(totals.netTotal - tbBalance) < 0.01;

    const handleAddRow = () => {
        const newEntry: ARAPEntry = { id: uuidv4(), partyName: '', amount: '0' };
        onUpdate({ ...data, entries: [...data.entries, newEntry] });
    };

    const handleUpdateRow = (id: string, field: keyof ARAPEntry, value: string) => {
        const newEntries = data.entries.map(e => e.id === id ? { ...e, [field]: value } : e);
        onUpdate({ ...data, entries: newEntries });
    };

    const handleRemoveRow = (id: string) => {
        onUpdate({ ...data, entries: data.entries.filter(e => e.id !== id) });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const fileResult = event.target?.result;
                let rows: string[][] = [];

                if (file.name.endsWith('.csv')) {
                    const text = fileResult as string;
                    rows = text.split('\n')
                        .filter(row => row.trim() !== '')
                        .map(row => row.split(',').map(s => s.trim()));
                } else {
                    // Handle Excel
                    const { read, utils } = await import('xlsx');
                    const workbook = read(fileResult, { type: 'binary' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    rows = utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
                }

                if (rows.length < 2) {
                    setImportError("File appears to be empty or missing header row.");
                    return;
                }

                const newEntries: ARAPEntry[] = rows.slice(1)
                    .filter(row => row[0]) // Ensure party name exists
                    .map(row => {
                        return {
                            id: uuidv4(),
                            partyName: String(row[0] || 'Unknown Party'),
                            amount: String(row[1] || '0')
                        };
                    });

                onUpdate({ ...data, entries: [...data.entries, ...newEntries] });
                setImportError(null);
            } catch (err) {
                console.error("Import error:", err);
                setImportError("Failed to parse file. Please use 'Party Name, Amount' format.");
            }
        };

        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsBinaryString(file);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <p className="text-sm text-gray-400">Manage individual party balances and categorize advances.</p>
                </div>
                {!isFinalized && (
                    <div className="flex space-x-3">
                        <label className="flex items-center px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md cursor-pointer transition-colors text-sm font-medium">
                            <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                            Import CSV/Excel
                            <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
                        </label>
                        <button
                            onClick={handleAddRow}
                            className="flex items-center px-4 py-2 bg-brand-blue hover:bg-blue-600 text-white rounded-md transition-colors text-sm font-medium"
                        >
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Add Party
                        </button>
                    </div>
                )}
            </div>

            {importError && (
                <div className="p-3 bg-red-900/30 border border-red-800 rounded-md flex items-center text-red-400 text-sm">
                    <ExclamationCircleIcon className="w-5 h-5 mr-2" />
                    {importError}
                </div>
            )}

            {/* Reconciliation Widget */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                    <span className="block text-xs text-gray-400 uppercase font-bold mb-1">List Net Total</span>
                    <span className="text-xl font-mono text-white">{formatAmount(totals.netTotal)}</span>
                </div>
                <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                    <span className="block text-xs text-gray-400 uppercase font-bold mb-1">Trial Balance ({targetLedgerName})</span>
                    <span className="text-xl font-mono text-white">{formatAmount(tbBalance)}</span>
                </div>
                <div className={`p-4 border rounded-lg flex flex-col justify-center ${isMatch ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
                    <div className="flex items-center">
                        {isMatch ? <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2" /> : <ExclamationCircleIcon className="w-5 h-5 text-red-400 mr-2" />}
                        <span className={`text-xs uppercase font-bold ${isMatch ? 'text-green-400' : 'text-red-400'}`}>
                            {isMatch ? 'Match Found' : 'Balance Mismatch'}
                        </span>
                    </div>
                    {!isMatch && (
                        <span className="text-xs text-red-300 mt-1">Difference: {formatAmount(totals.netTotal - tbBalance)}</span>
                    )}
                </div>
                <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                    <span className="block text-xs text-blue-400 uppercase font-bold mb-1">
                        {type === 'AR' ? 'Advance from Customers' : 'Advance to Vendors'}
                    </span>
                    <span className="text-xl font-mono text-white">{formatAmount(totals.advancesTotal)}</span>
                </div>
            </div>

            {/* Classification Summary */}
            <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Classification Detail</h4>
                <div className="grid grid-cols-2 gap-8 text-center">
                    <div>
                        <div className="text-xs text-gray-400 mb-1">{type === 'AR' ? 'Trade Receivables / Debtors' : 'Trade Payables / Creditors'}</div>
                        <div className="text-lg font-bold text-white">{formatAmount(totals.tradeTotal)}</div>
                        <div className="text-[10px] text-gray-500 mt-1">{type === 'AR' ? '(Positive Balances)' : '(Negative Balances)'}</div>
                        <div className="text-[10px] text-brand-blue-light mt-1">Mapped to: {type === 'AR' ? 'Current Assets' : 'Current Liabilities'}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 mb-1">{type === 'AR' ? 'Advance from Customers' : 'Advance to Vendors'}</div>
                        <div className="text-lg font-bold text-white">{formatAmount(totals.advancesTotal)}</div>
                        <div className="text-[10px] text-gray-500 mt-1">{type === 'AR' ? '(Negative Balances)' : '(Positive Balances)'}</div>
                        <div className="text-[10px] text-brand-blue-light mt-1">Mapped to: {type === 'AR' ? 'Other Current Liabilities' : 'Other Current Assets'}</div>
                    </div>
                </div>
            </div>

            {/* Party List Table */}
            <div className="border border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-700/50 text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Party Name</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                            <th className="px-4 py-3 text-center">Category Tag</th>
                            {!isFinalized && <th className="px-4 py-3 w-10"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {data.entries.length === 0 ? (
                            <tr>
                                <td colSpan={isFinalized ? 3 : 4} className="px-4 py-8 text-center text-gray-500 italic">
                                    No parties added. Click 'Add Party' or 'Import CSV' to populate.
                                </td>
                            </tr>
                        ) : (
                            data.entries.map(entry => {
                                const amount = parseFloat(entry.amount) || 0;
                                let tag = "";
                                if (type === 'AR') {
                                    tag = amount >= 0 ? "Debtor" : "Advance (Liability)";
                                } else {
                                    tag = amount <= 0 ? "Creditor" : "Advance (Asset)";
                                }

                                return (
                                    <tr key={entry.id} className="hover:bg-gray-750 transition-colors">
                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                value={entry.partyName}
                                                onChange={(e) => handleUpdateRow(entry.id, 'partyName', e.target.value)}
                                                disabled={isFinalized}
                                                placeholder="Enter Party Name..."
                                                className="w-full bg-transparent border-none focus:ring-0 text-white p-0"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <PartyAmountInput
                                                value={entry.amount}
                                                onChange={(v) => handleUpdateRow(entry.id, 'amount', v)}
                                                disabled={isFinalized}
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${(type === 'AR' && amount >= 0) || (type === 'AP' && amount <= 0)
                                                ? 'bg-blue-900/40 text-blue-400'
                                                : 'bg-amber-900/40 text-amber-400'
                                                }`}>
                                                {tag}
                                            </span>
                                        </td>
                                        {!isFinalized && (
                                            <td className="px-4 py-2 text-center">
                                                <button
                                                    onClick={() => handleRemoveRow(entry.id)}
                                                    className="text-gray-500 hover:text-red-400 transition-colors"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
