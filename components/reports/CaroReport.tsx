import React, { useState, useEffect } from 'react';
import { getCaroReport, saveCaroReport } from '../../services/apiService.ts';
import { SaveStatusIndicator } from '../SaveStatusIndicator.tsx';
import { determineAllClauseApplicability, CAROApplicabilityResult, getCAROSummary } from '../../services/caroService.ts';
import { TrialBalanceItem, Masters } from '../../types.ts';
import { WandIcon } from '../icons.tsx';

interface CaroReportProps {
    token: string;
    entityId: string;
    trialBalanceData?: TrialBalanceItem[];
    masters?: Masters;
}

const CARO_CLAUSES = [
    { id: '1', title: 'Clause 1: PPE & Intangible Assets', description: 'Records, Physical Verification, Title Deeds, Revaluation, Benami proceedings.', guidance: 'Verify maintenance of proper records (details of quantity/situation). Check Physical Verification reports for material discrepancies. Confirm Title Deeds of immovable properties are held in company name (if not, provide details in table). Check if any revaluation done (Reg Valuer used? >10% change?). Check for Benami proceedings.', regulation: 'Sec 128, Sec 2(10), Benami Act' },
    { id: '2', title: 'Clause 2: Inventory', description: 'Physical verification coverage, Working Capital limits check.', guidance: 'Verify method and coverage of physical verification by management. Allowable discrepancy < 10%. Crucial: If WC limit > 5 Cr sanctioned on security of current assets, reconcile quarterly stock statements filed with bank vs books. Report material differences.', regulation: 'AS-2 / IndAS-2' },
    { id: '3', title: 'Clause 3: Loans & Investments', description: 'Loans/Guarantees/Security to entities. Terms prejudicial?', guidance: 'Check aggregate amount of loans/guarantees to Subsidiaries/JVs/Associates vs Others. Are terms prejudicial to company interest? Is repayment schedule stipulated and adhered to? Report overdues > 90 days. ', regulation: 'Sec 189, Sec 186' },
    { id: '4', title: 'Clause 4: Sec 185 & 186', description: 'Compliance with provisions of loans to directors and investments.', guidance: 'Verify compliance with Loan to Directors (Sec 185 - Prohibited/Restricted) and Inter-corporate Loans (Sec 186 - Limits and Interest rates). Check if Special Resolution passed for limits.', regulation: 'Sec 185, Sec 186' },
    { id: '5', title: 'Clause 5: Public Deposits', description: 'Acceptance of deposits directives.', guidance: 'Verify compliance with RBI directives and Sec 73-76. Check for deemed deposits (advances > 365 days). Report nature of contraventions if any order passed by CLB/NCLT/RBI.', regulation: 'Sec 73 to 76' },
    { id: '6', title: 'Clause 6: Cost Records', description: 'Maintenance of cost records u/s 148.', guidance: 'Check if Cost Records are prescribed by Central Govt for the industry. If yes, verify if they are actually made and maintained broad compliance. (Detailed cost audit check not required here, just maintenance).', regulation: 'Sec 148(1)' },
    { id: '7', title: 'Clause 7: Statutory Dues', description: 'Regularity in depositing undisputed dues. Disputed dues details.', guidance: 'Check regularity only for UNDISPUTED dues (PF, ESI, GST, Tax). Report arrears outstanding > 6 months as on B/S date. For DISPUTED dues, report: Name of Statute, Nature of Dues, Amount, Forum where dispute is pending.', regulation: 'PF Act, ESI Act, GST Act, IT Act' },
    { id: '8', title: 'Clause 8: Unrecorded Income', description: 'Transactions surrendered in tax assessments.', guidance: 'Check if any income surrendered/disclosed in tax assessments (search/survey) which was NOT recorded in books. Ensure it is now recorded properly.', regulation: 'Income Tax Act, 1961' },
    { id: '9', title: 'Clause 9: Repayment of Dues', description: 'Default in repayment to banks/FIs. Term loan utilization.', guidance: 'Check for default in repayment of principal/interest to any lender. Report amount and period of delay. Verify if Term Loans applied for stated purpose (no diversion). Verify if short-term funds used for long-term purposes.', regulation: 'Sec 143(11)' },
    { id: '10', title: 'Clause 10: IPO/FPO & Pref Allotment', description: 'End use of IPO funds. Compliance for Pref Allotment (Sec 42/62).', guidance: 'Track end-use of IPO/FPO monies. For Preferential Allotment/Pv Placement: Check compliance with Sec 42/62 (Valuation, Special Res, Separate Bank A/c) and end-use of funds.', regulation: 'Sec 42, Sec 62' },
    { id: '11', title: 'Clause 11: Fraud', description: 'Fraud by/on company. Whistle-blower complaints.', guidance: 'Report ANY fraud noticed/reported. Specifically check ADT-4 filings (Fraud > 1Cr reported to Govt). Ask management about whistle-blower complaints received and how dealt with.', regulation: 'Sec 143(12), Sec 177' },
    { id: '12', title: 'Clause 12: Nidhi Company', description: 'Net Owned Funds ratio (1:20) and 10% unencumbered deposits.', guidance: 'Specific to Nidhi Companies. Check Ratio of Net Owned Funds to Deposits. Ensure 10% term deposits are held unencumbered to meet withdrawals.', regulation: 'Sec 406, Nidhi Rules 2014' },
    { id: '13', title: 'Clause 13: Related Parties', description: 'Compliance with Sec 177/188. Disclosures.', guidance: 'Verify Related Party Transactions (RPTs). Check Audit Committee approval (Sec 177) and Board/Member approval (Sec 188) where applicable (arms length price). Verify AS-18 disclosure.', regulation: 'Sec 177, Sec 188, AS-18' },
    { id: '14', title: 'Clause 14: Internal Audit', description: 'Internal Audit System commensurate with size?', guidance: 'Is IA mandatory (Listed/Size criteria)? If yes, does the system match business size? Did Statutory Auditor consider Internal Auditor reports?', regulation: 'Sec 138' },
    { id: '15', title: 'Clause 15: Non-Cash Transactions', description: 'Non-cash transactions with directors (Sec 192).', guidance: 'Check for acquisition of assets from/to directors for consideration other than cash. Verify compliance with Sec 192 (Valuation, Approval).', regulation: 'Sec 192' },
    { id: '16', title: 'Clause 16: NBFC Registration', description: 'RBI Act compliance (Sec 45-IA).', guidance: 'Check if company is conducting NBFC business (>50% financial assets/income) without registration. Core Investment Company (CIC) criteria checks.', regulation: 'Sec 45-IA of RBI Act' },
    { id: '17', title: 'Clause 17: Cash Losses', description: 'Cash losses incurred in current/preceding FY.', guidance: 'Calculate Cash Loss (Net Profit + Non-cash charges like Dep). Report amount for current and preceding FY.', regulation: '-' },
    { id: '18', title: 'Clause 18: Auditor Resignation', description: 'Issues raised by outgoing auditor.', guidance: 'If previous auditor resigned, did current auditor verify the issues/concerns raised by them? Check communication details.', regulation: 'SA 510' },
    { id: '19', title: 'Clause 19: Material Uncertainty', description: 'Ability to meet liabilities for next 1 year.', guidance: 'Evaluate financial ratios, ageing, expected realization. Auditor to form opinion if MATERIAL UNCERTAINTY exists regarding payment of liabilities falling due within 1 year of BS date.', regulation: 'SA 570 (Going Concern)' },
    { id: '20', title: 'Clause 20: CSR Transfer', description: 'Unspent CSR to Sch VII Fund (Sec 135).', guidance: 'Check unspent CSR. If "Ongoing Project": Transfer to Special Account within 30 days. If "Other than Ongoing": Transfer to Schedule VII Fund (PM Cares etc) within 6 months of year end.', regulation: 'Sec 135, Schedule VII' },
    { id: '21', title: 'Clause 21: Consolidated Remarks', description: 'Adverse remarks in subsidiaries CARO.', guidance: 'Only for CFS. Check separate CARO reports of subsidiaries/associates/JVs. Summarize any Qualification/Adverse remarks found there.', regulation: 'Sec 129, CARO 2020' },
];

export const CaroReport: React.FC<CaroReportProps> = ({ token, entityId, trialBalanceData, masters }) => {
    const [data, setData] = useState<Record<string, { status: string; remarks: string; tableData?: any[]; autoDetected?: CAROApplicabilityResult }>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [autoDetectResults, setAutoDetectResults] = useState<CAROApplicabilityResult[] | null>(null);

    useEffect(() => {
        loadData();
    }, [entityId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const report = await getCaroReport(token, entityId);
            if (report && report.clauseData) {
                setData(report.clauseData);
            } else {
                const initialData: any = {};
                CARO_CLAUSES.forEach(c => initialData[c.id] = { status: 'Compliant', remarks: '' });
                setData(initialData);
            }
        } catch (error) {
            console.error("Failed to load CARO report", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (id: string, field: 'status' | 'remarks' | 'tableData', value: any) => {
        setData(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const handleTableChange = (clauseId: string, index: number, field: string, value: string) => {
        const existingData = data[clauseId]?.tableData || [];
        const newData = [...existingData];
        if (!newData[index]) newData[index] = {};
        newData[index] = { ...newData[index], [field]: value };
        handleChange(clauseId, 'tableData', newData);
    };

    const addTableRow = (clauseId: string) => {
        const existingData = data[clauseId]?.tableData || [];
        handleChange(clauseId, 'tableData', [...existingData, {}]);
    };

    const removeTableRow = (clauseId: string, index: number) => {
        const existingData = data[clauseId]?.tableData || [];
        handleChange(clauseId, 'tableData', existingData.filter((_, i) => i !== index));
    };


    const handleSave = async () => {
        setSaving(true);
        try {
            await saveCaroReport(token, entityId, data);
            setLastSaved(new Date());
        } catch (error) {
            console.error("Failed to save", error);
            alert("Error saving report.");
        } finally {
            setSaving(false);
        }
    };

    // Auto-detect applicability using mapped trial balance data
    const handleAutoDetect = () => {
        if (!trialBalanceData || !masters) {
            alert('Trial Balance data and Masters are required for auto-detection. Please map ledgers in the Mapping Workbench first.');
            return;
        }

        const results = determineAllClauseApplicability(trialBalanceData, masters);
        setAutoDetectResults(results);

        // Map CARO service results to CARO_CLAUSES
        const clauseMapping: Record<string, string> = {
            'CARO-3i': '1',    // PPE
            'CARO-3ii': '2',   // Inventories
            'CARO-3iii': '3',  // Loans to Related Parties
            'CARO-3vii': '7',  // Statutory Dues
            'CARO-3ix': '9',   // Default in Repayment
            'CARO-3xi': '11',  // Fraud
        };

        // Update clause statuses based on auto-detection
        const newData = { ...data };
        for (const result of results) {
            const clauseId = clauseMapping[result.clauseId];
            if (clauseId && newData[clauseId]) {
                const autoStatus = result.isApplicable ? 'Compliant' : 'Not Applicable';
                const autoRemarks = result.isApplicable
                    ? `[Auto-detected] ${result.applicabilityReason}\n\nTriggering ledgers:\n${result.triggeringLedgers.slice(0, 5).map(l => `- ${l.ledger} (₹${l.amount.toLocaleString()})`).join('\n')}\n\nSuggested Response:\n${result.responseText}`
                    : `[Auto-detected] ${result.applicabilityReason}`;

                newData[clauseId] = {
                    ...newData[clauseId],
                    status: autoStatus,
                    remarks: autoRemarks,
                    autoDetected: result
                };
            }
        }
        setData(newData);
    };

    if (loading) return <div className="text-gray-400 p-8 text-center">Loading CARO Report...</div>;

    return (
        <div className="p-6 bg-gray-900 min-h-full">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-900 z-10 py-4 border-b border-gray-800">
                <div>
                    <h2 className="text-2xl font-bold text-white">CARO 2020 Report</h2>
                    <p className="text-sm text-gray-400">Companies (Auditor's Report) Order, 2020</p>
                </div>
                <div className="flex items-center space-x-4">
                    {trialBalanceData && masters && (
                        <button
                            onClick={handleAutoDetect}
                            className="flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium"
                            title="Auto-detect clause applicability from mapped trial balance"
                        >
                            <WandIcon className="w-4 h-4 mr-2" />
                            Auto-Detect
                        </button>
                    )}
                    <SaveStatusIndicator status={saving ? 'saving' : 'saved'} />
                    <button
                        onClick={handleSave}
                        className="bg-brand-blue hover:bg-brand-blue-dark text-white px-4 py-2 rounded-md font-medium"
                    >
                        Save Report
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {CARO_CLAUSES.map((clause) => (
                    <div key={clause.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-semibold text-gray-200">
                                <span className="text-brand-blue-light mr-2">Clause 3({clause.id.toLowerCase()}):</span>
                                {clause.title}
                            </h3>
                            <div className="flex items-center space-x-2">
                                {clause.regulation && (
                                    <span className="bg-purple-900/50 text-purple-200 border border-purple-700 px-2 py-1 rounded text-xs font-mono whitespace-nowrap">
                                        {clause.regulation}
                                    </span>
                                )}
                                <select
                                    value={data[clause.id]?.status || 'Compliant'}
                                    onChange={(e) => handleChange(clause.id, 'status', e.target.value)}
                                    className={`bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm font-medium ${data[clause.id]?.status === 'Non-Compliant' ? 'text-red-400 border-red-500' :
                                        data[clause.id]?.status === 'Not Applicable' ? 'text-gray-400' : 'text-green-400 border-green-500'
                                        }`}
                                >
                                    <option value="Compliant">Compliant / Yes</option>
                                    <option value="Non-Compliant">Non-Compliant / No</option>
                                    <option value="Not Applicable">Not Applicable</option>
                                </select>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">{clause.description}</p>

                        {clause.guidance && (
                            <div className="bg-yellow-900/30 border border-yellow-800 rounded p-3 mb-4 text-xs text-yellow-200">
                                <strong>Guidance Note / Audit Procedure:</strong> {clause.guidance}
                            </div>
                        )}

                        {/* Specific Table for Clause 1 (Title Deeds) */}
                        {clause.id === '1' && (
                            <div className="mb-4 bg-gray-900 p-2 rounded border border-gray-700">
                                <h4 className="text-xs font-semibold text-gray-400 mb-2">Details of Title Deeds not held in name of Company</h4>
                                <table className="w-full text-xs text-left text-gray-300">
                                    <thead>
                                        <tr>
                                            <th className="p-1">Desc of Property</th>
                                            <th className="p-1">Gross Value</th>
                                            <th className="p-1">Held in name of</th>
                                            <th className="p-1">Promoter/Director?</th>
                                            <th className="p-1">Reason</th>
                                            <th className="p-1">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(data[clause.id]?.tableData || []).map((row, idx) => (
                                            <tr key={idx} className="border-t border-gray-800">
                                                <td className="p-1"><input className="bg-gray-800 w-full p-1 rounded" value={row.desc || ''} onChange={e => handleTableChange(clause.id, idx, 'desc', e.target.value)} /></td>
                                                <td className="p-1"><input className="bg-gray-800 w-24 p-1 rounded" value={row.value || ''} onChange={e => handleTableChange(clause.id, idx, 'value', e.target.value)} /></td>
                                                <td className="p-1"><input className="bg-gray-800 w-full p-1 rounded" value={row.holder || ''} onChange={e => handleTableChange(clause.id, idx, 'holder', e.target.value)} /></td>
                                                <td className="p-1"><input className="bg-gray-800 w-full p-1 rounded" value={row.relation || ''} onChange={e => handleTableChange(clause.id, idx, 'relation', e.target.value)} /></td>
                                                <td className="p-1"><input className="bg-gray-800 w-full p-1 rounded" value={row.reason || ''} onChange={e => handleTableChange(clause.id, idx, 'reason', e.target.value)} /></td>
                                                <td className="p-1"><button onClick={() => removeTableRow(clause.id, idx)} className="text-red-400 hover:text-red-300">x</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button onClick={() => addTableRow(clause.id)} className="mt-2 text-xs text-brand-blue hover:text-brand-blue-light">+ Add Row</button>
                            </div>
                        )}

                        {/* Specific Table for Clause 9 (Default in Repayment) */}
                        {clause.id === '9' && data[clause.id]?.status === 'Non-Compliant' && (
                            <div className="mb-4 bg-gray-900 p-2 rounded border border-gray-700">
                                <h4 className="text-xs font-semibold text-gray-400 mb-2">Details of Default in Repayment of Borrowings</h4>
                                <table className="w-full text-xs text-left text-gray-300">
                                    <thead>
                                        <tr>
                                            <th className="p-1">Nature of Borrowing</th>
                                            <th className="p-1">Name of Lender</th>
                                            <th className="p-1">Amount Not Paid</th>
                                            <th className="p-1">Principal/Interest</th>
                                            <th className="p-1">No. of Days Delay</th>
                                            <th className="p-1">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(data[clause.id]?.tableData || []).map((row, idx) => (
                                            <tr key={idx} className="border-t border-gray-800">
                                                <td className="p-1"><input className="bg-gray-800 w-full p-1 rounded" value={row.nature || ''} onChange={e => handleTableChange(clause.id, idx, 'nature', e.target.value)} /></td>
                                                <td className="p-1"><input className="bg-gray-800 w-full p-1 rounded" value={row.lender || ''} onChange={e => handleTableChange(clause.id, idx, 'lender', e.target.value)} /></td>
                                                <td className="p-1"><input className="bg-gray-800 w-24 p-1 rounded" value={row.amount || ''} onChange={e => handleTableChange(clause.id, idx, 'amount', e.target.value)} /></td>
                                                <td className="p-1"><select className="bg-gray-800 p-1 rounded" value={row.type || 'Principal'} onChange={e => handleTableChange(clause.id, idx, 'type', e.target.value)}><option>Principal</option><option>Interest</option><option>Both</option></select></td>
                                                <td className="p-1"><input className="bg-gray-800 w-16 p-1 rounded" value={row.delay || ''} onChange={e => handleTableChange(clause.id, idx, 'delay', e.target.value)} /></td>
                                                <td className="p-1"><button onClick={() => removeTableRow(clause.id, idx)} className="text-red-400 hover:text-red-300">x</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button onClick={() => addTableRow(clause.id)} className="mt-2 text-xs text-brand-blue hover:text-brand-blue-light">+ Add Row</button>
                            </div>
                        )}

                        <textarea
                            value={data[clause.id]?.remarks || ''}
                            onChange={(e) => handleChange(clause.id, 'remarks', e.target.value)}
                            placeholder="Auditor's Remarks / Observations..."
                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-gray-300 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue h-20"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
