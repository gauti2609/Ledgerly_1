// components/schedules/TradePayablesMsmeSchedule.tsx
import React from 'react';
import { MsmeDisclosureData } from '../../types.ts';

interface TradePayablesMsmeScheduleProps {
    data: MsmeDisclosureData;
    onUpdate: (data: MsmeDisclosureData) => void;
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

export const TradePayablesMsmeSchedule: React.FC<TradePayablesMsmeScheduleProps> = ({ data, onUpdate, isFinalized }) => {

    const handleUpdate = (field: keyof MsmeDisclosureData, value: string) => {
        onUpdate({ ...data, [field]: value });
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">MSME Disclosures for Trade Payables</h3>
            <p className="text-sm text-gray-400">Details of dues to Micro, Small and Medium Enterprises as defined under the MSMED Act, 2006.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Principal and interest due thereon remaining unpaid" value={data.principalAndInterestDue} onChange={v => handleUpdate('principalAndInterestDue', v)} disabled={isFinalized} />
                <InputField label="Interest paid beyond the appointed day" value={data.interestPaid} onChange={v => handleUpdate('interestPaid', v)} disabled={isFinalized} />
                <InputField label="Interest due and payable for the period of delay" value={data.interestDueAndPayable} onChange={v => handleUpdate('interestDueAndPayable', v)} disabled={isFinalized} />
                <InputField label="Interest accrued and remaining unpaid" value={data.interestAccruedAndUnpaid} onChange={v => handleUpdate('interestAccruedAndUnpaid', v)} disabled={isFinalized} />
                <InputField label="Further interest remaining due and payable" value={data.furtherInterest} onChange={v => handleUpdate('furtherInterest', v)} disabled={isFinalized} />
            </div>
        </div>
    );
};
