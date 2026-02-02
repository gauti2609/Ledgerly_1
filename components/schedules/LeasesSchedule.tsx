import React from 'react';
import { LeasesData, MlpReconciliation, ManualInput } from '../../types.ts';
import { InputWithCheckbox } from '../InputWithCheckbox.tsx';

interface LeasesScheduleProps {
    data: LeasesData;
    onUpdate: (data: LeasesData) => void;
    isFinalized: boolean;
}

const MlpTable: React.FC<{
    title: string;
    data: MlpReconciliation;
    onUpdate: (data: MlpReconciliation) => void;
    isFinalized: boolean;
}> = ({ title, data, onUpdate, isFinalized }) => {

    const handleUpdate = (field: keyof MlpReconciliation, value: ManualInput) => {
        onUpdate({ ...data, [field]: value });
    };

    return (
        <div className="space-y-2">
            <h4 className="font-semibold text-gray-300">{title}</h4>
            <InputWithCheckbox label="Not later than 1 year" value={data.notLaterThan1Year} onChange={v => handleUpdate('notLaterThan1Year', v)} disabled={isFinalized} />
            <InputWithCheckbox label="Later than 1 year and not later than 5 years" value={data.laterThan1YearAndNotLaterThan5Years} onChange={v => handleUpdate('laterThan1YearAndNotLaterThan5Years', v)} disabled={isFinalized} />
            <InputWithCheckbox label="Later than 5 years" value={data.laterThan5Years} onChange={v => handleUpdate('laterThan5Years', v)} disabled={isFinalized} />
        </div>
    );
};

export const LeasesSchedule: React.FC<LeasesScheduleProps> = ({ data, onUpdate, isFinalized }) => {

    const handleUpdate = <T extends keyof LeasesData>(field: T, value: LeasesData[T]) => {
        onUpdate({ ...data, [field]: value });
    };

    return (
        <div className="space-y-8">
            <h3 className="text-lg font-semibold text-white">AS 19: Leases Disclosures</h3>

            <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                <h3 className="text-md font-semibold text-gray-200 border-b border-gray-600 pb-2">Lessee Disclosures</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MlpTable title="Finance Lease MLP Reconciliation" data={data.lesseeFinanceMlp} onUpdate={d => handleUpdate('lesseeFinanceMlp', d)} isFinalized={isFinalized} />
                    <MlpTable title="Operating Lease MLP Reconciliation" data={data.lesseeOperatingMlp} onUpdate={d => handleUpdate('lesseeOperatingMlp', d)} isFinalized={isFinalized} />
                </div>
                <InputWithCheckbox label="General Description of Lessee's Significant Leasing Arrangements" value={data.lesseeGeneralDescription} onChange={v => handleUpdate('lesseeGeneralDescription', v)} disabled={isFinalized} rows={3} />
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                <h3 className="text-md font-semibold text-gray-200 border-b border-gray-600 pb-2">Lessor Disclosures</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MlpTable title="Finance Lease MLP Reconciliation" data={data.lessorFinanceMlp} onUpdate={d => handleUpdate('lessorFinanceMlp', d)} isFinalized={isFinalized} />
                    <MlpTable title="Operating Lease MLP Reconciliation" data={data.lessorOperatingMlp} onUpdate={d => handleUpdate('lessorOperatingMlp', d)} isFinalized={isFinalized} />
                </div>
                <InputWithCheckbox label="General Description of Lessor's Significant Leasing Arrangements" value={data.lessorGeneralDescription} onChange={v => handleUpdate('lessorGeneralDescription', v)} disabled={isFinalized} rows={3} />
            </div>

        </div>
    );
};