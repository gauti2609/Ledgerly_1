import React from 'react';
import { AuditorPaymentsData } from '../../types.ts';

interface AuditorPaymentsScheduleProps {
    data: AuditorPaymentsData;
    onUpdate: (data: AuditorPaymentsData) => void;
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


export const AuditorPaymentsSchedule: React.FC<AuditorPaymentsScheduleProps> = ({ data, onUpdate, isFinalized }) => {

    const handleUpdate = (field: keyof AuditorPaymentsData, value: string) => {
        onUpdate({ ...data, [field]: value });
    };
    
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Payments to Auditor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="As Auditor" value={data.asAuditor} onChange={v => handleUpdate('asAuditor', v)} disabled={isFinalized} />
                <InputField label="For Taxation Matters" value={data.forTaxation} onChange={v => handleUpdate('forTaxation', v)} disabled={isFinalized} />
                <InputField label="For Company Law Matters" value={data.forCompanyLaw} onChange={v => handleUpdate('forCompanyLaw', v)} disabled={isFinalized} />
                <InputField label="For Management Services" value={data.forManagement} onChange={v => handleUpdate('forManagement', v)} disabled={isFinalized} />
                <InputField label="For Other Services" value={data.forOther} onChange={v => handleUpdate('forOther', v)} disabled={isFinalized} />
                <InputField label="For Reimbursement of Expenses" value={data.forReimbursement} onChange={v => handleUpdate('forReimbursement', v)} disabled={isFinalized} />
            </div>
        </div>
    );
};