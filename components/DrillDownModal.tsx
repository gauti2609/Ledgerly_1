
import React from 'react';
import { TrialBalanceItem } from '../types.ts';
import { CloseIcon } from './icons.tsx';

interface DrillDownModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupingName: string;
    ledgers: TrialBalanceItem[];
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({ isOpen, onClose, groupingName, ledgers }) => {
    if (!isOpen) return null;

    const totalCy = ledgers.reduce((sum, item) => sum + item.closingCy, 0);
    const totalPy = ledgers.reduce((sum, item) => sum + item.closingPy, 0);

    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[80vh] flex flex-col">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 rounded-t-lg">
                    <div>
                        <h2 className="text-xl font-bold text-white">{groupingName}</h2>
                        <p className="text-xs text-gray-400 mt-1">Breakdown of underlying ledgers</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex-1 overflow-auto p-0">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 bg-gray-800 uppercase sticky top-0">
                            <tr>
                                <th className="px-6 py-3">Ledger Name</th>
                                <th className="px-6 py-3 text-right">Amount CY</th>
                                <th className="px-6 py-3 text-right">Amount PY</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledgers.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                                        No ledgers found for this grouping.
                                    </td>
                                </tr>
                            ) : (
                                ledgers.map((ledger) => (
                                    <tr key={ledger.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="px-6 py-3 font-medium text-white">{ledger.ledger}</td>
                                        <td className="px-6 py-3 text-right font-mono text-cyan-400">
                                            {ledger.closingCy.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-3 text-right font-mono text-gray-400">
                                            {ledger.closingPy.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="bg-gray-900/50 font-bold text-white sticky bottom-0">
                            <tr>
                                <td className="px-6 py-3">Total</td>
                                <td className="px-6 py-3 text-right font-mono text-cyan-400">
                                    {totalCy.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-3 text-right font-mono text-gray-400">
                                    {totalPy.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <footer className="p-4 border-t border-gray-700 bg-gray-900/50 rounded-b-lg flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-md transition-colors text-sm"
                    >
                        Close
                    </button>
                </footer>
            </div>
        </div>
    );
};
