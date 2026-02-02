import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AccountingPoliciesData, ScheduleData, ManualInput } from '../../../types.ts';
import { PlusIcon, TrashIcon, SparklesIcon } from '../../icons.tsx';
import * as geminiService from '../../../services/geminiService.ts';
import { InputWithCheckbox } from '../../InputWithCheckbox.tsx';

// To be robust, handle string | ManualInput
const getValue = (val: string | ManualInput): string => typeof val === 'string' ? val : val.value;
const shouldShow = (val: string | ManualInput): boolean => typeof val === 'string' ? val.length > 0 : val.isSelected;

const TOKEN = window.localStorage.getItem('token') || '';

interface AccountingPoliciesNoteProps {
    data: AccountingPoliciesData;
    onUpdate?: React.Dispatch<React.SetStateAction<ScheduleData>>;
    isFinalized?: boolean;
}

export const AccountingPoliciesNote: React.FC<AccountingPoliciesNoteProps> = ({ data, onUpdate, isFinalized = false }) => {
    const [generatingId, setGeneratingId] = useState<string | null>(null);

    const handleBasisUpdate = (value: ManualInput) => {
        if (onUpdate) onUpdate(prev => ({ ...prev, accountingPolicies: { ...prev.accountingPolicies, basisOfPreparation: value } }));
    };

    const handlePolicyUpdate = (id: string, field: 'title' | 'policy', value: string | ManualInput) => {
        if (onUpdate) onUpdate(prev => ({ ...prev, accountingPolicies: { ...prev.accountingPolicies, policies: prev.accountingPolicies.policies.map(p => p.id === id ? { ...p, [field]: value } : p) } }));
    };

    const addPolicy = () => {
        if (onUpdate) onUpdate(prev => ({ ...prev, accountingPolicies: { ...prev.accountingPolicies, policies: [...prev.accountingPolicies.policies, { id: uuidv4(), title: '', policy: { value: '', isSelected: false } }] } }));
    };

    const removePolicy = (id: string) => {
        if (onUpdate) onUpdate(prev => ({ ...prev, accountingPolicies: { ...prev.accountingPolicies, policies: prev.accountingPolicies.policies.filter(p => p.id !== id) } }));
    };

    const handleGeneratePolicy = async (policyId: string) => {
        const topic = window.prompt("Enter the topic for the accounting policy (e.g., 'Revenue Recognition', 'Impairment of Assets'):");
        if (!topic) return;

        setGeneratingId(policyId);
        try {
            const prompt = `Write a standard accounting policy for a private limited company in India based on Indian Accounting Standards (AS) for the following topic: ${topic}.`;
            const result = await geminiService.generateText(TOKEN, prompt);

            // Logic: keep existing selection state if it exists, otherwise select it (since user just generated it)
            const currentPolicy = data.policies.find(p => p.id === policyId)?.policy;
            const currentIsSelected = typeof currentPolicy === 'string' ? true : currentPolicy?.isSelected ?? true;

            handlePolicyUpdate(policyId, 'policy', { value: result, isSelected: currentIsSelected });

            if (!data.policies.find(p => p.id === policyId)?.title) {
                handlePolicyUpdate(policyId, 'title', topic);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to generate policy.");
        } finally {
            setGeneratingId(null);
        }
    };

    // For the display version in the Notes To Accounts
    if (!onUpdate) {
        return (
            <div className="space-y-4 text-sm">
                {shouldShow(data.basisOfPreparation) && (
                    <div>
                        <h4 className="font-semibold text-gray-300">a. Basis of Preparation</h4>
                        <p className="mt-1">{getValue(data.basisOfPreparation)}</p>
                    </div>
                )}
                <div>
                    <h4 className="font-semibold text-gray-300">b. Significant Accounting Policies</h4>
                    <div className="mt-2 space-y-3">
                        {data.policies.map(p => (shouldShow(p.policy) && (
                            <div key={p.id}>
                                <h5 className="font-semibold text-gray-400">{p.title}</h5>
                                <p className="mt-1 text-sm">{getValue(p.policy)}</p>
                            </div>
                        )))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Significant Accounting Policies</h3>
            <div>
                <InputWithCheckbox
                    label="Basis of Preparation"
                    value={data.basisOfPreparation}
                    onChange={handleBasisUpdate}
                    disabled={isFinalized}
                    rows={3}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Policies</label>
                <div className="space-y-4">
                    {data.policies.map(p => (
                        <div key={p.id} className="flex items-start space-x-2 bg-gray-900/50 p-3 rounded-lg">
                            <div className="flex-1 space-y-2">
                                <input
                                    type="text"
                                    placeholder="Policy Title (e.g., a) Revenue Recognition)"
                                    value={p.title}
                                    onChange={e => handlePolicyUpdate(p.id, 'title', e.target.value)}
                                    disabled={isFinalized}
                                    className="block w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white font-semibold disabled:bg-gray-800 disabled:cursor-not-allowed"
                                />
                                <div className="relative">
                                    <InputWithCheckbox
                                        placeholder="Policy content..."
                                        value={p.policy}
                                        onChange={val => handlePolicyUpdate(p.id, 'policy', val)}
                                        disabled={isFinalized}
                                        rows={4}
                                    />
                                    {!isFinalized && (
                                        <button
                                            onClick={() => handleGeneratePolicy(p.id)}
                                            disabled={generatingId === p.id}
                                            className="absolute top-2 right-2 p-1.5 rounded-full bg-gray-600/50 hover:bg-brand-blue/50 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                                            title="Generate with AI"
                                        >
                                            {generatingId === p.id ? (
                                                <div className="w-4 h-4 border-2 border-transparent border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <SparklesIcon className="w-4 h-4" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                            {!isFinalized && (
                                <button onClick={() => removePolicy(p.id)} className="p-2 text-gray-400 hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors mt-1">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                {!isFinalized && (
                    <button onClick={addPolicy} className="mt-4 flex items-center text-sm text-brand-blue-light hover:text-white transition-colors font-medium">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Add Policy
                    </button>
                )}
            </div>
        </div>
    );
};