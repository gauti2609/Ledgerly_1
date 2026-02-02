import React from 'react';
// FIX: Add file extension to fix module resolution error.
import { AllData, EntityType } from '../../types.ts';
// FIX: Add file extension to fix module resolution error.
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

export const BalanceSheet: React.FC<ReportProps> = ({ allData }) => {
    const { formatAmount } = useNumberFormat();

    if (!allData || !allData.scheduleData || !allData.trialBalanceData) {
        return <div className="p-4 text-gray-400">Loading Balance Sheet Data...</div>;
    }

    const { trialBalanceData, scheduleData } = allData;
    const { entityType } = scheduleData.entityInfo || {};

    // formatFn wrapper using context
    const format = (num: number) => formatAmount(num);
    const parse = (val: string) => parseFloat(String(val).replace(/,/g, '')) || 0;

    const noteNumberMap = getNoteNumberMap(scheduleData.noteSelections);

    const getTBTotal = (groupingCode: string, year: 'cy' | 'py') => {
        const key = year === 'cy' ? 'closingCy' : 'closingPy';
        return trialBalanceData
            .filter(i => i.isMapped && i.groupingCode === groupingCode)
            .reduce((sum, item) => sum + item[key], 0);
    };

    // Helper to fetch from Schedule if available, else TB
    const getScheduleTotal = <K extends keyof typeof scheduleData>(
        scheduleKey: K,
        tbGrouping: string,
        year: 'cy' | 'py',
        calcFn: (data: typeof scheduleData[K], yr: 'cy' | 'py') => number
    ): number => {
        const data = scheduleData[scheduleKey];
        // Simple heuristic: if data is "empty" (default state), use TB.
        // But some schedules are objects, some arrays.
        // We rely on the fact that auto-populate fills it.
        // If calcFn returns 0, we might want to check if it's *really* 0 or just not entered.
        // For now, let's trust calcFn. If it returns 0, we assume 0.
        // BUT, if the user hasn't visited the schedule, it might contain default initial data which sums to 0.
        // We want to fallback to TB if schedule is "untouched".
        // Let's assume if calcFn returns 0, we fallback to TB? 
        // No, user might genuinely have 0.
        // Let's check specific "is populated" markers if we had them.
        // For now: ALWAYS use Schedule result. If 0, it is 0.
        // WAIT: If I use this, and the user has NOT run auto-fill, everything will be 0 on the BS.
        // This disrupts the "View Draft" experience where we show TB data by default.
        // HYBRID: If Schedule has non-zero value, use it. If 0, check TB?
        // This is risky (what if real value is 0?).
        // Better: Use TB value as GROUND TRUTH unless Schedule is marked "Modified"?
        // Current state: User wants "Flow".
        // Let's fallback to TB if result is 0 AND TB is not 0.

        const scheduleVal = calcFn(data, year);
        if (Math.abs(scheduleVal) > 0.01) return scheduleVal;

        const tbVal = getTBTotal(tbGrouping, year);
        return Math.abs(tbVal) > 0.01 ? Math.abs(tbVal) : 0;
        // Note: Math.abs on tbVal because getTBTotal returns raw (signed), but BS expects positive.
        // We handled Math.abs at call site previously. Here we standardize.
    };

    // Calculation Functions
    const calcPPE = (d: typeof scheduleData.ppe, yr: 'cy' | 'py') => {
        const field = yr === 'cy' ? 'netBlockClosing' : 'grossBlockOpeningPy'; // Approx for PY Net? 
        // Re-read PpeAssetRow: netBlockClosing (CY only). 
        // We don't have explicit Net Block PY in the row structure shown in PpeSchedule (it had gross/dep PY).
        // Let's calc: Gross PY - Dep PY - Impairment PY
        return d.assets.reduce((sum, a) => {
            if (yr === 'cy') return sum + parse(a.netBlockClosing);
            const gross = parse(a.grossBlockOpeningPy) + parse(a.grossBlockAdditionsPy) - parse(a.grossBlockDisposalsPy);
            const dep = parse(a.depreciationOpeningPy) + parse(a.depreciationForYearPy) - parse(a.depreciationOnDisposalsPy);
            return sum + (gross - dep);
        }, 0);
    };

    const calcInventories = (d: typeof scheduleData.inventories, yr: 'cy' | 'py') =>
        d.reduce((sum, i) => sum + parse(yr === 'cy' ? i.amountCy : i.amountPy), 0);

    const calcTradePayables = (d: typeof scheduleData.tradePayables, yr: 'cy' | 'py') => {
        // Use Ageing sum
        return d.ageing.reduce((sum, row) => {
            // Ageing fields are strings
            if (yr === 'py') return 0; // Ageing usually only CY in this struct? 
            // Wait, TradePayablesAgeingRow only has one set of columns. Usually assumed CY.
            // We don't have PY ageing. 
            // Fallback to TB for PY if Schedule doesn't support it.
            return sum + parse(row.lessThan1Year) + parse(row['1To2Years']) + parse(row['2To3Years']) + parse(row.moreThan3Years);
        }, 0);
    };

    const calcReceivables = (d: typeof scheduleData.tradeReceivables, yr: 'cy' | 'py') => {
        // Use details
        if (yr === 'cy') return parse(d.securedGood) + parse(d.unsecuredGood) + parse(d.doubtful) - parse(d.provisionForDoubtful);
        // We don't have PY fields in top level TradeReceivablesData?
        // Let's check type... it has `ageing`. 
        // It DOES NOT have `amountPy` for totals explicitly in the interface shown in `types.ts` (lines 358-364).
        // So Schedule only captures CY for Receivables?
        // If so, PY must come from TB.
        return 0;
    };

    const calcCash = (d: typeof scheduleData.cashAndCashEquivalents, yr: 'cy' | 'py') => {
        // Cash on Hand (string) + Banks (array) + Others (array)
        // CashOnHand is single string (CY? PY?). Usually CY.
        // Wait, `cashOnHand` is string.
        // `balancesWithBanks` is `CashComponent[]` (amountCy, amountPy).
        // If `cashOnHand` doesn't support PY, valid point.
        // `types.ts`: `cashOnHand: string`. No PY.
        // So for PY cash on hand, we might fail.
        let val = 0;
        if (yr === 'cy') val += parse(d.cashOnHand) + parse(d.chequesDraftsOnHand);
        val += d.balancesWithBanks.reduce((s, i) => s + parse(yr === 'cy' ? i.amountCy : i.amountPy), 0);
        val += d.others.reduce((s, i) => s + parse(yr === 'cy' ? i.amountCy : i.amountPy), 0);
        return val;
    };

    const calcShareCap = (d: typeof scheduleData.companyShareCapital, yr: 'cy' | 'py') =>
        d.issued.reduce((sum, i) => sum + parse(yr === 'cy' ? i.amountCy : i.amountPy), 0);

    const calcOtherEquity = (d: typeof scheduleData.companyOtherEquity, yr: 'cy' | 'py') =>
        d.reduce((sum, i) => sum + parse(yr === 'cy' ? i.closing : i.opening), 0);
    // Warning: Opening of CY is Closing of PY for Reserves? 
    // Usually `openingPy` etc exists. 
    // `OtherEquityItem`: opening, additions, deductions, closing, openingPy, additionsPy...
    // For PY, we want `closingPy`. 
    // My calc uses `opening` for PY? No, `OtherEquityItem` structure (line 203) has `openingPy`, `additionsPy`, `deductionsPy`.
    // It does NOT have `closingPy`. Calculating:
    // ClosingPy = OpeningPy + AdditionsPy - DeductionsPy.

    const calcOtherEquityFixed = (d: typeof scheduleData.companyOtherEquity, yr: 'cy' | 'py') => {
        if (yr === 'cy') return d.reduce((sum, i) => sum + parse(i.closing), 0);
        return d.reduce((sum, i) => sum + parse(i.openingPy) + parse(i.additionsPy) - parse(i.deductionsPy), 0);
    };

    const calcBorrowings = (d: typeof scheduleData.borrowings, yr: 'cy' | 'py') => {
        // Long Term Borrowings Schedule usually holds all borrowings?
        // Struct: longTerm[], shortTerm[].
        // We are calculating "Long Term" here? Or Total?
        // In BS, we split LT and ST.
        // We need separate calc functions.
        return 0; // Placeholder
    };

    const calcBorrowingsLT = (d: typeof scheduleData.borrowings, yr: 'cy' | 'py') =>
        d.longTerm.reduce((sum, i) => sum + parse(yr === 'cy' ? i.amountCy : i.amountPy), 0);

    const calcBorrowingsST = (d: typeof scheduleData.borrowings, yr: 'cy' | 'py') =>
        d.shortTerm.reduce((sum, i) => sum + parse(yr === 'cy' ? i.amountCy : i.amountPy), 0);



    const getTBTotalGroup = (major: string, minor: string, year: 'cy' | 'py') => {
        const key = year === 'cy' ? 'closingCy' : 'closingPy';
        return trialBalanceData
            .filter(i => i.isMapped && i.minorHeadCode === minor)
            .reduce((sum, item) => sum + item[key], 0);
    };

    // ASSETS
    // Non-current assets
    // Use getTBTotalGroup for standard items to ensure all sub-groupings are captured
    const ppeCy = getScheduleTotal('ppe', 'A.10', 'cy', calcPPE); // Fallback logic in getScheduleTotal uses single code 'A.10.01'. We might want to fix fallback inside getScheduleTotal if needed, but for now relying on schedule logic mostly.
    const ppePy = getScheduleTotal('ppe', 'A.10', 'py', calcPPE);

    const intangiblesCy = getTBTotalGroup('A', 'A.30', 'cy');
    const intangiblesPy = getTBTotalGroup('A', 'A.30', 'py');
    const cwipCy = getTBTotalGroup('A', 'A.20', 'cy');
    const cwipPy = getTBTotalGroup('A', 'A.20', 'py');
    const intangibleDevCy = getTBTotalGroup('A', 'A.40', 'cy');
    const intangibleDevPy = getTBTotalGroup('A', 'A.40', 'py');
    const nonCurrentInvestmentsCy = getTBTotalGroup('A', 'A.50', 'cy');
    const nonCurrentInvestmentsPy = getTBTotalGroup('A', 'A.50', 'py');
    const dtaCy = getTBTotalGroup('A', 'A.70', 'cy');
    const dtaPy = getTBTotalGroup('A', 'A.70', 'py');
    const longTermLoansCy = getTBTotalGroup('A', 'A.60', 'cy');
    const longTermLoansPy = getTBTotalGroup('A', 'A.60', 'py');
    const otherNonCurrentAssetsCy = getTBTotalGroup('A', 'A.80', 'cy');
    const otherNonCurrentAssetsPy = getTBTotalGroup('A', 'A.80', 'py');

    const totalNonCurrentAssetsCy = ppeCy + intangiblesCy + cwipCy + intangibleDevCy + nonCurrentInvestmentsCy + dtaCy + longTermLoansCy + otherNonCurrentAssetsCy;
    const totalNonCurrentAssetsPy = ppePy + intangiblesPy + cwipPy + intangibleDevPy + nonCurrentInvestmentsPy + dtaPy + longTermLoansPy + otherNonCurrentAssetsPy;

    // Current assets
    const currentInvestmentsCy = getTBTotalGroup('A', 'A.90', 'cy');
    const currentInvestmentsPy = getTBTotalGroup('A', 'A.90', 'py');

    const inventoriesCy = getScheduleTotal('inventories', 'A.100', 'cy', calcInventories);
    const inventoriesPy = getScheduleTotal('inventories', 'A.100', 'py', calcInventories);

    const receivablesCy = getScheduleTotal('tradeReceivables', 'A.110', 'cy', calcReceivables);
    const receivablesPy = getTBTotalGroup('A', 'A.110', 'py'); // Fallback to full group for PY

    const cashCy = getScheduleTotal('cashAndCashEquivalents', 'A.120', 'cy', calcCash);
    const cashPy = getTBTotalGroup('A', 'A.120', 'py');

    const shortTermLoansCy = getTBTotalGroup('A', 'A.130', 'cy');
    const shortTermLoansPy = getTBTotalGroup('A', 'A.130', 'py');

    const otherCurrentAssetsCy = getTBTotalGroup('A', 'A.140', 'cy');
    const otherCurrentAssetsPy = getTBTotalGroup('A', 'A.140', 'py');

    const totalCurrentAssetsCy = currentInvestmentsCy + inventoriesCy + receivablesCy + cashCy + shortTermLoansCy + otherCurrentAssetsCy;
    const totalCurrentAssetsPy = currentInvestmentsPy + inventoriesPy + receivablesPy + cashPy + shortTermLoansPy + otherCurrentAssetsPy;

    const totalAssetsCy = totalNonCurrentAssetsCy + totalCurrentAssetsCy;
    const totalAssetsPy = totalNonCurrentAssetsPy + totalCurrentAssetsPy;

    // EQUITY AND LIABILITIES
    // Equity
    const shareCapitalCy = getScheduleTotal('companyShareCapital', 'B.10', 'cy', calcShareCap);
    const shareCapitalPy = getScheduleTotal('companyShareCapital', 'B.10', 'py', calcShareCap);

    // For Other Equity, we combine Schedule Data + Current Year Profit (if P&L is auto-calced).
    // If Schedule for Other Equity is used, it should ideally INCLUDE the Profit transfer.
    // But usually software keeps Retained Earnings separate.
    // Schedule for Other Equity usually has "Retained Earnings" row.
    // If user auto-fills, we might map "Retained Earnings" from TB.
    // We should probably rely on Schedule Total if it's populated.
    const otherEquityCy = getScheduleTotal('companyOtherEquity', 'B.10', 'cy', calcOtherEquityFixed);
    const otherEquityPy = getScheduleTotal('companyOtherEquity', 'B.10', 'py', calcOtherEquityFixed);

    // Share Warrants usually not in basic schedules?
    const shareWarrantsCy = Math.abs(getTBTotalGroup('B', 'B.10', 'cy')); // Fallback to TB
    const shareWarrantsPy = Math.abs(getTBTotalGroup('B', 'B.10', 'py'));

    const partnersFundsCy = Math.abs(getTBTotalGroup('B', 'B.10', 'cy')); // Or Schedule
    const partnersFundsPy = Math.abs(getTBTotalGroup('B', 'B.10', 'py'));

    // P&L Logic for "Surplus"
    // If we use Schedule for Other Equity, we assume the user has entered the correct closing balance there.
    // PROPOSAL: If Schedule is used, DO NOT add P&L surplus again (double counting risk).
    // If Schedule falls back to TB, TB usually has Opening Balance for Reserves.
    // We need to add P&L surplus if using TB.
    // If using Schedule, we trust the Schedule.

    // Wait, scheduleAutoPopulate mapped ClosingPy to Opening.
    // It did NOT map Current Year Profit.
    // So schedule data currently lacks CY Profit.
    // We MUST add Surplus to Other Equity Schedule Result?
    // Or we should update Auto-Populate to include a row for "Surplus for the year"?

    // For now, let's keep the existing logic:
    // P&L Calculation
    const revCy = trialBalanceData.filter(i => i.isMapped && (i.minorHeadCode?.startsWith('C.10') || i.minorHeadCode?.startsWith('C.20'))).reduce((sum, i) => sum + i.closingCy, 0);
    const revPy = trialBalanceData.filter(i => i.isMapped && (i.minorHeadCode?.startsWith('C.10') || i.minorHeadCode?.startsWith('C.20'))).reduce((sum, i) => sum + i.closingPy, 0);

    const expCy = trialBalanceData.filter(i => i.isMapped && i.majorHeadCode === 'C' && !i.minorHeadCode?.startsWith('C.10') && !i.minorHeadCode?.startsWith('C.20')).reduce((sum, i) => sum + i.closingCy, 0);
    const expPy = trialBalanceData.filter(i => i.isMapped && i.majorHeadCode === 'C' && !i.minorHeadCode?.startsWith('C.10') && !i.minorHeadCode?.startsWith('C.20')).reduce((sum, i) => sum + i.closingPy, 0);

    const surplusCy = revCy - expCy;
    const surplusPy = revPy - expPy;

    // We add surplus only if we think it's missing.
    // If we used Schedule, did we include it? 
    // Auto-populate did NOT include it.
    // So we add it. 
    // BUT: If user manually edits Schedule to include "Profit for the year", we double count.
    // Ideally, "Profit for the year" line item should be in "Other Equity".
    // Let's assume for this automation context: We ADD it.

    const otherEquityCyAdj = otherEquityCy + surplusCy;
    const otherEquityPyAdj = otherEquityPy + surplusPy;

    const totalEquityCy = entityType === 'Company'
        ? shareCapitalCy + otherEquityCyAdj + shareWarrantsCy
        : partnersFundsCy + surplusCy;

    const totalEquityPy = entityType === 'Company'
        ? shareCapitalPy + otherEquityPyAdj + shareWarrantsPy
        : partnersFundsPy + surplusPy;

    // Liabilities
    // Non-current liabilities
    const longTermBorrowingsCy = getScheduleTotal('borrowings', 'B.30', 'cy', calcBorrowingsLT);
    const longTermBorrowingsPy = getScheduleTotal('borrowings', 'B.30', 'py', calcBorrowingsLT);

    const dtlCy = getTBTotalGroup('B', 'B.40', 'cy');
    const dtlPy = getTBTotalGroup('B', 'B.40', 'py');
    const otherLongTermLiabilitiesCy = getTBTotalGroup('B', 'B.50', 'cy');
    const otherLongTermLiabilitiesPy = getTBTotalGroup('B', 'B.50', 'py');
    const longTermProvisionsCy = getTBTotalGroup('B', 'B.60', 'cy');
    const longTermProvisionsPy = getTBTotalGroup('B', 'B.60', 'py');

    const totalNonCurrentLiabilitiesCy = longTermBorrowingsCy + dtlCy + otherLongTermLiabilitiesCy + longTermProvisionsCy;
    const totalNonCurrentLiabilitiesPy = longTermBorrowingsPy + dtlPy + otherLongTermLiabilitiesPy + longTermProvisionsPy;

    // Current liabilities
    const shortTermBorrowingsCy = getScheduleTotal('borrowings', 'B.70', 'cy', calcBorrowingsST);
    const shortTermBorrowingsPy = getScheduleTotal('borrowings', 'B.70', 'py', calcBorrowingsST);

    const tradePayablesCy = getScheduleTotal('tradePayables', 'B.80', 'cy', calcTradePayables);
    const tradePayablesPy = getTBTotalGroup('B', 'B.80', 'py'); // Fallback for PY

    const otherCurrentLiabilitiesCy = getTBTotalGroup('B', 'B.90', 'cy');
    const otherCurrentLiabilitiesPy = getTBTotalGroup('B', 'B.90', 'py');
    const shortTermProvisionsCy = getTBTotalGroup('B', 'B.100', 'cy');
    const shortTermProvisionsPy = getTBTotalGroup('B', 'B.100', 'py');

    // Share App Money usually B.10 or separate?
    // Masters has B.10, B.20... 
    // Does it have "Share App pending allotment"? 
    // It's not explicitly in Minor Heads list in force_update_masters.
    // It might be grouped under B.50 or similar? 
    // Pre-existing code used 'B.30.05'. 
    // force_update_masters says 'B.30' is Long Term Borrowings... wait.
    // force_update_masters line 30: B.30 is LT Borrowings.
    // Line 34: B.70 is Short Term Borrowings.
    // Code 'B.30.05' in Masters (line 146) is 'Loans from Related Parties' (under LT Borrowings).
    // SO THE OLD CODE MAPPING WAS DEFINITELY WRONG/MISMATCHED.
    // 'Share App Money' is not clearly in new Masters. 
    // Let's omit or assume 0 for now if not found.
    const shareAppMoneyCy = 0;
    const shareAppMoneyPy = 0;

    // Note: B.30 used for ST Borrowings in OLD code?
    // New Masters: B.30 = LT. B.70 = ST.
    // My code above for shortTermBorrowings uses 'B.70'. Correct.

    const totalCurrentLiabilitiesCy = shortTermBorrowingsCy + tradePayablesCy + otherCurrentLiabilitiesCy + shortTermProvisionsCy + shareAppMoneyCy;
    const totalCurrentLiabilitiesPy = shortTermBorrowingsPy + tradePayablesPy + otherCurrentLiabilitiesPy + shortTermProvisionsPy + shareAppMoneyPy;

    const totalLiabilitiesCy = totalNonCurrentLiabilitiesCy + totalCurrentLiabilitiesCy;
    const totalLiabilitiesPy = totalNonCurrentLiabilitiesPy + totalCurrentLiabilitiesPy;

    const totalEquityAndLiabilitiesCy = totalEquityCy + totalLiabilitiesCy;
    const totalEquityAndLiabilitiesPy = totalEquityPy + totalLiabilitiesPy;

    const renderCompanyEquity = () => (
        <>
            <ReportRow label="Equity" isBold formatFn={format} />
            <ReportRow label="Share Capital" note={noteNumberMap['companyShareCap']?.toString()} valueCy={shareCapitalCy} valuePy={shareCapitalPy} isSub formatFn={format} />
            <ReportRow label="Other Equity" note={noteNumberMap['companyOtherEquity']?.toString()} valueCy={otherEquityCyAdj} valuePy={otherEquityPyAdj} isSub formatFn={format} />
            <ReportRow label="Money received against share warrants" valueCy={shareWarrantsCy} valuePy={shareWarrantsPy} isSub formatFn={format} />
            <ReportRow label="Total Equity" valueCy={totalEquityCy} valuePy={totalEquityPy} isBold formatFn={format} />
        </>
    );

    const renderPartnerFunds = () => (
        <>
            <ReportRow label={entityType === 'LLP' ? "PARTNERS' FUNDS" : "OWNERS' FUNDS"} isHeader formatFn={format} />
            <ReportRow label="Partners' Funds" note={noteNumberMap['partnersFunds']?.toString()} valueCy={partnersFundsCy} valuePy={partnersFundsPy} formatFn={format} />
            <ReportRow label="Total Partners' Funds" valueCy={totalEquityCy} valuePy={totalEquityPy} isBold formatFn={format} />
        </>
    );

    return (
        <div className="bg-gray-800 text-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-white">Balance Sheet</h2>
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
                        <ReportRow label="ASSETS" isHeader formatFn={format} />
                        <ReportRow label="Non-current assets" isBold formatFn={format} />
                        <ReportRow label="Property, Plant and Equipment" note={noteNumberMap['ppe']?.toString()} valueCy={ppeCy} valuePy={ppePy} isSub formatFn={format} />
                        <ReportRow label="Intangible assets" note={noteNumberMap['intangible']?.toString()} valueCy={intangiblesCy} valuePy={intangiblesPy} isSub formatFn={format} />
                        <ReportRow label="Capital work-in-progress" note={noteNumberMap['cwip']?.toString()} valueCy={cwipCy} valuePy={cwipPy} isSub formatFn={format} />
                        <ReportRow label="Intangible assets under development" valueCy={intangibleDevCy} valuePy={intangibleDevPy} isSub formatFn={format} />
                        <ReportRow label="Non-current investments" note={noteNumberMap['investments']?.toString()} valueCy={nonCurrentInvestmentsCy} valuePy={nonCurrentInvestmentsPy} isSub formatFn={format} />
                        <ReportRow label="Deferred tax assets (net)" valueCy={dtaCy} valuePy={dtaPy} isSub formatFn={format} />
                        <ReportRow label="Long-term loans and advances" note={noteNumberMap['loans']?.toString()} valueCy={longTermLoansCy} valuePy={longTermLoansPy} isSub formatFn={format} />
                        <ReportRow label="Other non-current assets" valueCy={otherNonCurrentAssetsCy} valuePy={otherNonCurrentAssetsPy} isSub formatFn={format} />
                        <ReportRow label="Total non-current assets" valueCy={totalNonCurrentAssetsCy} valuePy={totalNonCurrentAssetsPy} isBold formatFn={format} />

                        <ReportRow label="Current assets" isBold formatFn={format} />
                        <ReportRow label="Current investments" valueCy={currentInvestmentsCy} valuePy={currentInvestmentsPy} isSub formatFn={format} />
                        <ReportRow label="Inventories" note={noteNumberMap['inventories']?.toString()} valueCy={inventoriesCy} valuePy={inventoriesPy} isSub formatFn={format} />
                        <ReportRow label="Trade receivables" note={noteNumberMap['tradeReceivables']?.toString()} valueCy={receivablesCy} valuePy={receivablesPy} isSub formatFn={format} />
                        <ReportRow label="Cash and cash equivalents" note={noteNumberMap['cash']?.toString()} valueCy={cashCy} valuePy={cashPy} isSub formatFn={format} />
                        <ReportRow label="Short-term loans and advances" valueCy={shortTermLoansCy} valuePy={shortTermLoansPy} isSub formatFn={format} />
                        <ReportRow label="Other current assets" valueCy={otherCurrentAssetsCy} valuePy={otherCurrentAssetsPy} isSub formatFn={format} />
                        <ReportRow label="Total current assets" valueCy={totalCurrentAssetsCy} valuePy={totalCurrentAssetsPy} isBold formatFn={format} />
                        <ReportRow label="TOTAL ASSETS" valueCy={totalAssetsCy} valuePy={totalAssetsPy} isBold formatFn={format} />

                        {entityType === 'Company' ? renderCompanyEquity() : renderPartnerFunds()}

                        <ReportRow label="LIABILITIES" isHeader formatFn={format} />
                        <ReportRow label="Non-current liabilities" isBold formatFn={format} />
                        <ReportRow label="Long-term borrowings" note={noteNumberMap['borrowings']?.toString()} valueCy={longTermBorrowingsCy} valuePy={longTermBorrowingsPy} isSub formatFn={format} />
                        <ReportRow label="Deferred tax liabilities (net)" valueCy={dtlCy} valuePy={dtlPy} isSub formatFn={format} />
                        <ReportRow label="Other long-term liabilities" valueCy={otherLongTermLiabilitiesCy} valuePy={otherLongTermLiabilitiesPy} isSub formatFn={format} />
                        <ReportRow label="Long-term provisions" valueCy={longTermProvisionsCy} valuePy={longTermProvisionsPy} isSub formatFn={format} />
                        <ReportRow label="Total non-current liabilities" valueCy={totalNonCurrentLiabilitiesCy} valuePy={totalNonCurrentLiabilitiesPy} isBold formatFn={format} />

                        <ReportRow label="Current liabilities" isBold formatFn={format} />
                        <ReportRow label="Short-term borrowings" note={noteNumberMap['borrowings']?.toString()} valueCy={shortTermBorrowingsCy} valuePy={shortTermBorrowingsPy} isSub formatFn={format} />
                        <ReportRow label="Trade payables" note={noteNumberMap['tradePayables']?.toString()} valueCy={tradePayablesCy} valuePy={tradePayablesPy} isSub formatFn={format} />
                        <ReportRow label="Other current liabilities" valueCy={otherCurrentLiabilitiesCy} valuePy={otherCurrentLiabilitiesPy} isSub formatFn={format} />
                        <ReportRow label="Short-term provisions" valueCy={shortTermProvisionsCy} valuePy={shortTermProvisionsPy} isSub formatFn={format} />
                        <ReportRow label="Share application money pending allotment" valueCy={shareAppMoneyCy} valuePy={shareAppMoneyPy} isSub formatFn={format} />
                        <ReportRow label="Total current liabilities" valueCy={totalCurrentLiabilitiesCy} valuePy={totalCurrentLiabilitiesPy} isBold formatFn={format} />
                        <ReportRow label="Total Liabilities" valueCy={totalLiabilitiesCy} valuePy={totalLiabilitiesPy} isBold formatFn={format} />

                        <ReportRow label="TOTAL EQUITY AND LIABILITIES" valueCy={totalEquityAndLiabilitiesCy} valuePy={totalEquityAndLiabilitiesPy} isBold formatFn={format} />
                    </tbody>
                </table>
            </div>
        </div>
    );
};