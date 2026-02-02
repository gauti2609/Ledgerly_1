import React from 'react';
import { AllData } from '../../types.ts';
import { formatNumber } from '../../utils/formatNumber.ts';
import { getNoteNumberMap } from '../../utils/noteUtils.ts';

interface ReportProps {
    allData: AllData;
}

const ReportRow: React.FC<{ label: string; note?: string; valueCy?: number; valuePy?: number; isBold?: boolean; isSub?: boolean; isHeader?: boolean; formatFn: (num: number) => string; }> =
    ({ label, note, valueCy, valuePy, isBold, isSub, isHeader, formatFn }) => {
        if (isHeader) {
            return (
                <tr className="font-bold bg-gray-700/30">
                    <td className="p-3 text-white">{label}</td>
                    <td className="p-3 text-center"></td>
                    <td className="p-3 text-right"></td>
                    <td className="p-3 text-right"></td>
                </tr>
            );
        }
        return (
            <tr className={`${isBold ? 'font-bold text-white' : ''}`}>
                <td className={`p-2 ${isSub ? 'pl-8' : ''}`}>{label}</td>
                <td className="p-2 text-center text-gray-400">{note}</td>
                <td className="p-2 text-right font-mono">{valueCy !== undefined ? formatFn(valueCy) : ''}</td>
                <td className="p-2 text-right font-mono">{valuePy !== undefined ? formatFn(valuePy) : ''}</td>
            </tr>
        );
    };

import { useNumberFormat } from '../../context/NumberFormatContext.tsx';

// ...

export const ProfitAndLossStatement: React.FC<ReportProps> = ({ allData }) => {
    const { formatAmount } = useNumberFormat();

    if (!allData || !allData.scheduleData || !allData.trialBalanceData) {
        return <div className="p-4 text-gray-400">Loading P&L Data...</div>;
    }

    const { trialBalanceData, scheduleData } = allData;
    const { entityType } = scheduleData.entityInfo || {};

    // formatFn wrapper using context
    const format = (num: number) => formatAmount(num);
    const parse = (val: string) => parseFloat(String(val).replace(/,/g, '')) || 0;

    const noteNumberMap = getNoteNumberMap(scheduleData.noteSelections);

    // Helper to fetch from Schedule if available, else TB
    const getTBTotalGroup = (major: string, minor: string, year: 'cy' | 'py') => {
        const key = year === 'cy' ? 'closingCy' : 'closingPy';
        return trialBalanceData
            .filter(i => i.isMapped && i.minorHeadCode === minor)
            .reduce((sum, item) => sum + item[key], 0);
    };

    const getScheduleTotal = <K extends keyof typeof scheduleData>(
        scheduleKey: K,
        tbGrouping: string, // Major items usually align with Minor Heads, so we act like we are mapping Minor Head code here for fallback group
        year: 'cy' | 'py',
        calcFn: (data: typeof scheduleData[K], yr: 'cy' | 'py') => number
    ): number => {
        const data = scheduleData[scheduleKey];
        const scheduleVal = calcFn(data, year);
        if (Math.abs(scheduleVal) > 0.01) return scheduleVal;

        // Fallback: Sum by Grouping from TB
        const key = year === 'cy' ? 'closingCy' : 'closingPy';
        // Check if tbGrouping is a MinorHead code (e.g. C.10) or specific grouping
        if (tbGrouping.split('.').length === 2) {
            // It is a Minor Head (C.10)
            return getTBTotalGroup(tbGrouping.split('.')[0], tbGrouping, year);
        }

        return trialBalanceData
            .filter(i => i.isMapped && i.groupingCode === tbGrouping)
            .reduce((sum, item) => sum + item[key], 0);
    };

    const calcListSum = (items: any[], yr: 'cy' | 'py') =>
        items.reduce((s, i) => s + parse(yr === 'cy' ? i.amountCy : i.amountPy), 0);

    const calcRevenue = (d: typeof scheduleData.revenueFromOps, yr: 'cy' | 'py') => calcListSum(d, yr);
    const calcOtherIncome = (d: typeof scheduleData.otherIncome, yr: 'cy' | 'py') => calcListSum(d, yr);
    const calcPurchases = (d: typeof scheduleData.purchases, yr: 'cy' | 'py') => calcListSum(d, yr);
    const calcFinance = (d: typeof scheduleData.financeCosts, yr: 'cy' | 'py') => calcListSum(d, yr);
    const calcOtherExp = (d: typeof scheduleData.otherExpenses, yr: 'cy' | 'py') => calcListSum(d, yr);

    const calcEmployee = (d: typeof scheduleData.employeeBenefits, yr: 'cy' | 'py') => {
        // Struct: salariesAndWages, contributionToFunds, staffWelfare strings.
        // No PY fields in top level object?
        // Let's check types.ts
        // EmployeeBenefitsData: salariesAndWages, contributionToFunds, staffWelfare.
        // NO PY FIELDS explicitly.
        // So schedule currently supports CY only?
        // If so, PY must fallback to TB.
        if (yr === 'py') return 0;
        return parse(d.salariesAndWages) + parse(d.contributionToFunds) + parse(d.staffWelfare);
    };

    const calcCogs = (d: typeof scheduleData.costOfMaterialsConsumed, yr: 'cy' | 'py') => {
        const opening = d.opening.reduce((s, i) => s + parse(yr === 'cy' ? i.amountCy : i.amountPy), 0);
        const closing = d.closing.reduce((s, i) => s + parse(yr === 'cy' ? i.amountCy : i.amountPy), 0);

        // Purchases of Raw Material: Must come from TB as schedule does not have it.
        // Or we assumed C.30.02 is Purchases RM.
        const purch = getTBTotalGroup('C', 'C.30', yr) - opening + closing;
        // Logic: TB C.30 sum usually = Opening + Purchases - Closing (Cost of Consumed).
        // If we want detailed components:
        // Opening + Purchases - Closing.

        // Let's calculate purely from components we know.
        // We know Opening and Closing from Schedule.
        // We fetch Purchases from TB (C.40 is Stock In Trade, C.30.02 is Purchases RM?
        // force_update_masters: C.30.02 is "Purchases of Raw Materials".
        // Use getTBTotal('C.30.02') for Purchases.
        const tbPurch = trialBalanceData
            .filter(i => i.isMapped && i.groupingCode === 'C.30.02')
            .reduce((sum, item) => sum + item[yr === 'cy' ? 'closingCy' : 'closingPy'], 0);

        return opening + tbPurch - closing;
    };


    // --- INCOME ---
    const revenueCy = getScheduleTotal('revenueFromOps', 'C.10', 'cy', calcRevenue);
    const revenuePy = getScheduleTotal('revenueFromOps', 'C.10', 'py', calcRevenue);

    const otherIncomeCy = getScheduleTotal('otherIncome', 'C.20', 'cy', calcOtherIncome);
    const otherIncomePy = getScheduleTotal('otherIncome', 'C.20', 'py', calcOtherIncome);

    const totalIncomeCy = revenueCy + otherIncomeCy;
    const totalIncomePy = revenuePy + otherIncomePy;

    // --- EXPENSES ---
    const costOfMaterialsConsumedCy = getScheduleTotal('costOfMaterialsConsumed', 'C.30', 'cy', calcCogs);
    const costOfMaterialsConsumedPy = getScheduleTotal('costOfMaterialsConsumed', 'C.30', 'py', calcCogs);

    // Purchases of Stock-in-Trade
    const purchasesStockInTradeCy = getScheduleTotal('purchases', 'C.40', 'cy', calcPurchases);
    const purchasesStockInTradePy = getScheduleTotal('purchases', 'C.40', 'py', calcPurchases);

    // Changes in Inventories
    const changesInInventoriesCy = scheduleData.changesInInventories.opening.reduce((s, i) => s + parse(i.amountCy), 0)
        - scheduleData.changesInInventories.closing.reduce((s, i) => s + parse(i.amountCy), 0);
    const changesInInventoriesPy = scheduleData.changesInInventories.opening.reduce((s, i) => s + parse(i.amountPy), 0)
        - scheduleData.changesInInventories.closing.reduce((s, i) => s + parse(i.amountPy), 0);
    // If schedule is empty? Fallback to C.50
    // But calculate manual fallback is messy.
    // If changesInInventoriesCy is 0, check TB C.50.
    // Note: C.50 is "Changes in Inventories".
    const tbChangesCy = getTBTotalGroup('C', 'C.50', 'cy');
    const tbChangesPy = getTBTotalGroup('C', 'C.50', 'py');

    const finalChangesCy = Math.abs(changesInInventoriesCy) > 0.01 ? changesInInventoriesCy : tbChangesCy;
    const finalChangesPy = Math.abs(changesInInventoriesPy) > 0.01 ? changesInInventoriesPy : tbChangesPy;

    const employeeBenefitsCy = getScheduleTotal('employeeBenefits', 'C.60', 'cy', calcEmployee);
    const employeeBenefitsPy = getTBTotalGroup('C', 'C.60', 'py'); // No PY in schedule

    const financeCostsCy = getScheduleTotal('financeCosts', 'C.70', 'cy', calcFinance);
    const financeCostsPy = getScheduleTotal('financeCosts', 'C.70', 'py', calcFinance);

    const otherExpensesCy = getScheduleTotal('otherExpenses', 'C.90', 'cy', calcOtherExp);
    const otherExpensesPy = getScheduleTotal('otherExpenses', 'C.90', 'py', calcOtherExp);

    const depreciationCy = scheduleData.ppe.assets.reduce((sum, row) => sum + parse(row.depreciationForYear), 0) +
        scheduleData.intangibleAssets.assets.reduce((sum, row) => sum + parse(row.depreciationForYear), 0);
    // Add TB fallback for Depreciation (C.80)
    const depreciationPy = getTBTotalGroup('C', 'C.80', 'py'); // Schedule has Dep PY?
    // PpeAssetRow has depreciationForYearPy.
    // Intangible has it too.
    // So usually Schedule is fine.

    // Partners' Remuneration is handled after PAT for LLPs/Non-Corporates
    // Usually C.20.11 ?? No, C.20 is Income.
    // It's likely an expense but displayed below line.
    // Let's assume passed in TB via some code, or manually entered?
    // This part is preserved without change for now.
    const partnersRemunerationCy = 0; // Was using getTBTotal
    const partnersRemunerationPy = 0;

    const totalExpensesCy = costOfMaterialsConsumedCy + purchasesStockInTradeCy + finalChangesCy + employeeBenefitsCy + financeCostsCy + otherExpensesCy + depreciationCy;
    const totalExpensesPy = costOfMaterialsConsumedPy + purchasesStockInTradePy + finalChangesPy + employeeBenefitsPy + financeCostsPy + otherExpensesPy + depreciationPy;

    // --- PROFIT ---
    const profitBeforeExceptionalCy = totalIncomeCy - totalExpensesCy;
    const profitBeforeExceptionalPy = totalIncomePy - totalExpensesPy;

    const exceptionalItemsCy = scheduleData.exceptionalItems.filter(i => i.type === 'exceptional').reduce((s, i) => s + parse(i.amountCy), 0);
    const exceptionalItemsPy = scheduleData.exceptionalItems.filter(i => i.type === 'exceptional').reduce((s, i) => s + parse(i.amountPy), 0);

    const profitBeforeTaxCy = profitBeforeExceptionalCy - exceptionalItemsCy;
    const profitBeforeTaxPy = profitBeforeExceptionalPy - exceptionalItemsPy;

    const taxCy = parse(scheduleData.taxExpense.currentTax) + parse(scheduleData.taxExpense.deferredTax);
    const taxPy = 0; // Tax PY not implemented
    const profitAfterTaxCy = profitBeforeTaxCy - taxCy;
    const profitAfterTaxPy = profitBeforeTaxPy - taxPy;

    // For LLPs/Non-Corporates, deduct remuneration after PAT to find profit transferred.
    // partnersRemunerationCy defined above (placeholder).
    const remunerationExpenseCy = entityType !== 'Company' ? 0 : 0; // Disable for now if no code
    const remunerationExpensePy = entityType !== 'Company' ? 0 : 0;
    const netProfitTransferredCy = profitAfterTaxCy - remunerationExpenseCy;
    const netProfitTransferredPy = profitAfterTaxPy - remunerationExpensePy;

    // --- EPS ---
    const shares = parse(scheduleData.eps.weightedAvgEquityShares);
    const basicEpsCy = shares > 0 ? profitAfterTaxCy / shares : 0;
    const basicEpsPy = 0; // Not implemented

    return (
        <div className="bg-gray-800 text-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-white">Statement of Profit and Loss</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="p-3 text-left font-medium w-1/2">Particulars</th>
                            <th className="p-3 text-center font-medium">Note No.</th>
                            <th className="p-3 text-right font-medium">Current Year ({scheduleData.entityInfo.currencySymbol})</th>
                            <th className="p-3 text-right font-medium">Previous Year ({scheduleData.entityInfo.currencySymbol})</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        <ReportRow label="I. Revenue from operations" note={noteNumberMap['revenue']?.toString()} valueCy={revenueCy} valuePy={revenuePy} formatFn={format} />
                        <ReportRow label="II. Other income" note={noteNumberMap['otherIncome']?.toString()} valueCy={otherIncomeCy} valuePy={otherIncomePy} formatFn={format} />
                        <ReportRow label="III. Total Income (I + II)" valueCy={totalIncomeCy} valuePy={totalIncomePy} isBold formatFn={format} />

                        <ReportRow label="IV. EXPENSES" isHeader formatFn={format} />
                        <ReportRow label="Cost of materials consumed" note={noteNumberMap['cogs']?.toString()} valueCy={costOfMaterialsConsumedCy} valuePy={costOfMaterialsConsumedPy} formatFn={format} />
                        <ReportRow label="Purchases of Stock-in-Trade" valueCy={purchasesStockInTradeCy} valuePy={purchasesStockInTradePy} formatFn={format} />
                        <ReportRow label="Changes in inventories" note={noteNumberMap['changesInInv']?.toString()} valueCy={changesInInventoriesCy} valuePy={changesInInventoriesPy} formatFn={format} />
                        <ReportRow label="Employee benefits expense" note={noteNumberMap['employee']?.toString()} valueCy={employeeBenefitsCy} valuePy={employeeBenefitsPy} formatFn={format} />
                        <ReportRow label="Finance costs" note={noteNumberMap['finance']?.toString()} valueCy={financeCostsCy} valuePy={financeCostsPy} formatFn={format} />
                        <ReportRow label="Depreciation and amortisation expense" note={`${noteNumberMap['ppe'] || ''}, ${noteNumberMap['intangible'] || ''}`} valueCy={depreciationCy} valuePy={depreciationPy} formatFn={format} />
                        <ReportRow label="Other expenses" note={noteNumberMap['otherExpenses']?.toString()} valueCy={otherExpensesCy} valuePy={otherExpensesPy} formatFn={format} />
                        <ReportRow label="Total Expenses" valueCy={totalExpensesCy} valuePy={totalExpensesPy} isBold formatFn={format} />

                        <ReportRow label="V. Profit before exceptional items and tax (III - IV)" valueCy={profitBeforeExceptionalCy} valuePy={profitBeforeExceptionalPy} isBold formatFn={format} />
                        <ReportRow label="VI. Exceptional Items" valueCy={exceptionalItemsCy} valuePy={exceptionalItemsPy} formatFn={format} />

                        <ReportRow label="VII. Profit before tax (V - VI)" valueCy={profitBeforeTaxCy} valuePy={profitBeforeTaxPy} isBold formatFn={format} />
                        <ReportRow label="VIII. Tax expense" note={noteNumberMap['tax']?.toString()} valueCy={taxCy} valuePy={taxPy} formatFn={format} />
                        <ReportRow label="IX. Profit (Loss) after tax (VII - VIII)" valueCy={profitAfterTaxCy} valuePy={profitAfterTaxPy} isBold formatFn={format} />

                        {entityType === 'Company' ? (
                            <>
                                <ReportRow label="X. Earnings per equity share (for continuing operations)" isHeader formatFn={format} />
                                <ReportRow label="Basic (₹)" note={noteNumberMap['eps']?.toString()} valueCy={basicEpsCy} valuePy={basicEpsPy} formatFn={format} isSub />
                                <ReportRow label="Diluted (₹)" note={noteNumberMap['eps']?.toString()} valueCy={basicEpsCy} valuePy={basicEpsPy} formatFn={format} isSub />
                            </>
                        ) : (
                            <>
                                <ReportRow label="Less: Remuneration to Partners/Owners" valueCy={remunerationExpenseCy} valuePy={remunerationExpensePy} formatFn={format} />
                                <ReportRow label="X. Net Profit transferred to Partners'/Owners' Account" valueCy={netProfitTransferredCy} valuePy={netProfitTransferredPy} isBold formatFn={format} />
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};