import React from 'react';
import { v4 as uuidv4 } from 'uuid';
// FIX: Add file extension to fix module resolution error.
import { GenericScheduleItem, TrialBalanceItem } from '../../types.ts';
import { PlusIcon, TrashIcon, InformationCircleIcon } from '../icons.tsx';
import { DrillDownModal } from '../DrillDownModal.tsx';
import { useNumberFormat } from '../../context/NumberFormatContext.tsx';

// ...

interface GenericScheduleProps {
    title: string;
    data: GenericScheduleItem[];
    onUpdate: (data: GenericScheduleItem[]) => void;
    isFinalized: boolean;
    trialBalanceData?: TrialBalanceItem[];
}

const FormattedNumberInput: React.FC<{ value: string; onChange: (val: string) => void; placeholder?: string; disabled?: boolean; className?: string }> =
    ({ value, onChange, placeholder, disabled, className }) => {
        const { formatAmount } = useNumberFormat();
        const [isFocused, setIsFocused] = React.useState(false);

        // When focused, show raw value (stripped of commas). When blurred, show formatted.
        // We assume the parent state holds the raw value or whatever the user typed.
        // Ideally we enforce raw value in onChange.

        const rawValue = String(value).replace(/,/g, '');
        const formattedValue = formatAmount(parseFloat(rawValue) || 0);

        const displayValue = isFocused ? rawValue : formattedValue;

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            // Enforce no commas in state to keep it clean
            const val = e.target.value.replace(/,/g, '');
            // Allow decimals and numbers only? For now just strip commas.
            onChange(val);
        };

        return (
            <input
                type="text"
                value={displayValue}
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                disabled={disabled}
                className={className}
            />
        );
    };

export const GenericSchedule: React.FC<GenericScheduleProps> = ({ title, data, onUpdate, isFinalized, trialBalanceData }) => {
    const [drillDownGrouping, setDrillDownGrouping] = React.useState<{ name: string; code: string } | null>(null);

    const openDrillDown = (name: string, code: string) => {
        setDrillDownGrouping({ name, code });
    };

    const closeDrillDown = () => {
        setDrillDownGrouping(null);
    };

    const getDrillDownLedgers = () => {
        if (!drillDownGrouping || !trialBalanceData) return [];
        return trialBalanceData.filter(l => l.groupingCode === drillDownGrouping.code);
    };

    const handleUpdate = (id: string, field: keyof Omit<GenericScheduleItem, 'id'>, value: string) => {
        onUpdate(data.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const addRow = () => {
        const newRow = { id: uuidv4(), particular: '', amountCy: '0', amountPy: '0' };
        onUpdate([...data, newRow]);
    };

    const removeRow = (id: string) => {
        onUpdate(data.filter(item => item.id !== id));
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <div className="space-y-2">
                {data.map(item => (
                    <div key={item.id} className="flex items-center space-x-2 bg-gray-900/50 p-2 rounded-lg">
                        <div className="flex-1 relative">
                            <input type="text" placeholder="Particular" value={item.particular} onChange={e => handleUpdate(item.id, 'particular', e.target.value)} disabled={isFinalized} className="w-full bg-gray-700 p-2 rounded-md pr-8" />
                            {item.groupingCode && (
                                <button
                                    onClick={() => openDrillDown(item.particular, item.groupingCode!)}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-cyan-400 hover:text-cyan-300"
                                    title="View Ledgers"
                                >
                                    <span className="text-xs border border-cyan-400 rounded px-1">i</span>
                                </button>
                            )}
                        </div>
                        <FormattedNumberInput placeholder="Amount CY" value={item.amountCy} onChange={val => handleUpdate(item.id, 'amountCy', val)} disabled={isFinalized} className="w-1/4 bg-gray-700 p-2 rounded-md text-right" />
                        <FormattedNumberInput placeholder="Amount PY" value={item.amountPy} onChange={val => handleUpdate(item.id, 'amountPy', val)} disabled={isFinalized} className="w-1/4 bg-gray-700 p-2 rounded-md text-right" />
                        {!isFinalized && <button onClick={() => removeRow(item.id)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5" /></button>}
                    </div>
                ))}
            </div>

            <DrillDownModal
                isOpen={!!drillDownGrouping}
                onClose={closeDrillDown}
                groupingName={drillDownGrouping?.name || ''}
                ledgers={getDrillDownLedgers()}
            />
            {!isFinalized && (
                <button onClick={addRow} className="mt-4 flex items-center text-sm text-brand-blue-light hover:text-white transition-colors font-medium">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Item
                </button>
            )}
        </div>
    );
};
