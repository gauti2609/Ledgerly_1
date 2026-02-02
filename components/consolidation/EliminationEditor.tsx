import React, { useState } from 'react';
import {
    InterCompanyElimination,
    EliminationType,
} from '../../types.ts';
import { PlusIcon, TrashIcon } from '../icons.tsx';

interface EliminationEditorProps {
    eliminations: InterCompanyElimination[];
    onAddElimination: (elimination: InterCompanyElimination) => void;
    onRemoveElimination: (eliminationId: string) => void;
}

const ELIMINATION_TYPES: { value: EliminationType; label: string; description: string }[] = [
    { value: 'investment', label: 'Investment Elimination', description: 'Eliminate investment in subsidiary against subsidiary share capital' },
    { value: 'receivable-payable', label: 'Receivable/Payable', description: 'Eliminate inter-company receivables and payables' },
    { value: 'revenue-expense', label: 'Revenue/Expense', description: 'Eliminate inter-company sales and purchases' },
    { value: 'dividend', label: 'Dividend', description: 'Eliminate inter-company dividends' },
    { value: 'other', label: 'Other', description: 'Other inter-company eliminations' },
];

export const EliminationEditor: React.FC<EliminationEditorProps> = ({
    eliminations,
    onAddElimination,
    onRemoveElimination,
}) => {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        eliminationType: 'receivable-payable' as EliminationType,
        debitGroupingCode: '',
        debitGroupingName: '',
        creditGroupingCode: '',
        creditGroupingName: '',
        amountCy: 0,
        amountPy: 0,
    });

    const handleSubmit = () => {
        if (!formData.description || !formData.debitGroupingCode || !formData.creditGroupingCode || formData.amountCy <= 0) {
            return;
        }

        const newElimination: InterCompanyElimination = {
            id: crypto.randomUUID(),
            description: formData.description,
            eliminationType: formData.eliminationType,
            debitGroupingCode: formData.debitGroupingCode,
            debitGroupingName: formData.debitGroupingName || formData.debitGroupingCode,
            creditGroupingCode: formData.creditGroupingCode,
            creditGroupingName: formData.creditGroupingName || formData.creditGroupingCode,
            amountCy: formData.amountCy,
            amountPy: formData.amountPy,
        };

        onAddElimination(newElimination);
        setFormData({
            description: '',
            eliminationType: 'receivable-payable',
            debitGroupingCode: '',
            debitGroupingName: '',
            creditGroupingCode: '',
            creditGroupingName: '',
            amountCy: 0,
            amountPy: 0,
        });
        setShowForm(false);
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(Math.abs(amount));
    };

    const getTypeColor = (type: EliminationType) => {
        switch (type) {
            case 'investment': return 'bg-purple-500/20 text-purple-400';
            case 'receivable-payable': return 'bg-blue-500/20 text-blue-400';
            case 'revenue-expense': return 'bg-green-500/20 text-green-400';
            case 'dividend': return 'bg-yellow-500/20 text-yellow-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium text-white">Inter-Company Eliminations</h3>
                    <p className="text-sm text-gray-400">
                        Add elimination entries to remove inter-company transactions from consolidated statements
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue-dark"
                >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Elimination
                </button>
            </div>

            {/* Eliminations List */}
            {eliminations.length === 0 ? (
                <div className="p-8 bg-gray-700/30 rounded-lg border border-dashed border-gray-600 text-center">
                    <p className="text-gray-500 mb-2">No eliminations added yet.</p>
                    <p className="text-sm text-gray-600">
                        Add elimination entries to remove inter-company balances and transactions.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {eliminations.map(elim => (
                        <div
                            key={elim.id}
                            className="p-4 bg-gray-700 rounded-lg border border-gray-600"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(elim.eliminationType)}`}>
                                            {ELIMINATION_TYPES.find(t => t.value === elim.eliminationType)?.label}
                                        </span>
                                        <span className="text-white font-medium">{elim.description}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Debit: </span>
                                            <span className="text-red-400">{elim.debitGroupingName}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Credit: </span>
                                            <span className="text-green-400">{elim.creditGroupingName}</span>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex gap-4 text-sm">
                                        <span>
                                            <span className="text-gray-500">CY: </span>
                                            <span className="text-white font-medium">{formatAmount(elim.amountCy)}</span>
                                        </span>
                                        <span>
                                            <span className="text-gray-500">PY: </span>
                                            <span className="text-gray-400">{formatAmount(elim.amountPy)}</span>
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onRemoveElimination(elim.id)}
                                    className="p-2 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Summary */}
                    <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Total Eliminations (CY)</span>
                            <span className="text-xl font-bold text-white">
                                {formatAmount(eliminations.reduce((sum, e) => sum + e.amountCy, 0))}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg border border-gray-700">
                        <h3 className="text-lg font-bold mb-4">Add Elimination Entry</h3>

                        <div className="space-y-4">
                            {/* Description */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="e.g., Inter-company loan balance"
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"
                                />
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Elimination Type</label>
                                <select
                                    value={formData.eliminationType}
                                    onChange={e => setFormData({ ...formData, eliminationType: e.target.value as EliminationType })}
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"
                                >
                                    {ELIMINATION_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Debit Account */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Debit Grouping Code</label>
                                    <input
                                        type="text"
                                        value={formData.debitGroupingCode}
                                        onChange={e => setFormData({ ...formData, debitGroupingCode: e.target.value })}
                                        placeholder="e.g., A.120.01"
                                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Debit Name</label>
                                    <input
                                        type="text"
                                        value={formData.debitGroupingName}
                                        onChange={e => setFormData({ ...formData, debitGroupingName: e.target.value })}
                                        placeholder="e.g., Loan to Subsidiary"
                                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Credit Account */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Credit Grouping Code</label>
                                    <input
                                        type="text"
                                        value={formData.creditGroupingCode}
                                        onChange={e => setFormData({ ...formData, creditGroupingCode: e.target.value })}
                                        placeholder="e.g., B.70.01"
                                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Credit Name</label>
                                    <input
                                        type="text"
                                        value={formData.creditGroupingName}
                                        onChange={e => setFormData({ ...formData, creditGroupingName: e.target.value })}
                                        placeholder="e.g., Loan from Parent"
                                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Amounts */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Amount (Current Year)</label>
                                    <input
                                        type="number"
                                        value={formData.amountCy}
                                        onChange={e => setFormData({ ...formData, amountCy: Number(e.target.value) })}
                                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Amount (Previous Year)</label>
                                    <input
                                        type="number"
                                        value={formData.amountPy}
                                        onChange={e => setFormData({ ...formData, amountPy: Number(e.target.value) })}
                                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!formData.description || !formData.debitGroupingCode || !formData.creditGroupingCode || formData.amountCy <= 0}
                                className="px-4 py-2 bg-brand-blue rounded-lg hover:bg-brand-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Elimination
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
