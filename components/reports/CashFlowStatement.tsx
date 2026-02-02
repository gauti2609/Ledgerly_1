import React, { useMemo } from 'react';
import { AllData, TrialBalanceItem, ScheduleData } from '../../types.ts';

interface CashFlowStatementProps {
    allData: AllData;
}

export const CashFlowStatement: React.FC<CashFlowStatementProps> = ({ allData }) => {
    if (!allData || !allData.scheduleData || !allData.trialBalanceData || !allData.masters) {
        return <div className="p-4 text-gray-400">Loading Cash Flow Data...</div>;
    }

    const { trialBalanceData, scheduleData, masters } = allData;

    // Helper to sum ledgers by grouping or head
    const sumByHead = (headCode: string, type: 'major' | 'minor' | 'grouping', year: 'cy' | 'py') => {
        return trialBalanceData
            .filter(item =>
                (type === 'major' && item.majorHeadCode === headCode) ||
                (type === 'minor' && item.minorHeadCode === headCode) ||
                (type === 'grouping' && item.groupingCode === headCode)
            )
            .reduce((sum, item) => sum + (year === 'cy' ? item.closingCy : item.closingPy), 0);
    };

    // Calculate Net Profit Before Tax (Starting Point)
    // Revenue - Expenses (excluding Tax)
    const revenueCy = sumByHead('REVENUE_OPS', 'major', 'cy') + sumByHead('OTHER_INCOME', 'major', 'cy');
    const expensesCy = trialBalanceData
        .filter(item => {
            const majorHead = masters.majorHeads.find(h => h.code === item.majorHeadCode);
            return majorHead?.name.includes('Expense') || item.majorHeadCode === 'PURCHASES' || item.majorHeadCode === 'FINANCE_COSTS';
        })
        .reduce((sum, item) => sum + item.closingCy, 0);

    // Note: This is an estimation. ideally we pull "Profit Before Tax" from the exact P&L calculation node.
    // For now, we calculate it:
    const netProfitBeforeTax = revenueCy - expensesCy; // Simply simplified

    // Adjustments
    const depreciation = useMemo(() => {
        return scheduleData.ppe.assets.reduce((sum, asset) => sum + (parseFloat(asset.depreciationForYear.replace(/,/g, '')) || 0), 0);
    }, [scheduleData.ppe]);

    const financeCosts = useMemo(() => {
        return scheduleData.financeCosts.reduce((sum, item) => sum + (parseFloat(item.amountCy.replace(/,/g, '')) || 0), 0);
    }, [scheduleData.financeCosts]);

    const operatingProfitBeforeWC = netProfitBeforeTax + depreciation + financeCosts;

    // Working Capital Changes (Delta = Py - Cy for Assets, Cy - Py for Liabilities generally, but signs depend on TB)
    // Assets: Increase is Outflow (-), Decrease is Inflow (+)
    // Liabilities: Increase is Inflow (+), Decrease is Outflow (-)

    const calculateWcDelta = (majorHeadCode: string, isAsset: boolean) => {
        const cy = sumByHead(majorHeadCode, 'major', 'cy');
        const py = sumByHead(majorHeadCode, 'major', 'py');
        return isAsset ? (py - cy) : (cy - py);
    };

    const tradeReceivablesDelta = calculateWcDelta('TRADE_RECEIVABLES', true);
    const inventoriesDelta = calculateWcDelta('INVENTORIES', true);
    const tradePayablesDelta = calculateWcDelta('TRADE_PAYABLES', false);
    const otherCurrentAssetsDelta = calculateWcDelta('OTHER_CURRENT_ASSETS', true);
    const otherCurrentLiabDelta = calculateWcDelta('OTHER_CURRENT_LIAB', false);

    const cashFromOperations = operatingProfitBeforeWC + tradeReceivablesDelta + inventoriesDelta + tradePayablesDelta + otherCurrentAssetsDelta + otherCurrentLiabDelta;
    const taxesPaid = sumByHead('CURRENT_TAX_ASSETS', 'major', 'cy'); // Or actual payment logic
    const netCashOperating = cashFromOperations - taxesPaid;

    // Investing
    const purchasePPE = -1 * (scheduleData.ppe.assets.reduce((sum, asset) => sum + (parseFloat(asset.grossBlockAdditions.replace(/,/g, '')) || 0), 0));
    const salePPE = 0; // Need field for Proceeds from Sale, simplified
    const netCashInvesting = purchasePPE + salePPE;

    // Financing
    const borrowingsProceeds = calculateWcDelta('BORROWINGS_LONG', false) + calculateWcDelta('BORROWINGS_SHORT', false);
    // Simple delta for borrowings

    const financeCostsPaid = -1 * financeCosts;
    const netCashFinancing = borrowingsProceeds + financeCostsPaid;

    const netIncreaseCash = netCashOperating + netCashInvesting + netCashFinancing;
    const cashOpening = sumByHead('CASH_AND_EQUIV', 'major', 'py');
    const cashClosing = sumByHead('CASH_AND_EQUIV', 'major', 'cy');

    return (
        <div className="p-8 bg-gray-900 min-h-screen text-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-white text-center border-b border-gray-700 pb-4">Cash Flow Statement (Indirect Method)</h2>
            <div className="max-w-4xl mx-auto space-y-8 font-mono text-sm">

                {/* Operating Activities */}
                <section>
                    <h3 className="text-lg font-semibold text-brand-blue mb-3">A. Cash Flow from Operating Activities</h3>
                    <div className="space-y-1">
                        <Row label="Net Profit Before Tax" value={netProfitBeforeTax} bold />
                        <div className="pl-4 border-l-2 border-gray-700 my-2">
                            <p className="text-gray-500 italic mb-1">Adjustments for:</p>
                            <Row label="Depreciation and Amortization" value={depreciation} />
                            <Row label="Finance Costs" value={financeCosts} />
                        </div>
                        <Row label="Operating Profit before Working Capital Changes" value={operatingProfitBeforeWC} bold />
                        <div className="pl-4 border-l-2 border-gray-700 my-2">
                            <p className="text-gray-500 italic mb-1">Adjustments for Working Capital:</p>
                            <Row label="(Increase)/Decrease in Trade Receivables" value={tradeReceivablesDelta} />
                            <Row label="(Increase)/Decrease in Inventories" value={inventoriesDelta} />
                            <Row label="Increase/(Decrease) in Trade Payables" value={tradePayablesDelta} />
                            <Row label="(Increase)/Decrease in Other Current Assets" value={otherCurrentAssetsDelta} />
                            <Row label="Increase/(Decrease) in Other Current Liabilities" value={otherCurrentLiabDelta} />
                        </div>
                        <Row label="Cash Generated from Operations" value={cashFromOperations} bold />
                        <Row label="Income Taxes Paid (Net)" value={-taxesPaid} />
                        <Row label="Net Cash from Operating Activities" value={netCashOperating} doubleUnderline highlight />
                    </div>
                </section>

                {/* Investing Activities */}
                <section>
                    <h3 className="text-lg font-semibold text-brand-blue mb-3">B. Cash Flow from Investing Activities</h3>
                    <div className="space-y-1">
                        <Row label="Purchase of Property, Plant and Equipment" value={purchasePPE} />
                        <Row label="Proceeds from Sale of Property, Plant and Equipment" value={salePPE} />
                        <Row label="Net Cash from Investing Activities" value={netCashInvesting} doubleUnderline highlight />
                    </div>
                </section>

                {/* Financing Activities */}
                <section>
                    <h3 className="text-lg font-semibold text-brand-blue mb-3">C. Cash Flow from Financing Activities</h3>
                    <div className="space-y-1">
                        <Row label="Proceeds/Repayment of Borrowings (Net)" value={borrowingsProceeds} />
                        <Row label="Interest Paid" value={financeCostsPaid} />
                        <Row label="Net Cash from Financing Activities" value={netCashFinancing} doubleUnderline highlight />
                    </div>
                </section>

                {/* Reconciliation */}
                <section className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <Row label="Net Increase / (Decrease) in Cash and Cash Equivalents (A+B+C)" value={netIncreaseCash} bold />
                    <Row label="Cash and Cash Equivalents at Beginning of Period" value={cashOpening} />
                    <Row label="Cash and Cash Equivalents at End of Period" value={cashClosing} bold />

                    <div className={`mt-4 text-center p-2 rounded ${Math.abs((cashOpening + netIncreaseCash) - cashClosing) < 1 ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                        {Math.abs((cashOpening + netIncreaseCash) - cashClosing) < 1 ?
                            "✓ Reconciled Successfully" :
                            `⚠ Difference: ${(cashOpening + netIncreaseCash - cashClosing).toFixed(2)}`}
                    </div>
                </section>
            </div>
        </div>
    );
};

const Row: React.FC<{ label: string; value: number; bold?: boolean; doubleUnderline?: boolean; highlight?: boolean }> = ({ label, value, bold, doubleUnderline, highlight }) => (
    <div className={`flex justify-between items-center py-1 ${highlight ? 'bg-gray-800/50 p-2 rounded' : ''}`}>
        <span className={`${bold ? 'font-bold' : ''}`}>{label}</span>
        <span className={`text-right ${bold ? 'font-bold' : ''} ${doubleUnderline ? 'border-b-4 border-double border-gray-500' : ''}`}>
            {value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
    </div>
);