import React from 'react';
// FIX: Add file extension to fix module resolution error.
import { TaxExpenseData, ScheduleData } from '../../types.ts';

interface TaxExpenseScheduleProps {
    data: TaxExpenseData;
    onUpdate: React.Dispatch<React.SetStateAction<ScheduleData>>;
    isFinalized: boolean;
}

const InputField: React.FC<{ label: string; value: string; onChange: (value: string) => void; disabled: boolean; }> = 
({ label, value, onChange, disabled }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400">{label}</label>
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white disabled:bg-gray-800 disabled:cursor-not-allowed"
        />
    </div>
);


export const TaxExpenseSchedule: React.FC<TaxExpenseScheduleProps> = ({ data, onUpdate, isFinalized }) => {

    const handleUpdate = (field: keyof TaxExpenseData, value: string) => {
        onUpdate(prev => ({ ...prev, taxExpense: { ...prev.taxExpense, [field]: value } }));
    };

    const parse = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;
    const total = parse(data.currentTax) + parse(data.deferredTax);
    
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Tax Expense</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Current Tax" value={data.currentTax} onChange={v => handleUpdate('currentTax', v)} disabled={isFinalized} />
                <InputField label="Deferred Tax" value={data.deferredTax} onChange={v => handleUpdate('deferredTax', v)} disabled={isFinalized} />
            </div>
             <div className="mt-4 p-4 bg-gray-900/50 rounded-lg text-sm max-w-sm">
                <h4 className="font-bold text-gray-300">Summary</h4>
                 <div className="flex justify-between mt-2 pt-2 border-t border-gray-600">
                    <span className="font-bold">Total Tax Expense:</span>
                    <span className="font-mono font-bold">{total.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
            </div>
        </div>
    );
};
