

import React from 'react';
import { v4 as uuidv4 } from 'uuid';
// FIX: Add file extension to fix module resolution error.
import { RelatedPartyData, ScheduleData } from '../../types.ts';
import { PlusIcon, TrashIcon } from '../icons.tsx';

interface RelatedPartyScheduleProps {
    data: RelatedPartyData;
    onUpdate: React.Dispatch<React.SetStateAction<ScheduleData>>;
    isFinalized: boolean;
}

export const RelatedPartySchedule: React.FC<RelatedPartyScheduleProps> = ({ data, onUpdate, isFinalized }) => {

    // Party Management
    const addParty = () => {
        onUpdate(prev => ({ ...prev, relatedParties: { ...prev.relatedParties, parties: [...prev.relatedParties.parties, { id: uuidv4(), name: '', relationship: '' }] } }));
    };
    const updateParty = (id: string, field: 'name' | 'relationship', value: string) => {
        onUpdate(prev => ({ ...prev, relatedParties: { ...prev.relatedParties, parties: prev.relatedParties.parties.map(p => p.id === id ? { ...p, [field]: value } : p) } }));
    };
    const removeParty = (id: string) => {
        onUpdate(prev => ({
            ...prev, relatedParties: {
                ...prev.relatedParties,
                parties: prev.relatedParties.parties.filter(p => p.id !== id),
                transactions: prev.relatedParties.transactions.filter(t => t.relatedPartyId !== id)
            }
        }));
    };

    // Transaction Management
    const addTransaction = () => {
        if (data.parties.length === 0) return;
        onUpdate(prev => ({ ...prev, relatedParties: { ...prev.relatedParties, transactions: [...prev.relatedParties.transactions, { id: uuidv4(), relatedPartyId: data.parties[0].id, nature: '', amountCy: '', amountPy: '' }] } }));
    };
    const updateTransaction = (id: string, field: 'relatedPartyId' | 'nature' | 'amountCy' | 'amountPy', value: string) => {
        onUpdate(prev => ({ ...prev, relatedParties: { ...prev.relatedParties, transactions: prev.relatedParties.transactions.map(t => t.id === id ? { ...t, [field]: value } : t) } }));
    };
    const removeTransaction = (id: string) => {
        onUpdate(prev => ({ ...prev, relatedParties: { ...prev.relatedParties, transactions: prev.relatedParties.transactions.filter(t => t.id !== id) } }));
    };

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-semibold text-white mb-2">List of Related Parties</h3>
                <div className="space-y-2">
                    {data.parties.map(party => (
                        <div key={party.id} className="flex items-center space-x-2 bg-gray-900/50 p-2 rounded-lg">
                            <input type="text" placeholder="Name" value={party.name} onChange={e => updateParty(party.id, 'name', e.target.value)} disabled={isFinalized} className="flex-1 bg-gray-700 p-2 rounded-md" />
                            <input type="text" placeholder="Relationship" value={party.relationship} onChange={e => updateParty(party.id, 'relationship', e.target.value)} disabled={isFinalized} className="flex-1 bg-gray-700 p-2 rounded-md" />
                            {!isFinalized && <button onClick={() => removeParty(party.id)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5" /></button>}
                        </div>
                    ))}
                </div>
                {!isFinalized && <button onClick={addParty} className="mt-2 flex items-center text-sm text-brand-blue-light hover:text-white"><PlusIcon className="w-4 h-4 mr-1" /> Add Party</button>}
            </div>
            <div>
                <h3 className="text-lg font-semibold text-white mb-2">Transactions during the year</h3>
                <div className="space-y-2">
                    {data.transactions.map(txn => (
                        <div key={txn.id} className="flex items-center space-x-2 bg-gray-900/50 p-2 rounded-lg">
                            <select value={txn.relatedPartyId} onChange={e => updateTransaction(txn.id, 'relatedPartyId', e.target.value)} disabled={isFinalized} className="w-1/4 bg-gray-700 p-2 rounded-md">
                                {data.parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <input type="text" placeholder="Nature of Transaction" value={txn.nature} onChange={e => updateTransaction(txn.id, 'nature', e.target.value)} disabled={isFinalized} className="flex-1 bg-gray-700 p-2 rounded-md" />
                            <input type="text" placeholder="Amount CY" value={txn.amountCy} onChange={e => updateTransaction(txn.id, 'amountCy', e.target.value)} disabled={isFinalized} className="w-1/6 bg-gray-700 p-2 rounded-md" />
                            <input type="text" placeholder="Amount PY" value={txn.amountPy} onChange={e => updateTransaction(txn.id, 'amountPy', e.target.value)} disabled={isFinalized} className="w-1/6 bg-gray-700 p-2 rounded-md" />
                            {!isFinalized && <button onClick={() => removeTransaction(txn.id)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5" /></button>}
                        </div>
                    ))}
                </div>
                {!isFinalized && <button onClick={addTransaction} disabled={data.parties.length === 0} className="mt-2 flex items-center text-sm text-brand-blue-light hover:text-white disabled:text-gray-500 disabled:cursor-not-allowed"><PlusIcon className="w-4 h-4 mr-1" /> Add Transaction</button>}
            </div>

            <div>
                <h3 className="text-lg font-semibold text-white mb-2">Balances outstanding at year end</h3>
                <div className="space-y-2">
                    {(data.balances || []).map(bal => (
                        <div key={bal.id} className="flex items-center space-x-2 bg-gray-900/50 p-2 rounded-lg">
                            <select value={bal.relatedPartyId} onChange={e => {
                                const newBalances = (data.balances || []).map(b => b.id === bal.id ? { ...b, relatedPartyId: e.target.value } : b);
                                onUpdate(prev => ({ ...prev, relatedParties: { ...prev.relatedParties, balances: newBalances } }));
                            }} disabled={isFinalized} className="w-1/4 bg-gray-700 p-2 rounded-md">
                                {data.parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <select value={bal.balanceType} onChange={e => {
                                const newBalances = (data.balances || []).map(b => b.id === bal.id ? { ...b, balanceType: e.target.value as any } : b);
                                onUpdate(prev => ({ ...prev, relatedParties: { ...prev.relatedParties, balances: newBalances } }));
                            }} disabled={isFinalized} className="w-1/4 bg-gray-700 p-2 rounded-md">
                                <option value="Receivable">Receivable</option>
                                <option value="Payable">Payable</option>
                            </select>
                            <input type="text" placeholder="Amount CY" value={bal.amountCy} onChange={e => {
                                const newBalances = (data.balances || []).map(b => b.id === bal.id ? { ...b, amountCy: e.target.value } : b);
                                onUpdate(prev => ({ ...prev, relatedParties: { ...prev.relatedParties, balances: newBalances } }));
                            }} disabled={isFinalized} className="w-1/6 bg-gray-700 p-2 rounded-md" />
                            <input type="text" placeholder="Amount PY" value={bal.amountPy} onChange={e => {
                                const newBalances = (data.balances || []).map(b => b.id === bal.id ? { ...b, amountPy: e.target.value } : b);
                                onUpdate(prev => ({ ...prev, relatedParties: { ...prev.relatedParties, balances: newBalances } }));
                            }} disabled={isFinalized} className="w-1/6 bg-gray-700 p-2 rounded-md" />
                            {!isFinalized && <button onClick={() => {
                                const newBalances = (data.balances || []).filter(b => b.id !== bal.id);
                                onUpdate(prev => ({ ...prev, relatedParties: { ...prev.relatedParties, balances: newBalances } }));
                            }} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5" /></button>}
                        </div>
                    ))}
                </div>
                {!isFinalized && <button onClick={() => {
                    const newBalances = [...(data.balances || []), { id: uuidv4(), relatedPartyId: data.parties[0]?.id || '', balanceType: 'Payable', amountCy: '', amountPy: '' }];
                    onUpdate(prev => ({ ...prev, relatedParties: { ...prev.relatedParties, balances: newBalances as any } }));
                }} disabled={data.parties.length === 0} className="mt-2 flex items-center text-sm text-brand-blue-light hover:text-white disabled:text-gray-500 disabled:cursor-not-allowed"><PlusIcon className="w-4 h-4 mr-1" /> Add Balance</button>}
            </div>

        </div>
    );
};