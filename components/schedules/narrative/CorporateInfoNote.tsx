
import React from 'react';
// FIX: Add file extension to fix module resolution error.
// FIX: Replaced deprecated 'CorporateInfoData' with 'EntityInfoData'.
import { EntityInfoData, ScheduleData, RoundingUnit } from '../../../types.ts';

interface CorporateInfoNoteProps {
    // FIX: Replaced deprecated 'CorporateInfoData' with 'EntityInfoData'.
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


export const CorporateInfoNote: React.FC<CorporateInfoNoteProps> = ({ data, onUpdate, isFinalized = false }) => {

    // FIX: Replaced deprecated 'CorporateInfoData' with 'EntityInfoData' and 'corporateInfo' with 'entityInfo'.
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
                <p>The Company is a private limited company incorporated and domiciled in India.</p>
                <div className="space-y-2 pt-2">
                    <InputField label="Company Name" value={data.companyName} onChange={()=>{}} disabled isReadonly/>
                    <InputField label="CIN" value={data.cin} onChange={()=>{}} disabled isReadonly/>
                    <InputField label="Date of Incorporation" value={data.incorporationDate} onChange={()=>{}} disabled isReadonly/>
                    <InputField label="Registered Office" value={data.registeredOffice} onChange={()=>{}} disabled isReadonly/>
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
        <div className="space-y-4">
             <h3 className="text-lg font-semibold text-white">Corporate Information</h3>
             <InputField label="Company Name" value={data.companyName} onChange={v => handleUpdate('companyName', v)} disabled={isFinalized} />
             <InputField label="Corporate Identification Number (CIN)" value={data.cin} onChange={v => handleUpdate('cin', v)} disabled={isFinalized} />
             <InputField label="Date of Incorporation" value={data.incorporationDate} onChange={v => handleUpdate('incorporationDate', v)} disabled={isFinalized} />
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
        </div>
    );
};