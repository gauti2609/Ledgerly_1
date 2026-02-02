import React, { useState, useEffect } from 'react';
import { getTaxAuditReport, saveTaxAuditReport } from '../../services/apiService.ts';
import { SaveStatusIndicator } from '../SaveStatusIndicator.tsx';
import { determineAllClauseRelevance, TaxAuditAutoResult } from '../../services/taxAuditService.ts';
import { TrialBalanceItem, Masters } from '../../types.ts';
import { WandIcon } from '../icons.tsx';

interface Form3CDProps {
    token: string;
    entityId: string;
    trialBalanceData?: TrialBalanceItem[];
    masters?: Masters;
}

const CLAUSES_3CD = [
    { id: '1', title: 'Clause 1-8: Part A General', description: 'Name, Address, PAN, Status, Previous Auditor details, etc.', guidance: 'Guidance Note requires verifying PAN cards, previous tax returns, and appointment letters. Ensure address matches the registered office/principal place of business. Check if there was a change in auditors and if communication with previous auditor was made.', regulation: 'Sec 44AB' },
    { id: '8a', title: 'Clause 8a: Section 44AB', description: 'Whether the assessee has opted for taxation under section 115BA/115BAA/115BAB?', guidance: 'Verify if the assessee has exercised the option for concessional tax rates under Sec 115BA/115BAA/115BAB. Obtain copy of Form 10-IB/10-IC/10-ID filed. Check acknowledgement number and date of filing.', regulation: 'Sec 115BA, 115BAA, 115BAB' },
    { id: '9', title: 'Clause 9: Partners/Members', description: 'Details of partners/members and their profit sharing ratios.', guidance: 'Verify the Partnership Deed/LLP Agreement. Check for any changes in constitution or profit sharing ratio during the year. Ensure all changes are authorized by a supplementary deed.', regulation: 'Partnership Act, 1932 / LLP Act, 2008' },
    { id: '10', title: 'Clause 10: Nature of Business', description: 'Nature of business or profession and changes therein.', guidance: 'Review the Directors Report/Business Profile. Identify distinct lines of business. Report any significant change (e.g., stopping a manufacturing line, starting trading). Mere temporary suspension is not a change.', regulation: '-' },
    { id: '11', title: 'Clause 11: Books of Account', description: 'List of books of account maintained and address at which books are kept.', guidance: 'Obtain a list of books maintained (Cash Book, Ledger, Journal, Stock Register, etc.). Verify if books are kept at registered office or other notified places (Form AOC-5 for companies). Check for computerized books.', regulation: 'Sec 44AA, Rule 6F' },
    { id: '12', title: 'Clause 12: Presumptive Income', description: 'Whether the profit and loss includes profits assessed on presumptive basis?', guidance: 'Check if any business falls under Sec 44AD, 44AE, 44ADA, etc. If yes, ensure the profits from such business are credited to P&L and note the amount. These amounts are excluded from normal tax audit calculations.', regulation: 'Sec 44AD, 44AE, 44ADA, 44BB, 44BBA, 44BBB' },
    { id: '13', title: 'Clause 13: Method of Accounting', description: 'Method of accounting employed in previous year.', guidance: 'Confirm if method is Mercantile or Cash. Companies must follow Mercantile (Accrual). Check for consistency with the preceding year. If changed, quantify the effect on profit.', regulation: 'Sec 145(1)' },
    { id: '14', title: 'Clause 14: Stock Valuation', description: 'Method of valuation of closing stock employed in the previous year.', guidance: 'Verify compliance with ICDS II (Valuation of Inventories). Check if inclusive of taxes/duties. Ensure consistency in valuation method (FIFO/Weighted Avg). Disclose deviation from Sec 145A if any.', regulation: 'Sec 145A, ICDS II' },
    { id: '15', title: 'Clause 15: Capital Asset converted to Stock', description: 'Details of capital asset converted into stock-in-trade.', guidance: 'Verify date of conversion and Fair Market Value (FMV) on that date. The FMV constitutes the cost of the stock. The difference between FMV and cost of asset is Capital Gain (Sec 45(2)).', regulation: 'Sec 45(2)' },
    { id: '16', title: 'Clause 16: Items not credited to P&L', description: 'Amounts not credited to the profit and loss account.', guidance: 'Scrutinize ledger for items like duty drawback, escalation claims, capital receipts, or grants not routed through P&L. Check Sec 28(i) to (v) items. Common misses: Pro-forma credits, refunds of expenses.', regulation: 'Sec 28' },
    { id: '17', title: 'Clause 17: Land/Building Transfer', description: 'Transfer of land or building for less than stamp duty value (Sec 43CA/50C).', guidance: 'Obtain list of all immovable properties transferred. Compare actual Consideration vs Stamp Duty Value (SDV). If Consideration < SDV (beyond 110% tolerance), report details. obtain Circle Rate valuation.', regulation: 'Sec 43CA, Sec 50C' },
    { id: '18', title: 'Clause 18: Depreciation', description: 'Details of depreciation allowable as per Consolidated block of assets.', guidance: 'Prepare Depreciation Chart as per IT Act rates (not Companies Act). Check for "Put to Use" for < 180 days (50% dep). Verify additions/deletions with invoices. Check for WDV adjustments.', regulation: 'Sec 32' },
    { id: '19', title: 'Clause 19: Section 35 Deductions', description: 'Amounts admissible under sections 35, 35AD, 35D, etc.', guidance: 'Verify specific deductions for Scientific Research (Sec 35), Specified Business (Sec 35AD). Ensure conditions like "approval of authority" or "capital nature" are met. Check supporting certificates.', regulation: 'Sec 35, 35AD, 35D, 35DD, 35DDA' },
    { id: '20', title: 'Clause 20: Employee Bonuses', description: 'Details of bonus or commission paid to employees.', guidance: 'Verify if bonus/commission was payable as profits or dividend (which is disallowed). Check ascertainability of the amount. Ensure payment is genuine and within the year or due date (Sec 43B applies).', regulation: 'Sec 36(1)(ii)' },
    { id: '21', title: 'Clause 21: Amounts Inadmissible', description: 'Details of amounts debited to profit and loss account, being in the nature of capital, personal, etc.', guidance: 'Comprehensive review required: Personal expenses, Capital expenditure charged to revenue, Sec 40(a)(i)/(ia) (Non-deduction of TDS), Sec 40A(3) (Cash payments > 10k), Provision for Gratuity (unless paid).', regulation: 'Sec 37, 40(a), 40A(3), 40A(7), 40A(9)' },
    { id: '22', title: 'Clause 22: MSME Interest', description: 'Interest inadmissible under section 23 of the MSME Act, 2006.', guidance: 'Identify MSME registered vendors. Calculate interest for delayed payments (>15/45 days). This interest is permanently disallowed (add back to income). Check Form 3CD vs Audited Accounts notes.', regulation: 'Sec 23 of MSMED Act, 2006' },
    { id: '23', title: 'Clause 23: Related Party Payments', description: 'Particulars of payments made to persons specified under section 40A(2)(b).', guidance: 'Filter transactions with Directors, Relatives, Holding/Sub companies. Assess if payments are excessive or unreasonable having regard to FMV. Report all such payments (Salary, Rent, Interest, Purchases).', regulation: 'Sec 40A(2)(b)' },
    { id: '24', title: 'Clause 24: Deemed Profits', description: 'Amounts deemed to be profits and gains under section 32AC/33AB/33ABA/32AD.', guidance: 'Applicable if investment allowance or deposit schemes (Tea/Coffee/Rubber) were claimed earlier and assets sold/funds misutilized within lock-in period. Verify asset register history.', regulation: 'Sec 32AC, 32AD, 33AB, 33ABA' },
    { id: '25', title: 'Clause 25: Section 41 Profits', description: 'Any amount of profit chargeable to tax under section 41.', guidance: 'Check for remission or cessation of trading liabilities (e.g., creditors written off, recovery of bad debts previously allowed). These are taxable as business income.', regulation: 'Sec 41' },
    { id: '26', title: 'Clause 26: Section 43B', description: 'Liability incurred regarding sales tax, customs duty, excise duty, etc. (Sec 43B).', guidance: 'Critical: Identify statutory dues (GST, PF, ESI, Bonus, Leave Encashment, Interest to Banks) claimed as expense but NOT paid by the return filing due date. Report amounts paid and unpaid.', regulation: 'Sec 43B' },
    { id: '27', title: 'Clause 27: CENVAT/ITC', description: 'Amount of Central Value Added Tax credits availed of or utilised.', guidance: 'Reconcile GST Input Tax Credit (ITC) as per books vs GSTR-3B/2A. Report opening balance, availed, utilized, and closing balance. Check if ITC written off is treated as expense (Sec 145A).', regulation: 'Sec 145A' },
    { id: '28', title: 'Clause 28: Share Issue', description: 'Receipt of shares of a company not being a company in which the public are substantially interested.', guidance: 'For Pvt Ltd companies issuing shares: Check if received consideration > Fair Market Value (Rule 11UA). Excess is taxable u/s 56(2)(viib). Obtain Valuation Report.', regulation: 'Sec 56(2)(viib), Rule 11UA' },
    { id: '29', title: 'Clause 29: Share Premium', description: 'Consideration received for issue of shares which exceeds the fair market value.', guidance: 'Similar to Cl 28 but specific to Sec 56(2)(viib). Report if shares issued at premium. Verify compliance with authorized capital and valuation methodologies.', regulation: 'Sec 56(2)(viib)' },
    { id: '29A', title: 'Clause 29A: Advance Forfeited', description: 'Amount chargeable under section 56(2)(ix) (Advance forfeited).', guidance: 'Check line items for "Forfeited Advances" against negotiation for asset transfer. Such forfeiture is now "Income from Other Sources", not a reduction in asset cost.', regulation: 'Sec 56(2)(ix)' },
    { id: '29B', title: 'Clause 29B: Gift/Income', description: 'Amount chargeable under section 56(2)(x).', guidance: 'Verify receipt of money/property without consideration or inadequate consideration. If > 50k, the difference/aggregate is taxable. Exceptions apply (relatives, marriage, etc.).', regulation: 'Sec 56(2)(x)' },
    { id: '30', title: 'Clause 30: Hundi Borrowings', description: 'Details of amount borrowed on Hundi or amount due thereon.', guidance: 'Check borrowings on Hundi notes. Section 69D mandates taxing the amount borrowed or repaid otherwise than by account payee cheque. Usually rare in corporate audits.', regulation: 'Sec 69D' },
    { id: '30A', title: 'Clause 30A: Secondary Adjustments', description: 'Primary adjustments to transfer price (Sec 92CE).', guidance: 'Applicable if Transfer Pricing adjustment > 1 Cr. If excess money not repatriated to India, interest is imputed. Check Transfer Pricing Report (Form 3CEB).', regulation: 'Sec 92CE' },
    { id: '30B', title: 'Clause 30B: Thin Capitalization', description: 'Limitation of interest deduction (Sec 94B).', guidance: 'Applicable to Indian companies/PEs paying interest > 1 Cr to Non-Resident Associated Enterprises. Deduction capped at 30% of EBITDA. Verify interest computations.', regulation: 'Sec 94B' },
    { id: '30C', title: 'Clause 30C: GAAR', description: 'Whether General Anti-Avoidance Rules (GAAR) is applicable?', guidance: 'Check for impermissible avoidance arrangements where main purpose is tax benefit. Usually applicable for large, complex cross-border structures. Often "No" for standard SMEs.', regulation: 'Sec 96' },
    { id: '31', title: 'Clause 31: Sec 269SS/269T', description: 'Acceptance/Repayment of loan/deposit/specified sum > 20k.', guidance: 'Strict Scrutiny: Report ALL loans/deposits taken or repaid in CASH > 20k. Also report if taken by cheque/draft but not Account Payee. Cross-verify with cash book and bank statements.', regulation: 'Sec 269SS, 269T' },
    { id: '32', title: 'Clause 32: Loss Carry Forward', description: 'Details of brought forward loss or depreciation allowance.', guidance: 'Check past ITR acknowledgments and assessment orders. Ensure consistency in loss amounts. Verify speculation loss vs business loss vs capital loss tracking.', regulation: 'Sec 32(2), 70-79' },
    { id: '33', title: 'Clause 33: Deductions Chapter VIA', description: 'Section-wise details of deductions, if any, admissible under Chapter VIA.', guidance: 'Verify claims under 80G (Donations), 80IA/IB/IC (Profit linked). Cross check with donation receipts and audit reports (Form 10CCB). Ensure eligibility conditions are met.', regulation: 'Chapter VI-A' },
    { id: '34', title: 'Clause 34: TDS / TCS Compliance', description: 'Details of tax deducted or collected at source.', guidance: 'Reconcile Books vs TRACES (Form 26AS/TDS returns). Report: (a) Total exp subject to TDS, (b) Valid deduction, (c) Short deduction, (d) Late deposit. Critical for disallowance u/s 40(a)(ia).', regulation: 'Chapter XVII-B, Sec 40(a)(i)/(ia)' },
    { id: '35', title: 'Clause 35: Rice/Commodity Stocks', description: 'Quantitative details of principal items of raw materials, finished products, etc.', guidance: 'For manufacturing/trading: Provide Opening Stock, Purchases, Sales, Closing Stock quantity. Match with Stock Register. Note yield/shortage percentages.', regulation: '-' },
    { id: '36', title: 'Clause 36: Dividend Tax', description: 'Details of tax on distributed profits.', guidance: 'Since DDT is abolished (now taxed in hands of receiver), this is mostly historical or specific to Sec 115O deemed dividend scenarios prior to amendment or foreign dividend reporting.', regulation: 'Sec 115-O' },
    { id: '36A', title: 'Clause 36A: Deemed Dividend', description: 'Amount received in the nature of dividend (Sec 2(22)(e)).', guidance: 'Check loans/advances received from a company where assessee holds > 10% voting power. Such loans are deemed dividend to the extent of accumulated profits of lender.', regulation: 'Sec 2(22)(e)' },
    { id: '37', title: 'Clause 37: Cost Audit', description: 'Whether any cost audit was carried out?', guidance: 'If maintenance of cost records is mandated u/s 148, specify if audit was conducted. Attach copy of conclusion/qualification from Cost Audit Report.', regulation: 'Sec 148 of Companies Act' },
    { id: '38', title: 'Clause 38: Central Excise Audit', description: 'Whether any audit was conducted under the Central Excise Act?', guidance: 'Report if any Excise audit happened. Though Excise is largely subsumed by GST, legacy cases or specific goods (fuel/liquor) might trigger this.', regulation: 'Central Excise Act, 1944' },
    { id: '39', title: 'Clause 39: Service Tax Audit', description: 'Whether any audit was conducted under section 72A of the Finance Act, 1994?', guidance: 'Similar to Cl 38, report any Service Tax audit conducted during the year. Provide details of demands or adverse findings.', regulation: 'Finance Act, 1994' },
    { id: '40', title: 'Clause 40: Ratios', description: 'Accounting ratios (Gross Profit, Net Profit, Stock-in-trade, Material consumed).', guidance: 'Calculate GP/Turnover, NP/Turnover, Stock/Turnover, Material/Turnover. Compare with Previous Year. Explain significant deviations in remarks.', regulation: '-' },
    { id: '41', title: 'Clause 41: Tax Demands/Refunds', description: 'Details of demand raised or refund issued during the previous year.', guidance: 'Obtain list of demands/refunds from IT Portal (Response to Outstanding Demand). Verify vs Assessment Orders (Sec 143(3), 154, etc.).', regulation: 'Sec 156' },
    { id: '42', title: 'Clause 42: Form 61/61A/61B', description: 'Details regarding furnishing of statements (SFT, etc.).', guidance: 'Check applicability of SFT (Statement of Financial Transactions). If High Value Transactions (Cash deposits, Shares, etc.) occurred, verify Form 61A filing. Report ITDREIN and date.', regulation: 'Sec 285BA, Rules 114E-114H' },
    { id: '43', title: 'Clause 43: CBCR', description: 'Whether liable to furnish report under section 286 (Country-by-Country Report)?', guidance: 'Applicable to International Groups with revenue > Euro 750 million. If Indian parent or designated entity, verify Form 3CEAD filing details.', regulation: 'Sec 286' },
    { id: '44', title: 'Clause 44: GST Breakdown', description: 'Break-up of total expenditure of entities registered or not registered under the GST.', guidance: 'Reconcile Total Expenditure in P&L with GST returns. Categorize into: Exempt, Composition Dealers, Registered Entities, and Unregistered Entities. This is a reconciliation tool for the Dept.', regulation: 'GST Act' },
];

export const Form3CD: React.FC<Form3CDProps> = ({ token, entityId, trialBalanceData, masters }) => {
    const [data, setData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [activeClause, setActiveClause] = useState('1');
    const [autoDetectResults, setAutoDetectResults] = useState<TaxAuditAutoResult[] | null>(null);

    useEffect(() => {
        loadData();
    }, [entityId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const report = await getTaxAuditReport(token, entityId);
            setData(report.clauseData || {});
        } catch (error) {
            console.error("Failed to load Tax Audit report", error);
        } finally {
            setLoading(false);
        }
    };

    const updateClauseData = (clauseId: string, field: string, value: any) => {
        setData(prev => ({
            ...prev,
            [clauseId]: { ...prev[clauseId], [field]: value }
        }));
    };

    const handleTableChange = (clauseId: string, index: number, field: string, value: string) => {
        const currentRows = data[clauseId]?.tableData || [];
        const newRows = [...currentRows];
        if (!newRows[index]) newRows[index] = {};
        newRows[index] = { ...newRows[index], [field]: value };
        updateClauseData(clauseId, 'tableData', newRows);
    };

    const addTableRow = (clauseId: string) => {
        const currentRows = data[clauseId]?.tableData || [];
        updateClauseData(clauseId, 'tableData', [...currentRows, {}]);
    };

    const removeTableRow = (clauseId: string, index: number) => {
        const currentRows = data[clauseId]?.tableData || [];
        updateClauseData(clauseId, 'tableData', currentRows.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveTaxAuditReport(token, entityId, data);
            setLastSaved(new Date());
        } catch (error) {
            console.error("Failed to save", error);
            alert("Error saving report.");
        } finally {
            setSaving(false);
        }
    };

    // Auto-detect relevance using mapped trial balance data
    const handleAutoDetect = () => {
        if (!trialBalanceData || !masters) {
            alert('Trial Balance data and Masters are required for auto-detection. Please map ledgers in the Mapping Workbench first.');
            return;
        }

        const results = determineAllClauseRelevance(trialBalanceData, masters);
        setAutoDetectResults(results);

        // Update clause data with auto-populated values
        const newData = { ...data };
        for (const result of results) {
            if (result.isRelevant && result.autoPopulatedData) {
                newData[result.clauseId] = {
                    ...newData[result.clauseId],
                    ...result.autoPopulatedData
                };
            }
        }
        setData(newData);

        // Show summary
        const relevant = results.filter(r => r.triggeringLedgers.length > 0).length;
        alert(`Auto-detected ${relevant} clauses with relevant data. Review highlighted clauses.`);
    };

    if (loading) return <div className="text-gray-400 p-8 text-center">Loading Form 3CD...</div>;

    return (
        <div className="flex h-full bg-gray-900">
            {/* Clause Sidebar */}
            <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
                <div className="p-4 border-b border-gray-700 font-bold text-white">Form 3CD Clauses</div>
                {CLAUSES_3CD.map(c => (
                    <button
                        key={c.id}
                        onClick={() => setActiveClause(c.id)}
                        className={`w-full text-left p-3 text-sm hover:bg-gray-700 ${activeClause === c.id ? 'bg-gray-700 text-brand-blue-light border-l-4 border-brand-blue' : 'text-gray-400'}`}
                    >
                        <div className="font-semibold">{c.title}</div>
                        <div className="text-xs text-gray-500 truncate">{c.description}</div>
                    </button>
                ))}
            </div>

            {/* content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-white">Tax Audit Report (Form 3CD)</h2>
                        <p className="text-sm text-gray-400">Section 44AB of the Income-tax Act, 1961</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        {trialBalanceData && masters && (
                            <button
                                onClick={handleAutoDetect}
                                className="flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium"
                                title="Auto-detect clause relevance from mapped trial balance"
                            >
                                <WandIcon className="w-4 h-4 mr-2" />
                                Auto-Detect
                            </button>
                        )}
                        <SaveStatusIndicator status={saving ? 'saving' : 'saved'} />
                        <button onClick={handleSave} className="bg-brand-blue hover:bg-brand-blue-dark text-white px-4 py-2 rounded-md font-medium">Save Report</button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-semibold text-gray-200">{CLAUSES_3CD.find(c => c.id === activeClause)?.title}</h3>
                            {CLAUSES_3CD.find(c => c.id === activeClause)?.regulation && (
                                <span className="bg-purple-900/50 text-purple-200 border border-purple-700 px-2 py-1 rounded text-xs font-mono">
                                    {CLAUSES_3CD.find(c => c.id === activeClause)?.regulation}
                                </span>
                            )}
                        </div>
                        {CLAUSES_3CD.find(c => c.id === activeClause)?.guidance && (
                            <div className="bg-blue-900/30 border border-blue-800 rounded p-3 mb-4 text-xs text-blue-200">
                                <strong>Guidance Note / Information Sought:</strong> {CLAUSES_3CD.find(c => c.id === activeClause)?.guidance}
                            </div>
                        )}

                        {/* Clause 34 (TDS) */}
                        {activeClause === '34' && (
                            <div>
                                <div className="mb-4">
                                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Section 34(a): Tax Deducted at Source (TDS) / Tax Collected at Source (TCS)</h4>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-xs text-left text-gray-300">
                                            <thead>
                                                <tr className="bg-gray-700/50">
                                                    <th className="p-2">TAN</th>
                                                    <th className="p-2">Section</th>
                                                    <th className="p-2">Nature of Payment</th>
                                                    <th className="p-2">Total Amount</th>
                                                    <th className="p-2">Amount on which TDS deducted</th>
                                                    <th className="p-2">TDS Deducted</th>
                                                    <th className="p-2">TDS Deposited</th>
                                                    <th className="p-2">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(data['34']?.tableData || []).map((row: any, idx: number) => (
                                                    <tr key={idx} className="border-t border-gray-700">
                                                        <td className="p-1"><input className="bg-gray-900 w-full p-1 rounded" value={row.tan || ''} onChange={e => handleTableChange('34', idx, 'tan', e.target.value)} /></td>
                                                        <td className="p-1"><input className="bg-gray-900 w-full p-1 rounded" value={row.section || ''} onChange={e => handleTableChange('34', idx, 'section', e.target.value)} /></td>
                                                        <td className="p-1"><input className="bg-gray-900 w-full p-1 rounded" value={row.nature || ''} onChange={e => handleTableChange('34', idx, 'nature', e.target.value)} /></td>
                                                        <td className="p-1"><input className="bg-gray-900 w-24 p-1 rounded text-right" value={row.totalAmount || ''} onChange={e => handleTableChange('34', idx, 'totalAmount', e.target.value)} /></td>
                                                        <td className="p-1"><input className="bg-gray-900 w-24 p-1 rounded text-right" value={row.amountDeducted || ''} onChange={e => handleTableChange('34', idx, 'amountDeducted', e.target.value)} /></td>
                                                        <td className="p-1"><input className="bg-gray-900 w-24 p-1 rounded text-right" value={row.tdsDeducted || ''} onChange={e => handleTableChange('34', idx, 'tdsDeducted', e.target.value)} /></td>
                                                        <td className="p-1"><input className="bg-gray-900 w-24 p-1 rounded text-right" value={row.tdsDeposited || ''} onChange={e => handleTableChange('34', idx, 'tdsDeposited', e.target.value)} /></td>
                                                        <td className="p-1"><button onClick={() => removeTableRow('34', idx)} className="text-red-400">x</button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <button onClick={() => addTableRow('34')} className="mt-2 text-xs text-brand-blue">+ Add TDS Row</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Clause 44 (GST) */}
                        {activeClause === '44' && (
                            <div>
                                <p className="text-sm text-gray-400 mb-4">Break-up of total expenditure of entities registered or not registered under the GST:</p>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-xs text-left text-gray-300 border border-gray-600">
                                        <thead>
                                            <tr className="bg-gray-700/50">
                                                <th className="p-2 border border-gray-600" rowSpan={2}>Total Expenditure</th>
                                                <th className="p-2 border border-gray-600 text-center" colSpan={3}>Expenditure in respect of entities registered under GST</th>
                                                <th className="p-2 border border-gray-600" rowSpan={2}>Expenditure relating to entities not registered under GST</th>
                                            </tr>
                                            <tr className="bg-gray-700/50">
                                                <th className="p-2 border border-gray-600">Relating to goods/services exempt from GST</th>
                                                <th className="p-2 border border-gray-600">Relating to entities falling under composition scheme</th>
                                                <th className="p-2 border border-gray-600">Relating to other registered entities</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="p-2 border border-gray-600"><input className="bg-gray-900 w-full p-1 rounded text-right" value={data['44']?.totalExp || ''} onChange={e => updateClauseData('44', 'totalExp', e.target.value)} placeholder="0.00" /></td>
                                                <td className="p-2 border border-gray-600"><input className="bg-gray-900 w-full p-1 rounded text-right" value={data['44']?.exempt || ''} onChange={e => updateClauseData('44', 'exempt', e.target.value)} placeholder="0.00" /></td>
                                                <td className="p-2 border border-gray-600"><input className="bg-gray-900 w-full p-1 rounded text-right" value={data['44']?.composition || ''} onChange={e => updateClauseData('44', 'composition', e.target.value)} placeholder="0.00" /></td>
                                                <td className="p-2 border border-gray-600"><input className="bg-gray-900 w-full p-1 rounded text-right" value={data['44']?.registered || ''} onChange={e => updateClauseData('44', 'registered', e.target.value)} placeholder="0.00" /></td>
                                                <td className="p-2 border border-gray-600"><input className="bg-gray-900 w-full p-1 rounded text-right" value={data['44']?.unregistered || ''} onChange={e => updateClauseData('44', 'unregistered', e.target.value)} placeholder="0.00" /></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Generic View for other clauses */}
                        {!['34', '44'].includes(activeClause) && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Status / Response</label>
                                    <input
                                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"
                                        value={data[activeClause]?.response || ''}
                                        onChange={e => updateClauseData(activeClause, 'response', e.target.value)}
                                        placeholder="Enter details..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Auditor's Remarks</label>
                                    <textarea
                                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white h-32"
                                        value={data[activeClause]?.remarks || ''}
                                        onChange={e => updateClauseData(activeClause, 'remarks', e.target.value)}
                                        placeholder="Enter remarks..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
