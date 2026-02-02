import React from 'react';
// FIX: Add file extension to fix module resolution error.
import { EntityInfoData, ScheduleData, RoundingUnit } from '../../../types.ts';

interface EntityInfoScheduleProps {
    data: EntityInfoData;
    onUpdate?: React.Dispatch<React.SetStateAction<ScheduleData>>;
    isFinalized?: boolean;
}

const InputField: React.FC<{ label: string; value: string; onChange: (value: string) => void; disabled: boolean; isReadonly?: boolean }> =
    ({ label, value, onChange, disabled, isReadonly }) => {
        if (isReadonly) {
            return (
                <div className="grid grid-cols-3 gap-4 items-center">
                    <label className="block text-sm font-medium text-gray-400 col-span-1">{label}</label>
                    <p className="mt-1 text-gray-200 col-span-2">{value}</p>
                </div>
            );
        }
        return (
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="block text-sm font-medium text-gray-400 col-span-1">{label}</label>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white disabled:bg-gray-800 disabled:cursor-not-allowed col-span-2"
                />
            </div>
        );
    }


export const EntityInfoSchedule: React.FC<EntityInfoScheduleProps> = ({ data, onUpdate, isFinalized = false }) => {

    const handleUpdate = (field: keyof EntityInfoData, value: string) => {
        if (onUpdate) {
            onUpdate(prev => ({
                ...prev,
                entityInfo: {
                    ...prev.entityInfo,
                    [field]: value
                }
            }));
        }
    };

    // For the display version in the Notes To Accounts
    if (!onUpdate) {
        return (
            <div className="space-y-3 text-sm">
                <p>The Entity is a {data.entityType} domiciled in India.</p>
                <div className="space-y-2 pt-2">
                    <InputField label="Entity Name" value={data.companyName} onChange={() => { }} disabled isReadonly />
                    <InputField label="Registration No." value={data.cin} onChange={() => { }} disabled isReadonly />
                    <InputField label="Date of Incorporation/Formation" value={data.incorporationDate} onChange={() => { }} disabled isReadonly />
                    <InputField label="Registered Office" value={data.registeredOffice} onChange={() => { }} disabled isReadonly />
                </div>
            </div>
        );
    }

    const roundingOptions: { value: RoundingUnit, label: string }[] = [
        { value: 'ones', label: 'Ones' },
        { value: 'hundreds', label: 'Hundreds' },
        { value: 'thousands', label: 'Thousands' },
        { value: 'lakhs', label: 'Lakhs' },
        { value: 'millions', label: 'Millions' },
        { value: 'crores', label: 'Crores' },
    ];

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Entity Information</h3>

            <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                <h4 className="text-md font-semibold text-gray-300 mb-2">Basic Details</h4>
                <div className="grid grid-cols-3 gap-4 items-center">
                    <label className="block text-sm font-medium text-gray-400 col-span-1">Entity Type</label>
                    <p className="mt-1 text-gray-200 col-span-2 font-semibold">{data.entityType}</p>
                </div>
                <InputField label="Entity Name" value={data.companyName} onChange={v => handleUpdate('companyName', v)} disabled={isFinalized} />
                <InputField label="Registration Number (e.g., CIN/LLPIN)" value={data.cin} onChange={v => handleUpdate('cin', v)} disabled={isFinalized} />
                <InputField label="Date of Incorporation / Formation" value={data.incorporationDate} onChange={v => handleUpdate('incorporationDate', v)} disabled={isFinalized} />
                <InputField label="Registered Office Address" value={data.registeredOffice} onChange={v => handleUpdate('registeredOffice', v)} disabled={isFinalized} />
                <div className="grid grid-cols-3 gap-4 items-center">
                    <label className="block text-sm font-medium text-gray-400 col-span-1">Currency Symbol</label>
                    <input type="text" value={data.currencySymbol} onChange={e => handleUpdate('currencySymbol', e.target.value)} disabled={isFinalized} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white disabled:bg-gray-800 col-span-2" />
                </div>
                <div className="grid grid-cols-3 gap-4 items-center">
                    <label className="block text-sm font-medium text-gray-400 col-span-1">Rounding Unit for Reports</label>
                    <select value={data.roundingUnit} onChange={e => handleUpdate('roundingUnit', e.target.value)} disabled={isFinalized} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white disabled:bg-gray-800 col-span-2">
                        {roundingOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-3 gap-4 items-center">
                    <label className="block text-sm font-medium text-gray-400 col-span-1">Number Formatting Style</label>
                    <select value={data.numberFormat || 'Indian'} onChange={e => handleUpdate('numberFormat', e.target.value)} disabled={isFinalized} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white disabled:bg-gray-800 col-span-2">
                        <option value="Indian">Indian (e.g., 1,00,000)</option>
                        <option value="European">European/US (e.g., 100,000)</option>
                    </select>
                </div>
                <div className="grid grid-cols-3 gap-4 items-center">
                    <label className="block text-sm font-medium text-gray-400 col-span-1">Decimal Places</label>
                    <select value={data.decimalPlaces ?? 2} onChange={e => handleUpdate('decimalPlaces', parseInt(e.target.value) as any)} disabled={isFinalized} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white disabled:bg-gray-800 col-span-2">
                        <option value="2">2 (e.g., 1,00,000.00)</option>
                        <option value="0">0 (e.g., 1,00,000)</option>
                    </select>
                </div>
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                <h4 className="text-md font-semibold text-gray-300 mb-2">Entity Classification Data</h4>
                <p className="text-xs text-gray-400 -mt-2 mb-4">Enter the following details for the immediately preceding financial year to determine applicability of Accounting Standards.</p>
                <div className="grid grid-cols-2 gap-4">
                    <InputField label="Turnover (PY)" value={data.turnoverPy} onChange={v => handleUpdate('turnoverPy', v)} disabled={isFinalized} />
                    <InputField label="Borrowings (PY)" value={data.borrowingsPy} onChange={v => handleUpdate('borrowingsPy', v)} disabled={isFinalized} />
                    <InputField label="Number of Employees (PY)" value={data.employeesPy} onChange={v => handleUpdate('employeesPy', v)} disabled={isFinalized} />
                </div>
            </div>
        </div>
    );
};