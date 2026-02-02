// components/schedules/ConstructionContractsSchedule.tsx
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ConstructionContractData, ConstructionContractItem } from '../../types.ts';
import { PlusIcon, TrashIcon } from '../icons.tsx';

interface ConstructionContractsScheduleProps {
    data: ConstructionContractData;
    onUpdate: (data: ConstructionContractData) => void;
    isFinalized: boolean;
}

export const ConstructionContractsSchedule: React.FC<ConstructionContractsScheduleProps> = ({ data, onUpdate, isFinalized }) => {

    const handleUpdate = (id: string, field: keyof Omit<ConstructionContractItem, 'id'>, value: string) => {
        onUpdate({ items: data.items.map(item => item.id === id ? { ...item, [field]: value } : item) });
    };

    const addRow = () => {
        const newRow: ConstructionContractItem = {
            id: uuidv4(),
            contractName: '',
            contractRevenue: '0',
            costsIncurred: '0',
            profitsRecognised: '0',
            advancesReceived: '0',
            retentions: '0',
        };
        onUpdate({ items: [...data.items, newRow] });
    };

    const removeRow = (id: string) => {
        onUpdate({ items: data.items.filter(item => item.id !== id) });
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">AS 7: Construction Contracts</h3>
            <p className="text-sm text-gray-400">Enter details for each significant construction contract in progress.</p>
            
            <div className="space-y-4">
                {data.items.map(item => (
                    <div key={item.id} className="bg-gray-900/50 p-4 rounded-lg space-y-3 relative">
                        {!isFinalized && (
                             <button onClick={() => removeRow(item.id)} className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-400">
                                <TrashIcon className="w-4 h-4"/>
                            </button>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Contract Name / Description" value={item.contractName} onChange={v => handleUpdate(item.id, 'contractName', v)} disabled={isFinalized} />
                            <InputField label="Contract Revenue Recognised" value={item.contractRevenue} onChange={v => handleUpdate(item.id, 'contractRevenue', v)} disabled={isFinalized} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <InputField label="Costs Incurred & Recognised Profits" value={item.costsIncurred} onChange={v => handleUpdate(item.id, 'costsIncurred', v)} disabled={isFinalized} />
                            <InputField label="Recognised Profits (Less Losses)" value={item.profitsRecognised} onChange={v => handleUpdate(item.id, 'profitsRecognised', v)} disabled={isFinalized} />
                            <InputField label="Advances Received" value={item.advancesReceived} onChange={v => handleUpdate(item.id, 'advancesReceived', v)} disabled={isFinalized} />
                            <InputField label="Retentions" value={item.retentions} onChange={v => handleUpdate(item.id, 'retentions', v)} disabled={isFinalized} />
                        </div>
                    </div>
                ))}
            </div>

            {!isFinalized && (
                <button onClick={addRow} className="mt-4 flex items-center text-sm text-brand-blue-light hover:text-white transition-colors font-medium">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Contract
                </button>
            )}
             {data.items.length === 0 && <p className="text-sm text-gray-500">No construction contracts added.</p>}
        </div>
    );
};


const InputField: React.FC<{ label: string; value: string; onChange: (value: string) => void; disabled: boolean; }> = 
({ label, value, onChange, disabled }) => (
    <div>
        <label className="block text-xs font-medium text-gray-400">{label}</label>
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white text-sm disabled:bg-gray-800 disabled:cursor-not-allowed"
        />
    </div>
);
