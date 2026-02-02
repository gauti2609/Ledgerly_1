// components/schedules/PartnerOwnerFundsSchedule.tsx
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PartnersFundsData, PartnerAccountRow } from '../../types.ts';
import { PlusIcon, TrashIcon } from '../icons.tsx';

interface PartnerOwnerFundsScheduleProps {
    title: string;
    data: PartnersFundsData;
    onUpdate: (data: PartnersFundsData) => void;
    isFinalized: boolean;
}

const AccountTable: React.FC<{
    title: string;
    items: PartnerAccountRow[];
    type: 'capitalAccount' | 'currentAccount';
    onUpdate: (type: 'capitalAccount' | 'currentAccount', id: string, field: keyof PartnerAccountRow, value: string) => void;
    onAdd: (type: 'capitalAccount' | 'currentAccount') => void;
    onRemove: (type: 'capitalAccount' | 'currentAccount', id: string) => void;
    isFinalized: boolean;
}> = ({ title, items, type, onUpdate, onAdd, onRemove, isFinalized }) => {
    
    const parse = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;

    return (
        <div>
            <h4 className="text-md font-semibold text-gray-300 mb-2">{title}</h4>
            <div className="overflow-x-auto border border-gray-600 rounded-lg">
                <table className="min-w-full text-xs">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="p-2 text-left">Partner/Owner Name</th>
                            {type === 'capitalAccount' && <th className="p-2 text-right">Agreed Contribution</th>}
                            {type === 'capitalAccount' && <th className="p-2 text-right">Profit Share %</th>}
                            <th className="p-2 text-right">Opening</th>
                            <th className="p-2 text-right">Introduced/Contributed</th>
                            <th className="p-2 text-right">Remuneration</th>
                            <th className="p-2 text-right">Interest</th>
                            <th className="p-2 text-right">Withdrawals</th>
                            <th className="p-2 text-right">Share of Profit/(Loss)</th>
                            <th className="p-2 text-right">Closing</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                        {items.map(item => {
                            const closing = parse(item.opening) + parse(item.introduced) + parse(item.remuneration) + parse(item.interest) - parse(item.withdrawals) + parse(item.profitShare);
                            return (
                            <tr key={item.id}>
                                <td className="p-1 flex items-center">
                                    {!isFinalized && <button onClick={() => onRemove(type, item.id)} className="p-1 text-gray-500 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>}
                                    <input value={item.partnerName} onChange={e=>onUpdate(type, item.id, 'partnerName', e.target.value)} disabled={isFinalized} className="w-full bg-transparent p-1 border-none focus:ring-0 focus:outline-none focus:bg-gray-700/50"/>
                                </td>
                                {type === 'capitalAccount' && <td className="p-0"><input value={item.agreedContribution} onChange={e=>onUpdate(type, item.id, 'agreedContribution', e.target.value)} disabled={isFinalized} className="w-full h-full bg-transparent p-1 text-right border-none focus:ring-0 focus:outline-none focus:bg-gray-700/50"/></td>}
                                {type === 'capitalAccount' && <td className="p-0"><input value={item.profitSharePercentage} onChange={e=>onUpdate(type, item.id, 'profitSharePercentage', e.target.value)} disabled={isFinalized} className="w-full h-full bg-transparent p-1 text-right border-none focus:ring-0 focus:outline-none focus:bg-gray-700/50"/></td>}
                                <td className="p-0"><input value={item.opening} onChange={e=>onUpdate(type, item.id, 'opening', e.target.value)} disabled={isFinalized} className="w-full h-full bg-transparent p-1 text-right border-none focus:ring-0 focus:outline-none focus:bg-gray-700/50"/></td>
                                <td className="p-0"><input value={item.introduced} onChange={e=>onUpdate(type, item.id, 'introduced', e.target.value)} disabled={isFinalized} className="w-full h-full bg-transparent p-1 text-right border-none focus:ring-0 focus:outline-none focus:bg-gray-700/50"/></td>
                                <td className="p-0"><input value={item.remuneration} onChange={e=>onUpdate(type, item.id, 'remuneration', e.target.value)} disabled={isFinalized} className="w-full h-full bg-transparent p-1 text-right border-none focus:ring-0 focus:outline-none focus:bg-gray-700/50"/></td>
                                <td className="p-0"><input value={item.interest} onChange={e=>onUpdate(type, item.id, 'interest', e.target.value)} disabled={isFinalized} className="w-full h-full bg-transparent p-1 text-right border-none focus:ring-0 focus:outline-none focus:bg-gray-700/50"/></td>
                                <td className="p-0"><input value={item.withdrawals} onChange={e=>onUpdate(type, item.id, 'withdrawals', e.target.value)} disabled={isFinalized} className="w-full h-full bg-transparent p-1 text-right border-none focus:ring-0 focus:outline-none focus:bg-gray-700/50"/></td>
                                <td className="p-0"><input value={item.profitShare} onChange={e=>onUpdate(type, item.id, 'profitShare', e.target.value)} disabled={isFinalized} className="w-full h-full bg-transparent p-1 text-right border-none focus:ring-0 focus:outline-none focus:bg-gray-700/50"/></td>
                                <td className="p-2 text-right font-mono bg-gray-800/50">{closing.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
            {!isFinalized && <button onClick={() => onAdd(type)} className="mt-2 flex items-center text-sm text-brand-blue-light hover:text-white"><PlusIcon className="w-4 h-4 mr-1"/> Add Row</button>}
        </div>
    )
};


export const PartnerOwnerFundsSchedule: React.FC<PartnerOwnerFundsScheduleProps> = ({ title, data, onUpdate, isFinalized }) => {

    const handleUpdate = (type: 'capitalAccount' | 'currentAccount', id: string, field: keyof PartnerAccountRow, value: string) => {
        onUpdate({ ...data, [type]: data[type].map(r => r.id === id ? { ...r, [field]: value } : r) });
    };

    const addRow = (type: 'capitalAccount' | 'currentAccount') => {
        // FIX: Added missing previous year properties to align with the 'PartnerAccountRow' type definition.
        const newRow: PartnerAccountRow = { id: uuidv4(), partnerName: '', opening: '0', introduced: '0', remuneration: '0', interest: '0', withdrawals: '0', profitShare: '0', closing: '0', agreedContribution: '0', profitSharePercentage: '0', openingPy: '0', introducedPy: '0', remunerationPy: '0', interestPy: '0', withdrawalsPy: '0', profitSharePy: '0' };
        onUpdate({ ...data, [type]: [...data[type], newRow] });
    };

    const removeRow = (type: 'capitalAccount' | 'currentAccount', id: string) => {
        onUpdate({ ...data, [type]: data[type].filter(r => r.id !== id) });
    };
    
    return (
        <div className="space-y-8">
            <h3 className="text-lg font-semibold text-white">{title} Schedule</h3>
            <AccountTable 
                title="Capital Account"
                items={data.capitalAccount}
                type="capitalAccount"
                onUpdate={handleUpdate}
                onAdd={addRow}
                onRemove={removeRow}
                isFinalized={isFinalized}
            />
             <AccountTable 
                title="Current Account"
                items={data.currentAccount}
                type="currentAccount"
                onUpdate={handleUpdate}
                onAdd={addRow}
                onRemove={removeRow}
                isFinalized={isFinalized}
            />
        </div>
    );
};
