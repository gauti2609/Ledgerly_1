import React from 'react';
import { EmployeeBenefitsData, ScheduleData, DefinedBenefitPlanData } from '../../types.ts';

interface EmployeeBenefitsScheduleProps {
    data: EmployeeBenefitsData;
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

const ReconRow: React.FC<{label: string, value: string, onChange: (v:string) => void, isFinalized: boolean}> = ({label, value, onChange, isFinalized}) => (
    <div className="grid grid-cols-2 items-center">
        <label className="text-sm text-gray-400">{label}</label>
        <input type="text" value={value} onChange={e => onChange(e.target.value)} disabled={isFinalized} className="bg-gray-700/80 p-1 rounded-md text-right"/>
    </div>
);

export const EmployeeBenefitsSchedule: React.FC<EmployeeBenefitsScheduleProps> = ({ data, onUpdate, isFinalized }) => {

    const handleUpdate = (field: keyof EmployeeBenefitsData, value: any) => {
        onUpdate(prev => ({ ...prev, employeeBenefits: { ...prev.employeeBenefits, [field]: value } }));
    };

    const handleDBPUpdate = (field: keyof DefinedBenefitPlanData, subField: keyof any, value: string) => {
        const updatedSection = { ...data.definedBenefitPlans[field], [subField]: value };
        handleUpdate('definedBenefitPlans', { ...data.definedBenefitPlans, [field]: updatedSection });
    };

    const parse = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;
    const totalExpense = parse(data.salariesAndWages) + parse(data.contributionToFunds) + parse(data.staffWelfare);
    
    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-semibold text-white">Employee Benefit Expense (P&L)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    <InputField label="Salaries and Wages" value={data.salariesAndWages} onChange={v => handleUpdate('salariesAndWages', v)} disabled={isFinalized} />
                    <InputField label="Contribution to Provident & Other Funds" value={data.contributionToFunds} onChange={v => handleUpdate('contributionToFunds', v)} disabled={isFinalized} />
                    <InputField label="Staff Welfare Expenses" value={data.staffWelfare} onChange={v => handleUpdate('staffWelfare', v)} disabled={isFinalized} />
                </div>
                <div className="mt-4 p-4 bg-gray-900/50 rounded-lg text-sm max-w-sm">
                    <div className="flex justify-between">
                        <span className="font-bold">Total Employee Benefit Expense:</span>
                        <span className="font-mono font-bold">{totalExpense.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                </div>
            </div>

            <div>
                 <h3 className="text-lg font-semibold text-white">AS 15: Defined Benefit Plan Disclosures</h3>
                 <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg">
                        <h4 className="font-semibold text-gray-300">Reconciliation of Defined Benefit Obligation</h4>
                        <ReconRow label="Opening Balance" value={data.definedBenefitPlans.obligationReconciliation.opening} onChange={v => handleDBPUpdate('obligationReconciliation', 'opening', v)} isFinalized={isFinalized} />
                        <ReconRow label="Current Service Cost" value={data.definedBenefitPlans.obligationReconciliation.currentServiceCost} onChange={v => handleDBPUpdate('obligationReconciliation', 'currentServiceCost', v)} isFinalized={isFinalized} />
                        <ReconRow label="Interest Cost" value={data.definedBenefitPlans.obligationReconciliation.interestCost} onChange={v => handleDBPUpdate('obligationReconciliation', 'interestCost', v)} isFinalized={isFinalized} />
                        <ReconRow label="Actuarial (Gain)/Loss" value={data.definedBenefitPlans.obligationReconciliation.actuarialLossGain} onChange={v => handleDBPUpdate('obligationReconciliation', 'actuarialLossGain', v)} isFinalized={isFinalized} />
                        <ReconRow label="Benefits Paid" value={data.definedBenefitPlans.obligationReconciliation.benefitsPaid} onChange={v => handleDBPUpdate('obligationReconciliation', 'benefitsPaid', v)} isFinalized={isFinalized} />
                    </div>
                     <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg">
                        <h4 className="font-semibold text-gray-300">Reconciliation of Fair Value of Plan Assets</h4>
                        <ReconRow label="Opening Balance" value={data.definedBenefitPlans.assetReconciliation.opening} onChange={v => handleDBPUpdate('assetReconciliation', 'opening', v)} isFinalized={isFinalized} />
                        <ReconRow label="Expected Return on Plan Assets" value={data.definedBenefitPlans.assetReconciliation.expectedReturn} onChange={v => handleDBPUpdate('assetReconciliation', 'expectedReturn', v)} isFinalized={isFinalized} />
                        <ReconRow label="Actuarial (Gain)/Loss" value={data.definedBenefitPlans.assetReconciliation.actuarialLossGain} onChange={v => handleDBPUpdate('assetReconciliation', 'actuarialLossGain', v)} isFinalized={isFinalized} />
                        <ReconRow label="Contributions by Employer" value={data.definedBenefitPlans.assetReconciliation.contributions} onChange={v => handleDBPUpdate('assetReconciliation', 'contributions', v)} isFinalized={isFinalized} />
                        <ReconRow label="Benefits Paid" value={data.definedBenefitPlans.assetReconciliation.benefitsPaid} onChange={v => handleDBPUpdate('assetReconciliation', 'benefitsPaid', v)} isFinalized={isFinalized} />
                    </div>
                 </div>
                 <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
                    <h4 className="font-semibold text-gray-300 mb-4">Principal Actuarial Assumptions</h4>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InputField label="Discount Rate (%)" value={data.definedBenefitPlans.actuarialAssumptions.discountRate} onChange={v => handleDBPUpdate('actuarialAssumptions', 'discountRate', v)} disabled={isFinalized} />
                        <InputField label="Expected Rate of Return on Plan Assets (%)" value={data.definedBenefitPlans.actuarialAssumptions.expectedReturnOnAssets} onChange={v => handleDBPUpdate('actuarialAssumptions', 'expectedReturnOnAssets', v)} disabled={isFinalized} />
                        <InputField label="Salary Increase Rate (%)" value={data.definedBenefitPlans.actuarialAssumptions.salaryIncreaseRate} onChange={v => handleDBPUpdate('actuarialAssumptions', 'salaryIncreaseRate', v)} disabled={isFinalized} />
                    </div>
                 </div>
            </div>
        </div>
    );
};