

import React from 'react';
// FIX: Add file extension to fix module resolution error.
import { RelatedPartyData } from '../../../types.ts';

interface RelatedPartyNoteProps {
    data: RelatedPartyData;
}

const formatCurrency = (val: string): string => {
    const num = parseFloat(val.replace(/,/g, ''));
    if (isNaN(num) || num === 0) return '-';
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

export const RelatedPartyNote: React.FC<RelatedPartyNoteProps> = ({ data }) => {

    const groupedTransactions = data.parties.map(party => {
        return {
            ...party,
            transactions: data.transactions.filter(t => t.relatedPartyId === party.id)
        }
    }).filter(p => p.transactions.length > 0);

    return (
        <div className="space-y-6">
            <div>
                <h4 className="font-semibold text-gray-300">a. List of related parties and relationships</h4>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    {data.parties.map(party => (
                        <li key={party.id}>
                            <span className="font-semibold">{party.name}</span> - {party.relationship}
                        </li>
                    ))}
                    {data.parties.length === 0 && <p className="text-xs text-gray-500">No related parties have been defined.</p>}
                </ul>
            </div>
            <div>
                <h4 className="font-semibold text-gray-300">b. Transactions with related parties</h4>
                <div className="overflow-x-auto mt-2">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="p-2 text-left font-medium w-1/4">Relationship</th>
                                <th className="p-2 text-left font-medium w-1/4">Name</th>
                                <th className="p-2 text-left font-medium w-1/4">Nature of Transaction</th>
                                <th className="p-2 text-right font-medium">Amount CY (₹)</th>
                                <th className="p-2 text-right font-medium">Amount PY (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-600">
                            {groupedTransactions.length > 0 ? groupedTransactions.map(party =>
                                party.transactions.map((txn, index) => (
                                    <tr key={txn.id}>
                                        {index === 0 && <td className="p-2" rowSpan={party.transactions.length}>{party.relationship}</td>}
                                        {index === 0 && <td className="p-2 font-semibold" rowSpan={party.transactions.length}>{party.name}</td>}
                                        <td className="p-2">{txn.nature}</td>
                                        <td className="p-2 text-right font-mono">{formatCurrency(txn.amountCy)}</td>
                                        <td className="p-2 text-right font-mono">{formatCurrency(txn.amountPy)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-xs text-gray-500">No transactions with related parties recorded.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <div>
                <h4 className="font-semibold text-gray-300">c. Balances outstanding at year end</h4>
                <div className="overflow-x-auto mt-2">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="p-2 text-left font-medium w-1/4">Relationship</th>
                                <th className="p-2 text-left font-medium w-1/4">Name</th>
                                <th className="p-2 text-left font-medium w-1/4">Balance Type</th>
                                <th className="p-2 text-right font-medium">Amount CY (₹)</th>
                                <th className="p-2 text-right font-medium">Amount PY (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-600">
                            {(data.balances && data.balances.length > 0) ? data.balances.map(bal => {
                                const party = data.parties.find(p => p.id === bal.relatedPartyId);
                                return (
                                    <tr key={bal.id}>
                                        <td className="p-2">{party?.relationship || '-'}</td>
                                        <td className="p-2 font-semibold">{party?.name || '-'}</td>
                                        <td className="p-2">{bal.balanceType}</td>
                                        <td className="p-2 text-right font-mono">{formatCurrency(bal.amountCy)}</td>
                                        <td className="p-2 text-right font-mono">{formatCurrency(bal.amountPy)}</td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-xs text-gray-500">No balances outstanding.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};