// components/reports/notes/ConstructionContractsNote.tsx
import React from 'react';
import { ConstructionContractData } from '../../../types.ts';

interface ConstructionContractsNoteProps {
    data: ConstructionContractData;
}

const format = (val: string) => {
    const num = parseFloat(val) || 0;
    return num === 0 ? '-' : num.toLocaleString('en-IN', {minimumFractionDigits: 2});
};

export const ConstructionContractsNote: React.FC<ConstructionContractsNoteProps> = ({ data }) => {
    
    const parse = (val: string) => parseFloat(val) || 0;
    
    const totalRevenue = data.items.reduce((sum, item) => sum + parse(item.contractRevenue), 0);
    const totalCosts = data.items.reduce((sum, item) => sum + parse(item.costsIncurred), 0);
    const totalAdvances = data.items.reduce((sum, item) => sum + parse(item.advancesReceived), 0);
    const totalRetentions = data.items.reduce((sum, item) => sum + parse(item.retentions), 0);
    
    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-400">
                Disclosures as required by Accounting Standard (AS) 7 on Construction Contracts.
            </p>
            <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="p-2 text-left">Contract</th>
                            <th className="p-2 text-right">Contract Revenue</th>
                            <th className="p-2 text-right">Costs Incurred & Profits Recognised</th>
                            <th className="p-2 text-right">Advances Received</th>
                            <th className="p-2 text-right">Retentions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                        {data.items.map(item => (
                            <tr key={item.id}>
                                <td className="p-2">{item.contractName}</td>
                                <td className="p-2 text-right font-mono">{format(item.contractRevenue)}</td>
                                <td className="p-2 text-right font-mono">{format(item.costsIncurred)}</td>
                                <td className="p-2 text-right font-mono">{format(item.advancesReceived)}</td>
                                <td className="p-2 text-right font-mono">{format(item.retentions)}</td>
                            </tr>
                        ))}
                        <tr className="font-bold bg-gray-700/30">
                            <td className="p-2">Total</td>
                            <td className="p-2 text-right font-mono">{totalRevenue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                            <td className="p-2 text-right font-mono">{totalCosts.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                            <td className="p-2 text-right font-mono">{totalAdvances.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                            <td className="p-2 text-right font-mono">{totalRetentions.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
