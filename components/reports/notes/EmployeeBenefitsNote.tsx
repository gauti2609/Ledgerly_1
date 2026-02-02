import React from 'react';
import { EmployeeBenefitsData, AllData, DefinedBenefitPlanReconciliation, DefinedBenefitPlanAssetsReconciliation } from '../../../types.ts';

interface EmployeeBenefitsNoteProps {
    data: EmployeeBenefitsData;
    allData: AllData;
}

const format = (val: string | number): string => {
    const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) || 0 : val;
    if (isNaN(num) || num === 0) return '-';
    const formatted = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Math.abs(num));
    return num < 0 ? `(${formatted})` : formatted;
};

const ReconTable: React.FC<{ title: string, data: DefinedBenefitPlanReconciliation | DefinedBenefitPlanAssetsReconciliation }> = ({ title, data }) => {
    const parse = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;

    let closingBalance = 0;
    let rows: { label: string, value: number }[] = [];

    if ('currentServiceCost' in data) { // It's Obligation Reconciliation
        const { opening, currentServiceCost, interestCost, actuarialLossGain, benefitsPaid } = data;
        closingBalance = parse(opening) + parse(currentServiceCost) + parse(interestCost) + parse(actuarialLossGain) - parse(benefitsPaid);
        rows = [
            { label: 'Opening Defined Benefit Obligation', value: parse(opening) },
            { label: 'Current Service Cost', value: parse(currentServiceCost) },
            { label: 'Interest Cost', value: parse(interestCost) },
            { label: 'Actuarial (Gains)/Losses', value: parse(actuarialLossGain) },
            { label: 'Benefits Paid', value: -parse(benefitsPaid) },
        ];
    } else { // It's Asset Reconciliation
        const { opening, expectedReturn, actuarialLossGain, contributions, benefitsPaid } = data;
        closingBalance = parse(opening) + parse(expectedReturn) + parse(actuarialLossGain) + parse(contributions) - parse(benefitsPaid);
        rows = [
            { label: 'Opening Fair Value of Plan Assets', value: parse(opening) },
            { label: 'Expected Return on Plan Assets', value: parse(expectedReturn) },
            { label: 'Actuarial Gains/(Losses)', value: parse(actuarialLossGain) },
            { label: 'Contributions by Employer', value: parse(contributions) },
            { label: 'Benefits Paid', value: -parse(benefitsPaid) },
        ];
    }

    return (
        <div>
            <h4 className="font-semibold text-gray-300 mb-2">{title}</h4>
            <table className="min-w-full text-sm">
                <tbody>
                    {rows.map(row => (
                        <tr key={row.label}><td className="p-1">{row.label}</td><td className="p-1 text-right font-mono">{format(row.value)}</td></tr>
                    ))}
                    <tr className="font-bold border-t-2 border-gray-600"><td className="p-1">Closing Balance</td><td className="p-1 text-right font-mono">{format(closingBalance)}</td></tr>
                </tbody>
            </table>
        </div>
    )
};


export const EmployeeBenefitsNote: React.FC<EmployeeBenefitsNoteProps> = ({ data, allData }) => {
    const { definedBenefitPlans } = data;
    const { obligationReconciliation, assetReconciliation, actuarialAssumptions } = definedBenefitPlans;

    const parse = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;

    // Auto-populate Standard Groupings for Employee Benefits (C.60)
    const benefitGroupings = allData.masters.groupings.filter(g => g.minorHeadCode === 'C.60');

    const standardGroupingItems = benefitGroupings.map(grouping => {
        const relevantLedgers = allData.trialBalanceData.filter(tb =>
            tb.groupingCode === grouping.code &&
            !tb.noteLineItemId
        );

        const sumCy = relevantLedgers.reduce((sum, item) => sum + item.closingCy, 0);
        const sumPy = relevantLedgers.reduce((sum, item) => sum + item.closingPy, 0);

        if (sumCy === 0 && sumPy === 0) return null;

        return {
            id: grouping.code,
            particular: grouping.name,
            amountCy: sumCy,
            amountPy: sumPy
        };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    // Sum of standard items
    let displayItems = standardGroupingItems;
    let totalBenefitsCy = standardGroupingItems.reduce((sum, item) => sum + item.amountCy, 0);
    let totalBenefitsPy = standardGroupingItems.reduce((sum, item) => sum + item.amountPy, 0);

    const hasManualInput = data.salariesAndWages || data.contributionToFunds || data.staffWelfare;

    if (hasManualInput) {
        displayItems = [
            {
                id: 'manual-salaries',
                particular: 'Salaries and Wages',
                amountCy: parse(data.salariesAndWages),
                amountPy: 0 // Manual input currently provides only one value (CY implied)
            },
            {
                id: 'manual-contribution',
                particular: 'Contribution to Provident & Other Funds',
                amountCy: parse(data.contributionToFunds),
                amountPy: 0
            },
            {
                id: 'manual-welfare',
                particular: 'Staff Welfare Expenses',
                amountCy: parse(data.staffWelfare),
                amountPy: 0
            }
        ].filter(item => item.amountCy !== 0); // Filter out empty manual rows if any

        totalBenefitsCy = displayItems.reduce((sum, item) => sum + item.amountCy, 0);
        totalBenefitsPy = displayItems.reduce((sum, item) => sum + item.amountPy, 0);
    }

    const closingObligation = parse(obligationReconciliation.opening) + parse(obligationReconciliation.currentServiceCost) + parse(obligationReconciliation.interestCost) + parse(obligationReconciliation.actuarialLossGain) - parse(obligationReconciliation.benefitsPaid);
    const closingAssets = parse(assetReconciliation.opening) + parse(assetReconciliation.expectedReturn) + parse(assetReconciliation.actuarialLossGain) + parse(assetReconciliation.contributions) - parse(assetReconciliation.benefitsPaid);
    const netLiability = closingAssets - closingObligation;

    return (
        <div className="space-y-6 text-sm">
            <p className="text-xs text-gray-400">The company provides for post-employment benefits in the form of gratuity and other defined benefit plans. The following tables summarise the components of net benefit expense recognised in the statement of profit and loss and the funded status and amounts recognised in the balance sheet.</p>

            {/* Standard Groupings Table */}
            <div>
                <h4 className="font-semibold text-gray-300 mb-2">Employee Benefits Expense</h4>
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="p-2 text-left font-medium w-3/5">Particulars</th>
                            <th className="p-2 text-right font-medium">Amount CY</th>
                            <th className="p-2 text-right font-medium">Amount PY</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                        {displayItems.map(item => (
                            <tr key={item.id}>
                                <td className="p-2">{item.particular}</td>
                                <td className="p-2 text-right font-mono">{format(item.amountCy)}</td>
                                <td className="p-2 text-right font-mono">{format(item.amountPy)}</td>
                            </tr>
                        ))}
                        <tr className="font-bold bg-gray-700/30">
                            <td className="p-2">Total</td>
                            <td className="p-2 text-right font-mono">{format(totalBenefitsCy)}</td>
                            <td className="p-2 text-right font-mono">{format(totalBenefitsPy)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ReconTable title="a) Reconciliation of Present Value of Obligation" data={obligationReconciliation} />
                <ReconTable title="b) Reconciliation of Fair Value of Plan Assets" data={assetReconciliation} />
            </div>

            <div>
                <h4 className="font-semibold text-gray-300 mb-2">c) Amount Recognised in Balance Sheet</h4>
                <table className="min-w-full text-sm max-w-md">
                    <tbody>
                        <tr><td className="p-1">Fair Value of Plan Assets</td><td className="p-1 text-right font-mono">{format(closingAssets)}</td></tr>
                        <tr><td className="p-1">Present Value of Defined Benefit Obligation</td><td className="p-1 text-right font-mono">{format(-closingObligation)}</td></tr>
                        <tr className="font-bold border-t-2 border-gray-600"><td className="p-1">Net (Asset)/Liability recognised in Balance Sheet</td><td className="p-1 text-right font-mono">{format(netLiability)}</td></tr>
                    </tbody>
                </table>
            </div>

            <div>
                <h4 className="font-semibold text-gray-300 mb-2">d) Principal Actuarial Assumptions</h4>
                <table className="min-w-full text-sm max-w-md">
                    <tbody>
                        <tr><td className="p-1">Discount Rate</td><td className="p-1 text-right font-mono">{actuarialAssumptions.discountRate}%</td></tr>
                        <tr><td className="p-1">Expected Rate of Return on Plan Assets</td><td className="p-1 text-right font-mono">{actuarialAssumptions.expectedReturnOnAssets}%</td></tr>
                        <tr><td className="p-1">Salary Increase Rate</td><td className="p-1 text-right font-mono">{actuarialAssumptions.salaryIncreaseRate}%</td></tr>
                    </tbody>
                </table>
            </div>

        </div>
    );
};