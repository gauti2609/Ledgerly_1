import React, { useState, useEffect } from 'react';
import { LedgerAttributes, TrialBalanceItem, Grouping } from '../types.ts';
import { CloseIcon } from './icons.tsx';

interface AttributeEditorProps {
    ledger: TrialBalanceItem;
    grouping: Grouping | null;
    onSave: (ledgerId: string, attributes: LedgerAttributes) => void;
    onClose: () => void;
}

// Define which attributes apply to which groupings
const ATTRIBUTE_APPLICABILITY: Record<string, string[]> = {
    // Trade Payables
    'B.80.01': ['isMSME', 'isDisputed', 'ageingApplicable', 'isForeignCurrency'], // Trade Payables - MSME
    'B.80.02': ['isDisputed', 'ageingApplicable', 'isForeignCurrency'], // Trade Payables - Others
    // Trade Receivables
    'A.110.01': ['isRelatedParty', 'isDisputed', 'ageingApplicable', 'isForeignCurrency'], // Domestic
    'A.110.02': ['isRelatedParty', 'isDisputed', 'ageingApplicable', 'isForeignCurrency'], // Export
    'A.110.03': ['isRelatedParty', 'ageingApplicable'], // Unbilled
    'A.110.04': ['isRelatedParty', 'ageingApplicable'], // Retention
    // Borrowings
    'B.30.01': ['securedUnsecured', 'isRelatedParty'], // Term Loans - Banks
    'B.30.02': ['securedUnsecured', 'isRelatedParty'], // Term Loans - FIs
    'B.30.05': ['securedUnsecured', 'isRelatedParty'], // Loans from Related Parties
    'B.70.01': ['securedUnsecured'], // Cash Credit
    'B.70.02': ['securedUnsecured'], // Short-term Loans - Banks
    'B.70.05': ['securedUnsecured', 'isRelatedParty'], // ST Loans from Related Parties
    // Loans & Advances
    'A.60.02': ['isRelatedParty', 'securedUnsecured'], // Loans to Related Parties
    'A.130.03': ['isRelatedParty', 'securedUnsecured'], // ST Loans to Related Parties
    // Other Income / Expenses
    'C.20.01': ['isForeignCurrency'], // Interest Income
    'C.20.03': ['isExceptional'], // Gain on Sale of Investments
    'C.20.04': ['isForeignCurrency'], // Foreign Exchange Gain
    'C.70.01': ['isRelatedParty'], // Interest on Borrowings
};

// Default: All groupings can have these basic attributes
const DEFAULT_ATTRIBUTES = ['isCashNonCash'];

export const AttributeEditor: React.FC<AttributeEditorProps> = ({
    ledger,
    grouping,
    onSave,
    onClose
}) => {
    const [attributes, setAttributes] = useState<LedgerAttributes>(ledger.attributes || {});

    // Determine which attributes are applicable for this grouping
    const applicableAttributes = grouping?.code
        ? [...(ATTRIBUTE_APPLICABILITY[grouping.code] || []), ...DEFAULT_ATTRIBUTES]
        : DEFAULT_ATTRIBUTES;

    const handleChange = (key: keyof LedgerAttributes, value: any) => {
        setAttributes(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        onSave(ledger.id, attributes);
        onClose();
    };

    const renderAttributeInput = (attrKey: string) => {
        switch (attrKey) {
            case 'isMSME':
                return (
                    <label key={attrKey} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded transition-colors">
                        <input
                            type="checkbox"
                            checked={attributes.isMSME || false}
                            onChange={e => handleChange('isMSME', e.target.checked)}
                            className="w-4 h-4 accent-blue-500"
                        />
                        <span className="text-gray-900 dark:text-white text-sm">MSME Vendor</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">(Triggers MSME disclosure)</span>
                    </label>
                );
            case 'isRelatedParty':
                return (
                    <label key={attrKey} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded transition-colors">
                        <input
                            type="checkbox"
                            checked={attributes.isRelatedParty || false}
                            onChange={e => handleChange('isRelatedParty', e.target.checked)}
                            className="w-4 h-4 accent-blue-500"
                        />
                        <span className="text-gray-900 dark:text-white text-sm">Related Party</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">(CARO 3(iii) / 3CD-31)</span>
                    </label>
                );
            case 'securedUnsecured':
                return (
                    <div key={attrKey} className="p-2 bg-gray-50 dark:bg-gray-700 rounded transition-colors">
                        <span className="text-gray-900 dark:text-white text-sm mr-3">Security Status:</span>
                        <select
                            value={attributes.securedUnsecured || ''}
                            onChange={e => handleChange('securedUnsecured', e.target.value || null)}
                            className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white text-sm rounded px-2 py-1"
                        >
                            <option value="">Not Specified</option>
                            <option value="Secured">Secured</option>
                            <option value="Unsecured">Unsecured</option>
                        </select>
                    </div>
                );
            case 'isDisputed':
                return (
                    <label key={attrKey} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded transition-colors">
                        <input
                            type="checkbox"
                            checked={attributes.isDisputed || false}
                            onChange={e => handleChange('isDisputed', e.target.checked)}
                            className="w-4 h-4 accent-orange-500"
                        />
                        <span className="text-gray-900 dark:text-white text-sm">Disputed</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">(Separate ageing bucket)</span>
                    </label>
                );
            case 'isCashNonCash':
                return (
                    <div key={attrKey} className="p-2 bg-gray-50 dark:bg-gray-700 rounded transition-colors">
                        <span className="text-gray-900 dark:text-white text-sm mr-3">Cash Flow Type:</span>
                        <select
                            value={attributes.isCashNonCash || ''}
                            onChange={e => handleChange('isCashNonCash', e.target.value || null)}
                            className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white text-sm rounded px-2 py-1"
                        >
                            <option value="">Not Specified</option>
                            <option value="Cash">Cash</option>
                            <option value="Non-Cash">Non-Cash</option>
                        </select>
                    </div>
                );
            case 'ageingApplicable':
                return (
                    <label key={attrKey} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded transition-colors">
                        <input
                            type="checkbox"
                            checked={attributes.ageingApplicable !== false}
                            onChange={e => handleChange('ageingApplicable', e.target.checked)}
                            className="w-4 h-4 accent-blue-500"
                        />
                        <span className="text-gray-900 dark:text-white text-sm">Include in Ageing</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">(Schedule disclosure)</span>
                    </label>
                );
            case 'isForeignCurrency':
                return (
                    <label key={attrKey} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded transition-colors">
                        <input
                            type="checkbox"
                            checked={attributes.isForeignCurrency || false}
                            onChange={e => handleChange('isForeignCurrency', e.target.checked)}
                            className="w-4 h-4 accent-green-500"
                        />
                        <span className="text-gray-900 dark:text-white text-sm">Foreign Currency</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">(Forex disclosure)</span>
                    </label>
                );
            case 'isExceptional':
                return (
                    <label key={attrKey} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded transition-colors">
                        <input
                            type="checkbox"
                            checked={attributes.isExceptional || false}
                            onChange={e => handleChange('isExceptional', e.target.checked)}
                            className="w-4 h-4 accent-purple-500"
                        />
                        <span className="text-gray-900 dark:text-white text-sm">Exceptional Item</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">(P&L disclosure)</span>
                    </label>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 w-[500px] max-h-[80vh] overflow-y-auto shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Attributes</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Ledger Info */}
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mb-4 text-sm">
                    <p className="text-gray-900 dark:text-white font-medium break-all">{ledger.ledger}</p>
                    {grouping && (
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                            Mapped to: {grouping.name} ({grouping.code})
                        </p>
                    )}
                </div>

                {/* Attributes */}
                <div className="space-y-3 mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Applicable Attributes</h4>
                    {applicableAttributes.length > 0 ? (
                        applicableAttributes.map(attr => renderAttributeInput(attr))
                    ) : (
                        <p className="text-gray-500 text-sm italic">No specific attributes for this grouping.</p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-md text-sm transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                    >
                        Save Attributes
                    </button>
                </div>
            </div>
        </div>
    );
};
