import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { InvestmentsScheduleData, InvestmentItem, ManualInput } from '../../types.ts';
import { PlusIcon, TrashIcon } from '../icons.tsx';
import { InputWithCheckbox } from '../InputWithCheckbox.tsx';

interface InvestmentsScheduleProps {
    data: InvestmentsScheduleData;
    onUpdate: (data: InvestmentsScheduleData) => void;
    isFinalized: boolean;
}

export const InvestmentsSchedule: React.FC<InvestmentsScheduleProps> = ({ data, onUpdate, isFinalized }) => {

    const handleItemUpdate = (id: string, field: keyof Omit<InvestmentItem, 'id'>, value: string) => {
        onUpdate({ ...data, items: data.items.map(item => item.id === id ? { ...item, [field]: value } : item) });
    };

    const handleFieldUpdate = (field: keyof InvestmentsScheduleData, value: ManualInput) => {
        onUpdate({ ...data, [field]: value });
    }

    const addItem = () => {
        const newRow: InvestmentItem = { id: uuidv4(), particular: '', classification: 'unquoted', marketValue: '', amountCy: '', amountPy: '', basisOfValuation: '' };
        onUpdate({ ...data, items: [...data.items, newRow] });
    };

    const removeItem = (id: string) => {
        onUpdate({ ...data, items: data.items.filter(item => item.id !== id) });
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Investments Schedule</h3>
            <div className="space-y-2">
                {data.items.map(item => (
                    <div key={item.id} className="space-y-2 bg-gray-900/50 p-3 rounded-lg">
                        <div className="grid grid-cols-12 gap-2 items-center">
                            <input type="text" placeholder="Particular of Investment" value={item.particular} onChange={e => handleItemUpdate(item.id, 'particular', e.target.value)} disabled={isFinalized} className="col-span-5 bg-gray-700 p-2 rounded-md" />
                            <select value={item.classification} onChange={e => handleItemUpdate(item.id, 'classification', e.target.value)} disabled={isFinalized} className="col-span-2 bg-gray-700 p-2 rounded-md">
                                <option value="unquoted">Unquoted</option>
                                <option value="quoted">Quoted</option>
                            </select>
                            <input type="text" placeholder="Market Value" value={item.marketValue} onChange={e => handleItemUpdate(item.id, 'marketValue', e.target.value)} disabled={isFinalized || item.classification === 'unquoted'} className="col-span-2 bg-gray-700 p-2 rounded-md text-right" />
                            <input type="text" placeholder="Cost (CY)" value={item.amountCy} onChange={e => handleItemUpdate(item.id, 'amountCy', e.target.value)} disabled={isFinalized} className="col-span-2 bg-gray-700 p-2 rounded-md text-right" />
                            {!isFinalized && <button onClick={() => removeItem(item.id)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5" /></button>}
                        </div>
                        <input type="text" placeholder="Basis of Valuation (if not at cost)" value={item.basisOfValuation} onChange={e => handleItemUpdate(item.id, 'basisOfValuation', e.target.value)} disabled={isFinalized} className="w-full bg-gray-700/50 p-2 rounded-md text-sm italic" />
                    </div>
                ))}
            </div>
            {!isFinalized && <button onClick={addItem} className="flex items-center text-sm text-brand-blue-light hover:text-white"><PlusIcon className="w-4 h-4 mr-1" /> Add Investment</button>}

            <div className="mt-4">
                <InputWithCheckbox
                    label="Aggregate Provision for Diminution in Value"
                    value={data.provisionForDiminution}
                    onChange={(v) => handleFieldUpdate('provisionForDiminution', v)}
                    disabled={isFinalized}
                />
            </div>
        </div>
    );
};