// components/schedules/LoansAndAdvancesSchedule.tsx
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { LoansAndAdvancesScheduleData, LoanAdvanceItem, ManualInput } from '../../types.ts';
import { PlusIcon, TrashIcon } from '../icons.tsx';
import { InputWithCheckbox } from '../InputWithCheckbox.tsx';

interface LoansAndAdvancesScheduleProps {
    data: LoansAndAdvancesScheduleData;
    onUpdate: (data: LoansAndAdvancesScheduleData) => void;
    isFinalized: boolean;
}

export const LoansAndAdvancesSchedule: React.FC<LoansAndAdvancesScheduleProps> = ({ data, onUpdate, isFinalized }) => {

    const handleItemUpdate = (id: string, field: keyof Omit<LoanAdvanceItem, 'id'>, value: string) => {
        onUpdate({ ...data, items: data.items.map(item => item.id === id ? { ...item, [field]: value } : item) });
    };

    const handleFieldUpdate = (field: keyof LoansAndAdvancesScheduleData, value: ManualInput) => {
        onUpdate({ ...data, [field]: value });
    }

    const addItem = () => {
        const newRow: LoanAdvanceItem = { id: uuidv4(), particular: '', security: 'unsecured', status: 'good', amountCy: '', amountPy: '' };
        onUpdate({ ...data, items: [...data.items, newRow] });
    };

    const removeItem = (id: string) => {
        onUpdate({ ...data, items: data.items.filter(item => item.id !== id) });
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Loans and Advances Schedule</h3>
            <div className="space-y-2">
                {data.items.map(item => (
                    <div key={item.id} className="flex items-center space-x-2 bg-gray-900/50 p-2 rounded-lg">
                        <input type="text" placeholder="Particulars of Loan/Advance" value={item.particular} onChange={e => handleItemUpdate(item.id, 'particular', e.target.value)} disabled={isFinalized} className="flex-1 bg-gray-700 p-2 rounded-md" />
                        <select value={item.security} onChange={e => handleItemUpdate(item.id, 'security', e.target.value)} disabled={isFinalized} className="bg-gray-700 p-2 rounded-md">
                            <option value="unsecured">Unsecured</option>
                            <option value="secured">Secured</option>
                        </select>
                        <select value={item.status} onChange={e => handleItemUpdate(item.id, 'status', e.target.value)} disabled={isFinalized} className="bg-gray-700 p-2 rounded-md">
                            <option value="good">Good</option>
                            <option value="doubtful">Doubtful</option>
                        </select>
                        <input type="text" placeholder="Amount CY" value={item.amountCy} onChange={e => handleItemUpdate(item.id, 'amountCy', e.target.value)} disabled={isFinalized} className="w-1/6 bg-gray-700 p-2 rounded-md text-right" />
                        <input type="text" placeholder="Amount PY" value={item.amountPy} onChange={e => handleItemUpdate(item.id, 'amountPy', e.target.value)} disabled={isFinalized} className="w-1/6 bg-gray-700 p-2 rounded-md text-right" />
                        {!isFinalized && <button onClick={() => removeItem(item.id)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5" /></button>}
                    </div>
                ))}
            </div>
            {!isFinalized && <button onClick={addItem} className="flex items-center text-sm text-brand-blue-light hover:text-white"><PlusIcon className="w-4 h-4 mr-1" /> Add Item</button>}

            <div className="mt-4">
                <InputWithCheckbox
                    label="Allowance for bad and doubtful loans and advances"
                    value={data.allowanceForBadAndDoubtful}
                    onChange={(v) => handleFieldUpdate('allowanceForBadAndDoubtful', v)}
                    disabled={isFinalized}
                />
            </div>
        </div>
    );
};