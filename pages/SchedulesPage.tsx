



import React, { useState } from 'react';
import { AllData, ScheduleData, Role } from '../types.ts';
import { ShareCapitalSchedule } from '../components/schedules/ShareCapitalSchedule.tsx';
import { ConfirmationModal } from '../components/ConfirmationModal.tsx';
import { FinalizedBanner } from '../components/FinalizedBanner.tsx';
// Import all other schedule components...
import { OtherEquitySchedule } from '../components/schedules/OtherEquitySchedule.tsx';
import { BorrowingsSchedule } from '../components/schedules/BorrowingsSchedule.tsx';
import { TradePayablesSchedule } from '../components/schedules/TradePayablesSchedule.tsx';
import { PPESchedule } from '../components/schedules/PPESchedule.tsx';
import { CWIPSchedule } from '../components/schedules/CWIPSchedule.tsx';
import { IntangibleAssetsSchedule } from '../components/schedules/IntangibleAssetsSchedule.tsx';
import { InvestmentsSchedule } from '../components/schedules/InvestmentsSchedule.tsx';
import { LoansAndAdvancesSchedule } from '../components/schedules/LoansAndAdvancesSchedule.tsx';
import { InventoriesBalanceSchedule } from '../components/schedules/InventoriesBalanceSchedule.tsx';
import { TradeReceivablesSchedule } from '../components/schedules/TradeReceivablesSchedule.tsx';
import { CashAndCashEquivalentsSchedule } from '../components/schedules/CashAndCashEquivalentsSchedule.tsx';
import { RevenueFromOpsSchedule } from '../components/schedules/RevenueFromOpsSchedule.tsx';
import { OtherIncomeSchedule } from '../components/schedules/OtherIncomeSchedule.tsx';
import { CostOfMaterialsConsumedSchedule } from '../components/schedules/CostOfMaterialsConsumedSchedule.tsx';
import { ChangesInInventoriesSchedule } from '../components/schedules/ChangesInInventoriesSchedule.tsx';
import { EmployeeBenefitsSchedule } from '../components/schedules/EmployeeBenefitsSchedule.tsx';
import { FinanceCostsSchedule } from '../components/schedules/FinanceCostsSchedule.tsx';
import { OtherExpensesSchedule } from '../components/schedules/OtherExpensesSchedule.tsx';
import { TaxExpenseSchedule } from '../components/schedules/TaxExpenseSchedule.tsx';
import { EarningsPerShareSchedule } from '../components/schedules/EarningsPerShareSchedule.tsx';
import { RelatedPartySchedule } from '../components/schedules/RelatedPartySchedule.tsx';
import { ContingentLiabilitiesSchedule } from '../components/schedules/ContingentLiabilitiesSchedule.tsx';
import { EntityInfoSchedule } from '../components/schedules/narrative/EntityInfoSchedule.tsx';
import { AccountingPoliciesNote } from '../components/schedules/narrative/AccountingPoliciesNote.tsx';
import { EventsAfterBalanceSheetNote } from '../components/schedules/narrative/EventsAfterBalanceSheetNote.tsx';
import { CommitmentsSchedule } from '../components/schedules/CommitmentsSchedule.tsx';
import { ExceptionalItemsSchedule } from '../components/schedules/ExceptionalItemsSchedule.tsx';
import { AuditorPaymentsSchedule } from '../components/schedules/AuditorPaymentsSchedule.tsx';
import { ForeignExchangeSchedule } from '../components/schedules/ForeignExchangeSchedule.tsx';
import { RatioAnalysisExplanations } from '../components/schedules/RatioAnalysisExplanations.tsx';
import { DeferredTaxSchedule } from '../components/schedules/DeferredTaxSchedule.tsx';
import { CWIPAgeingSchedule } from '../components/schedules/CWIPAgeingSchedule.tsx';
import { IntangibleAssetsUnderDevelopmentMovementSchedule } from '../components/schedules/IntangibleAssetsUnderDevelopmentMovementSchedule.tsx';
import { IntangibleAssetsUnderDevelopmentSchedule } from '../components/schedules/IntangibleAssetsUnderDevelopmentSchedule.tsx';
import { AdditionalRegulatoryInfoNote } from '../components/schedules/narrative/AdditionalRegulatoryInfoNote.tsx';
import { TradePayablesMsmeSchedule } from '../components/schedules/TradePayablesMsmeSchedule.tsx';
import { LongTermReceivablesAgeingSchedule } from '../components/schedules/LongTermReceivablesAgeingSchedule.tsx';
import { GovernmentGrantsSchedule } from '../components/schedules/GovernmentGrantsSchedule.tsx';
import { DiscontinuingOperationsSchedule } from '../components/schedules/DiscontinuingOperationsSchedule.tsx';
import { AmalgamationsSchedule } from '../components/schedules/AmalgamationsSchedule.tsx';
import { ARAPInputSheet } from '../components/schedules/ARAPInputSheet.tsx';

// NEW IMPORTS
import { OtherLongTermLiabilitiesSchedule } from '../components/schedules/OtherLongTermLiabilitiesSchedule.tsx';
import { ProvisionsSchedule } from '../components/schedules/ProvisionsSchedule.tsx';
import { OtherCurrentLiabilitiesSchedule } from '../components/schedules/OtherCurrentLiabilitiesSchedule.tsx';
import { CurrentInvestmentsSchedule } from '../components/schedules/CurrentInvestmentsSchedule.tsx';
import { ShortTermLoansAndAdvancesSchedule } from '../components/schedules/ShortTermLoansAndAdvancesSchedule.tsx';
import { PurchasesSchedule } from '../components/schedules/PurchasesSchedule.tsx';
import { OtherNonCurrentAssetsSchedule } from '../components/schedules/OtherNonCurrentAssetsSchedule.tsx';
import { OtherCurrentAssetsSchedule } from '../components/schedules/OtherCurrentAssetsSchedule.tsx';
import { ConstructionContractsSchedule } from '../components/schedules/ConstructionContractsSchedule.tsx';
import { SegmentReportingSchedule } from '../components/schedules/SegmentReportingSchedule.tsx';
import { LeasesSchedule } from '../components/schedules/LeasesSchedule.tsx';
import { PartnerOwnerFundsSchedule } from '../components/schedules/PartnerOwnerFundsSchedule.tsx';
import { getEntityLevel, getApplicableNotes } from '../utils/applicabilityUtils.ts';
import { populateScheduleFromTB } from '../utils/scheduleAutoPopulate.ts';


type ScheduleView = 'entityInfo' | 'accountingPolicies' | 'shareCapital' | 'otherEquity' | 'partnersFunds' | 'ownersFunds' | 'borrowings' | 'otherLongTermLiabilities' | 'provisions' | 'tradePayables' | 'otherCurrentLiabilities' | 'msme' | 'ppe' | 'cwip' | 'intangible' | 'intangibleDev' | 'investments' | 'longTermLoans' | 'longTermReceivables' | 'otherNonCurrentAssets' | 'currentInvestments' | 'inventories' | 'tradeReceivables' | 'cash' | 'shortTermLoans' | 'otherCurrentAssets' | 'revenue' | 'otherIncome' | 'cogs' | 'purchases' | 'changesInInv' | 'employee' | 'finance' | 'otherExpenses' | 'tax' | 'exceptional' | 'eps' | 'relatedParties' | 'contingent' | 'commitments' | 'eventsAfterBS' | 'forex' | 'auditor' | 'regulatory' | 'deferredTax' | 'ratioExplanations' | 'construction' | 'govtGrants' | 'segmentReporting' | 'leases' | 'discontinuingOps' | 'amalgamations' | 'arList' | 'apList';

export const SchedulesPage: React.FC<{
    allData: AllData;
    setScheduleData: React.Dispatch<React.SetStateAction<ScheduleData>>;
    setAllData: (setter: React.SetStateAction<AllData | null>) => void;
    role: Role | null;
}> = ({ allData, setScheduleData, setAllData, role }) => {
    const [activeView, setActiveView] = useState<ScheduleView | null>(null);
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [isAutoFillConfirmOpen, setAutoFillConfirmOpen] = useState(false);

    const { scheduleData } = allData;
    const { entityInfo } = scheduleData;
    const isFinalized = scheduleData.isFinalized;
    const effectiveIsFinalized = isFinalized || role === 'VIEWER';

    const handleFinalize = () => {
        setScheduleData(prev => ({ ...prev, isFinalized: true }));
        setConfirmModalOpen(false);
    };

    const handleEdit = () => {
        setScheduleData(prev => ({ ...prev, isFinalized: false }));
    }

    const renderSchedule = () => {
        if (!activeView) {
            return <div>Select a schedule from the left panel to begin.</div>;
        }
        switch (activeView) {
            // General
            case 'entityInfo':
                return <EntityInfoSchedule data={scheduleData.entityInfo} onUpdate={setScheduleData} isFinalized={effectiveIsFinalized} />;
            case 'accountingPolicies':
                return <AccountingPoliciesNote data={scheduleData.accountingPolicies} onUpdate={setScheduleData} isFinalized={effectiveIsFinalized} />;

            // Equity & Liabilities
            case 'shareCapital':
                return <ShareCapitalSchedule data={scheduleData.companyShareCapital} onUpdate={setScheduleData} isFinalized={effectiveIsFinalized} />;
            case 'otherEquity':
                return <OtherEquitySchedule data={scheduleData.companyOtherEquity} onUpdate={(d) => setScheduleData(p => ({ ...p, companyOtherEquity: d }))} isFinalized={effectiveIsFinalized} />;
            case 'partnersFunds':
                return <PartnerOwnerFundsSchedule title="Partners' Funds" data={scheduleData.partnersFunds} onUpdate={(d) => setScheduleData(p => ({ ...p, partnersFunds: d }))} isFinalized={effectiveIsFinalized} />;
            case 'ownersFunds':
                return <PartnerOwnerFundsSchedule title="Owners' Funds" data={scheduleData.partnersFunds} onUpdate={(d) => setScheduleData(p => ({ ...p, partnersFunds: d }))} isFinalized={effectiveIsFinalized} />;
            case 'borrowings':
                return <BorrowingsSchedule data={scheduleData.borrowings} onUpdate={setScheduleData} isFinalized={effectiveIsFinalized} />;
            case 'otherLongTermLiabilities':
                return <OtherLongTermLiabilitiesSchedule data={scheduleData.otherLongTermLiabilities} onUpdate={(d) => setScheduleData(p => ({ ...p, otherLongTermLiabilities: d }))} isFinalized={effectiveIsFinalized} trialBalanceData={allData.trialBalanceData} />;
            case 'provisions':
                return <ProvisionsSchedule data={scheduleData.provisions} onUpdate={(d) => setScheduleData(p => ({ ...p, provisions: d }))} isFinalized={effectiveIsFinalized} />;
            case 'otherCurrentLiabilities':
                return <OtherCurrentLiabilitiesSchedule data={scheduleData.otherCurrentLiabilities} onUpdate={(d) => setScheduleData(p => ({ ...p, otherCurrentLiabilities: d }))} isFinalized={effectiveIsFinalized} trialBalanceData={allData.trialBalanceData} />;
            case 'tradePayables':
                return <TradePayablesSchedule data={scheduleData.tradePayables} onUpdate={(d) => setScheduleData(p => ({ ...p, tradePayables: d }))} isFinalized={effectiveIsFinalized} />;
            case 'msme':
                return <TradePayablesMsmeSchedule data={scheduleData.tradePayables.msmeDisclosures} onUpdate={(d) => setScheduleData(p => ({ ...p, tradePayables: { ...p.tradePayables, msmeDisclosures: d } }))} isFinalized={effectiveIsFinalized} />;
            case 'deferredTax':
                return <DeferredTaxSchedule data={scheduleData.deferredTax} onUpdate={(d) => setScheduleData(p => ({ ...p, deferredTax: d }))} isFinalized={effectiveIsFinalized} />;

            // Assets
            case 'ppe':
                return <PPESchedule data={scheduleData.ppe} onUpdate={(d) => setScheduleData(p => ({ ...p, ppe: d }))} isFinalized={effectiveIsFinalized} />;
            case 'cwip':
                return (
                    <div className="space-y-8">
                        <CWIPSchedule data={scheduleData.cwip} onUpdate={setScheduleData} isFinalized={effectiveIsFinalized} />
                        <CWIPAgeingSchedule data={scheduleData.cwipAgeing} onUpdate={(d) => setScheduleData(p => ({ ...p, cwipAgeing: d }))} isFinalized={effectiveIsFinalized} />
                    </div>
                );
            case 'intangible':
                return <IntangibleAssetsSchedule data={scheduleData.intangibleAssets} onUpdate={(d) => setScheduleData(p => ({ ...p, intangibleAssets: d }))} isFinalized={effectiveIsFinalized} />;
            case 'intangibleDev':
                return (
                    <div className="space-y-8">
                        <IntangibleAssetsUnderDevelopmentMovementSchedule data={scheduleData.intangibleAssetsUnderDevelopmentMovement} onUpdate={(d) => setScheduleData(p => ({ ...p, intangibleAssetsUnderDevelopmentMovement: d }))} isFinalized={effectiveIsFinalized} />
                        <IntangibleAssetsUnderDevelopmentSchedule data={scheduleData.intangibleAssetsUnderDevelopmentAgeing} onUpdate={(d) => setScheduleData(p => ({ ...p, intangibleAssetsUnderDevelopmentAgeing: d }))} isFinalized={effectiveIsFinalized} />
                    </div>
                );
            case 'investments':
                return <InvestmentsSchedule data={scheduleData.investments} onUpdate={(d) => setScheduleData(p => ({ ...p, investments: d }))} isFinalized={effectiveIsFinalized} />;
            case 'currentInvestments':
                return <CurrentInvestmentsSchedule data={scheduleData.currentInvestments} onUpdate={(d) => setScheduleData(p => ({ ...p, currentInvestments: d }))} isFinalized={effectiveIsFinalized} />;
            case 'longTermLoans':
                return <LoansAndAdvancesSchedule data={scheduleData.loansAndAdvances} onUpdate={(d) => setScheduleData(p => ({ ...p, loansAndAdvances: d }))} isFinalized={effectiveIsFinalized} />;
            case 'shortTermLoans':
                return <ShortTermLoansAndAdvancesSchedule data={scheduleData.shortTermLoansAndAdvances} onUpdate={(d) => setScheduleData(p => ({ ...p, shortTermLoansAndAdvances: d }))} isFinalized={effectiveIsFinalized} />;
            case 'longTermReceivables':
                return <LongTermReceivablesAgeingSchedule data={scheduleData.longTermTradeReceivables.ageing} onUpdate={(d) => setScheduleData(p => ({ ...p, longTermTradeReceivables: { ...p.longTermTradeReceivables, ageing: d } }))} isFinalized={effectiveIsFinalized} />;
            case 'otherNonCurrentAssets':
                return <OtherNonCurrentAssetsSchedule data={scheduleData.otherNonCurrentAssets} onUpdate={(d) => setScheduleData(p => ({ ...p, otherNonCurrentAssets: d }))} isFinalized={effectiveIsFinalized} trialBalanceData={allData.trialBalanceData} />;
            case 'inventories':
                return <InventoriesBalanceSchedule data={scheduleData.inventories} valuationMode={scheduleData.inventoriesValuationMode} onUpdate={setScheduleData} isFinalized={effectiveIsFinalized} />;
            case 'tradeReceivables':
                return <TradeReceivablesSchedule title="Short-Term Trade Receivables" data={scheduleData.tradeReceivables} onUpdate={(d) => setScheduleData(p => ({ ...p, tradeReceivables: d }))} isFinalized={effectiveIsFinalized} />;
            case 'arList':
                return <ARAPInputSheet title="AR Party List & Classification" type="AR" data={scheduleData.arList} onUpdate={(d) => setScheduleData(p => ({ ...p, arList: d }))} isFinalized={effectiveIsFinalized} trialBalanceData={allData.trialBalanceData} />;
            case 'apList':
                return <ARAPInputSheet title="AP Party List & Classification" type="AP" data={scheduleData.apList} onUpdate={(d) => setScheduleData(p => ({ ...p, apList: d }))} isFinalized={effectiveIsFinalized} trialBalanceData={allData.trialBalanceData} />;
            case 'cash':
                return <CashAndCashEquivalentsSchedule data={scheduleData.cashAndCashEquivalents} onUpdate={setScheduleData} isFinalized={effectiveIsFinalized} />;
            case 'otherCurrentAssets':
                return <OtherCurrentAssetsSchedule data={scheduleData.otherCurrentAssets} onUpdate={(d) => setScheduleData(p => ({ ...p, otherCurrentAssets: d }))} isFinalized={effectiveIsFinalized} trialBalanceData={allData.trialBalanceData} />;

            // P&L
            case 'revenue':
                return <RevenueFromOpsSchedule data={scheduleData.revenueFromOps} onUpdate={(d) => setScheduleData(p => ({ ...p, revenueFromOps: d }))} isFinalized={effectiveIsFinalized} trialBalanceData={allData.trialBalanceData} />;
            case 'otherIncome':
                return <OtherIncomeSchedule data={scheduleData.otherIncome} onUpdate={(d) => setScheduleData(p => ({ ...p, otherIncome: d }))} isFinalized={effectiveIsFinalized} trialBalanceData={allData.trialBalanceData} />;
            case 'cogs':
                return <CostOfMaterialsConsumedSchedule data={scheduleData.costOfMaterialsConsumed} onUpdate={setScheduleData} isFinalized={effectiveIsFinalized} />;
            case 'purchases':
                return <PurchasesSchedule data={scheduleData.purchases} onUpdate={(d) => setScheduleData(p => ({ ...p, purchases: d }))} isFinalized={effectiveIsFinalized} trialBalanceData={allData.trialBalanceData} />;
            case 'changesInInv':
                return <ChangesInInventoriesSchedule data={scheduleData.changesInInventories} onUpdate={setScheduleData} isFinalized={effectiveIsFinalized} />;
            case 'employee':
                return <EmployeeBenefitsSchedule data={scheduleData.employeeBenefits} onUpdate={setScheduleData} isFinalized={effectiveIsFinalized} />;
            case 'finance':
                return <FinanceCostsSchedule data={scheduleData.financeCosts} onUpdate={(d) => setScheduleData(p => ({ ...p, financeCosts: d }))} isFinalized={effectiveIsFinalized} trialBalanceData={allData.trialBalanceData} />;
            case 'otherExpenses':
                return <OtherExpensesSchedule data={scheduleData.otherExpenses} onUpdate={(d) => setScheduleData(p => ({ ...p, otherExpenses: d }))} setAllData={setAllData} noteLineItems={scheduleData.noteLineItems} isFinalized={effectiveIsFinalized} trialBalanceData={allData.trialBalanceData} />;
            case 'tax':
                return <TaxExpenseSchedule data={scheduleData.taxExpense} onUpdate={setScheduleData} isFinalized={effectiveIsFinalized} />;
            case 'exceptional':
                return <ExceptionalItemsSchedule data={scheduleData.exceptionalItems} onUpdate={(d) => setScheduleData(p => ({ ...p, exceptionalItems: d }))} isFinalized={effectiveIsFinalized} />;

            // Other Disclosures
            case 'eps':
                return <EarningsPerShareSchedule data={scheduleData.eps} onUpdate={setScheduleData} isFinalized={effectiveIsFinalized} />;
            case 'relatedParties':
                return <RelatedPartySchedule data={scheduleData.relatedParties} onUpdate={setScheduleData} isFinalized={effectiveIsFinalized} />;
            case 'contingent':
                return <ContingentLiabilitiesSchedule data={scheduleData.contingentLiabilities} onUpdate={setScheduleData} isFinalized={effectiveIsFinalized} />;
            case 'commitments':
                return <CommitmentsSchedule data={scheduleData.commitments} onUpdate={(d) => setScheduleData(p => ({ ...p, commitments: d }))} isFinalized={effectiveIsFinalized} />;
            case 'eventsAfterBS':
                return <EventsAfterBalanceSheetNote data={scheduleData.eventsAfterBalanceSheet} onUpdate={setScheduleData} isFinalized={effectiveIsFinalized} />;
            case 'forex':
                return <ForeignExchangeSchedule data={scheduleData.foreignExchange} onUpdate={setScheduleData} isFinalized={effectiveIsFinalized} />;
            case 'auditor':
                return <AuditorPaymentsSchedule data={scheduleData.auditorPayments} onUpdate={(d) => setScheduleData(p => ({ ...p, auditorPayments: d }))} isFinalized={effectiveIsFinalized} />;
            case 'regulatory':
                return <AdditionalRegulatoryInfoNote data={scheduleData.additionalRegulatoryInfo} onUpdate={setScheduleData} isFinalized={effectiveIsFinalized} />;
            case 'ratioExplanations':
                return <RatioAnalysisExplanations allData={allData} onUpdate={setScheduleData} isFinalized={effectiveIsFinalized} />;
            case 'construction':
                return <ConstructionContractsSchedule data={scheduleData.constructionContracts} onUpdate={(d) => setScheduleData(p => ({ ...p, constructionContracts: d }))} isFinalized={effectiveIsFinalized} />;
            case 'govtGrants':
                return <GovernmentGrantsSchedule data={scheduleData.governmentGrants} onUpdate={(d) => setScheduleData(p => ({ ...p, governmentGrants: d }))} isFinalized={effectiveIsFinalized} />;
            case 'segmentReporting':
                return <SegmentReportingSchedule data={scheduleData.segmentReporting} onUpdate={(d) => setScheduleData(p => ({ ...p, segmentReporting: d }))} isFinalized={effectiveIsFinalized} />;
            case 'leases':
                return <LeasesSchedule data={scheduleData.leases} onUpdate={(d) => setScheduleData(p => ({ ...p, leases: d }))} isFinalized={effectiveIsFinalized} />;
            case 'discontinuingOps':
                return <DiscontinuingOperationsSchedule data={scheduleData.discontinuingOperations} onUpdate={(d) => setScheduleData(p => ({ ...p, discontinuingOperations: d }))} isFinalized={effectiveIsFinalized} />;
            case 'amalgamations':
                return <AmalgamationsSchedule data={scheduleData.amalgamations} onUpdate={(d) => setScheduleData(p => ({ ...p, amalgamations: d }))} isFinalized={effectiveIsFinalized} />;

            default:
                return <div>Select a schedule from the left panel to begin.</div>
        }
    };

    const allScheduleNav = [
        { type: 'link', id: 'entityInfo', name: 'Entity Info' },
        { type: 'link', id: 'accountingPolicies', name: 'Accounting Policies' },

        { type: 'header', name: 'Equity & Liabilities' },
        { type: 'link', id: 'shareCapital', name: 'Share Capital', noteId: 'companyShareCap' },
        { type: 'link', id: 'otherEquity', name: 'Other Equity', noteId: 'companyOtherEquity' },
        { type: 'link', id: 'partnersFunds', name: 'Partners\'/Owners\' Funds', noteId: 'partnersFunds' },
        { type: 'link', id: 'borrowings', name: 'Borrowings', noteId: 'borrowings' },
        { type: 'link', id: 'otherLongTermLiabilities', name: 'Other Long-Term Liabilities', noteId: 'otherLongTermLiabilities' },
        { type: 'link', id: 'provisions', name: 'Provisions (AS 29)', noteId: 'provisions' },
        { type: 'link', id: 'tradePayables', name: 'Trade Payables', noteId: 'tradePayables' },
        { type: 'link', id: 'otherCurrentLiabilities', name: 'Other Current Liabilities', noteId: 'otherCurrentLiabilities' },
        { type: 'link', id: 'msme', name: 'MSME Disclosures' },
        { type: 'link', id: 'deferredTax', name: 'Deferred Tax', noteId: 'deferredTax' },

        { type: 'header', name: 'Assets' },
        { type: 'link', id: 'ppe', name: 'Property, Plant & Equipment', noteId: 'ppe' },
        { type: 'link', id: 'cwip', name: 'Capital WIP', noteId: 'cwip' },
        { type: 'link', id: 'intangible', name: 'Intangible Assets', noteId: 'intangible' },
        { type: 'link', id: 'intangibleDev', name: 'Intangible Assets - Dev.' },
        { type: 'link', id: 'investments', name: 'Non-Current Investments', noteId: 'investments' },
        { type: 'link', id: 'longTermLoans', name: 'Long-Term Loans & Advances', noteId: 'longTermLoans' },
        { type: 'link', id: 'longTermReceivables', name: 'Long-Term Trade Receivables' },
        { type: 'link', id: 'otherNonCurrentAssets', name: 'Other Non-Current Assets', noteId: 'otherNonCurrentAssets' },
        { type: 'link', id: 'currentInvestments', name: 'Current Investments', noteId: 'currentInvestments' },
        { type: 'link', id: 'inventories', name: 'Inventories', noteId: 'inventories' },
        { type: 'link', id: 'tradeReceivables', name: 'Trade Receivables', noteId: 'tradeReceivables' },
        { type: 'link', id: 'arList', name: 'AR Input List (Adv/Deb)' },
        { type: 'link', id: 'apList', name: 'AP Input List (Adv/Cred)' },
        { type: 'link', id: 'shortTermLoans', name: 'Short-Term Loans & Advances', noteId: 'shortTermLoans' },
        { type: 'link', id: 'cash', name: 'Cash & Cash Equivalents', noteId: 'cash' },
        { type: 'link', id: 'otherCurrentAssets', name: 'Other Current Assets', noteId: 'otherCurrentAssets' },


        { type: 'header', name: 'Profit & Loss Statement' },
        { type: 'link', id: 'revenue', name: 'Revenue from Operations', noteId: 'revenue' },
        { type: 'link', id: 'otherIncome', name: 'Other Income', noteId: 'otherIncome' },
        { type: 'link', id: 'cogs', name: 'Cost of Materials', noteId: 'cogs' },
        { type: 'link', id: 'purchases', name: 'Purchases of Stock-in-Trade', noteId: 'purchases' },
        { type: 'link', id: 'changesInInv', name: 'Changes in Inventories', noteId: 'changesInInv' },
        { type: 'link', id: 'employee', name: 'Employee Benefits', noteId: 'employee' },
        { type: 'link', id: 'finance', name: 'Finance Costs', noteId: 'finance' },
        { type: 'link', id: 'otherExpenses', name: 'Other Expenses', noteId: 'otherExpenses' },
        { type: 'link', id: 'exceptional', name: 'Exceptional & Prior Items', noteId: 'exceptionalItems' },
        { type: 'link', id: 'tax', name: 'Tax Expense', noteId: 'tax' },

        { type: 'header', name: 'Other Disclosures' },
        { type: 'link', id: 'eps', name: 'Earnings Per Share', noteId: 'eps' },
        { type: 'link', id: 'relatedParties', name: 'Related Parties', noteId: 'relatedParties' },
        { type: 'link', id: 'contingent', name: 'Contingent Liabilities', noteId: 'contingent' },
        { type: 'link', id: 'commitments', name: 'Commitments', noteId: 'commitments' },
        { type: 'link', id: 'auditor', name: 'Auditor Payments', noteId: 'auditor' },
        { type: 'link', id: 'forex', name: 'Foreign Exchange', noteId: 'forex' },
        { type: 'link', id: 'regulatory', name: 'Additional Reg. Info', noteId: 'regulatory' },
        { type: 'link', id: 'ratioExplanations', name: 'Ratio Explanations' },
        { type: 'link', id: 'construction', name: 'Construction Contracts (AS 7)', noteId: 'construction' },
        { type: 'link', id: 'govtGrants', name: 'Government Grants (AS 12)', noteId: 'govtGrants' },
        { type: 'link', id: 'amalgamations', name: 'Amalgamations (AS 14)', noteId: 'amalgamations' },
        { type: 'link', id: 'segmentReporting', name: 'Segment Reporting (AS 17)', noteId: 'segmentReporting' },
        { type: 'link', id: 'leases', name: 'Leases (AS 19)', noteId: 'leases' },
        { type: 'link', id: 'discontinuingOps', name: 'Discontinuing Operations (AS 24)', noteId: 'discontinuingOps' },
        { type: 'link', id: 'eventsAfterBS', name: 'Events After B/S Date', noteId: 'eventsAfterBS' },
    ];

    const entityLevel = getEntityLevel(entityInfo.entityType, entityInfo);
    const applicableNotes = getApplicableNotes(scheduleData.noteSelections, entityInfo.entityType, entityLevel);
    const applicableNoteIds = new Set(applicableNotes.map(n => n.id));

    const scheduleNav = allScheduleNav.filter(item => {
        if (item.type === 'header') return true;

        // Special handling for Partners/Owners funds which combines two views
        if (item.id === 'partnersFunds') {
            return entityInfo.entityType === 'LLP' || entityInfo.entityType === 'Non-Corporate';
        }
        if (item.id === 'shareCapital' || item.id === 'otherEquity') {
            return entityInfo.entityType === 'Company';
        }

        // FIX: A schedule should be shown if it's not tied to a selectable note, OR if it is tied to one that is applicable.
        const noteId = (item as { noteId?: string }).noteId;
        if (noteId) {
            const note = scheduleData.noteSelections.find(n => n.id === noteId);
            return note ? note.isSelected : true;
        }
        return true;
    });


    // List of all schedules that support auto-population
    const AUTO_FILL_SUPPORTED_SCHEDULES = [
        'shareCapital', 'otherEquity', 'borrowings', 'tradePayables', 'otherLongTermLiabilities',
        'provisions', 'otherCurrentLiabilities', 'deferredTax',
        'ppe', 'cwip', 'intangible', 'investments', 'currentInvestments',
        'longTermLoans', 'shortTermLoans', 'otherNonCurrentAssets', 'otherCurrentAssets',
        'inventories', 'tradeReceivables', 'cash',
        'revenue', 'otherIncome', 'cogs', 'purchases', 'employee', 'finance', 'otherExpenses'
    ];

    const handleAutoPopulate = () => {
        if (!activeView) return;
        if (AUTO_FILL_SUPPORTED_SCHEDULES.includes(activeView)) {
            const result = populateScheduleFromTB(allData, activeView, entityInfo.decimalPlaces);
            if (result) {
                setScheduleData(prev => ({ ...prev, ...result }));
                alert('Auto-filled successfully from Trial Balance!');
            } else {
                alert('No data found for this schedule in Trial Balance.');
            }
        }
    };

    const handleAutoPopulateAll = () => {
        setAutoFillConfirmOpen(true);
    };

    const performAutoFillAll = () => {
        setAutoFillConfirmOpen(false);

        // Accumulate updates
        let updatedScheduleData = { ...scheduleData };
        let count = 0;

        AUTO_FILL_SUPPORTED_SCHEDULES.forEach(scheduleId => {
            const result = populateScheduleFromTB({ ...allData, scheduleData: updatedScheduleData }, scheduleId, entityInfo.decimalPlaces);
            if (result) {
                updatedScheduleData = { ...updatedScheduleData, ...result };
                count++;
            }
        });

        if (count > 0) {
            setScheduleData(updatedScheduleData);
            alert(`Successfully auto-filled ${count} schedules from Trial Balance.`);
        } else {
            alert('No data found to populate any schedule.');
        }
    };

    return (
        <div className="p-6 h-full flex flex-col space-y-4">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Schedules Entry</h1>
                    <p className="text-sm text-gray-400">Enter detailed data for notes and schedules.</p>
                </div>
                <div className="flex items-center space-x-2">
                    {!isFinalized && role !== 'VIEWER' && (
                        <>
                            <button onClick={handleAutoPopulateAll} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md mr-2">
                                Auto-Fill All
                            </button>
                            {activeView && AUTO_FILL_SUPPORTED_SCHEDULES.includes(activeView) && (
                                <button onClick={handleAutoPopulate} className="bg-brand-blue hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md mr-2">
                                    Auto-Fill Current
                                </button>
                            )}
                        </>
                    )}
                    {role !== 'VIEWER' && (
                        isFinalized ? (
                            <button onClick={handleEdit} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md">Edit Schedules</button>
                        ) : (
                            <button onClick={() => setConfirmModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md">Finalize Schedules</button>
                        )
                    )}
                </div>
            </header>

            {isFinalized && <FinalizedBanner />}

            <div className="flex-1 flex space-x-4 overflow-hidden">
                <aside className="w-64 bg-gray-800 p-2 rounded-lg border border-gray-700 overflow-y-auto">
                    <nav className="space-y-1">
                        {scheduleNav.map(item => {
                            if (item.type === 'header') {
                                return <h4 key={item.name} className="font-bold text-xs uppercase text-gray-500 mt-4 mb-1 px-3">{item.name}</h4>;
                            }
                            // Logic to select correct view for partners/owners funds
                            let viewId = item.id;
                            if (item.id === 'partnersFunds' && entityInfo.entityType === 'Non-Corporate') {
                                viewId = 'ownersFunds';
                            }
                            return <button key={item.id} onClick={() => setActiveView(viewId as ScheduleView)} className={`w-full text-left px-3 py-2 text-sm rounded-md ${activeView === viewId ? 'bg-brand-blue text-white' : 'hover:bg-gray-700'}`}>{item.name}</button>
                        })}
                    </nav>
                </aside>
                <main className="flex-1 bg-gray-800 p-6 rounded-lg border border-gray-700 overflow-y-auto">
                    {renderSchedule()}
                </main>
            </div>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleFinalize}
                title="Finalize Schedules?"
                message="Finalizing will lock the data entry for all schedules. You can still edit them later, but this marks a point of completion."
                confirmButtonText="Yes, Finalize"
                confirmButtonClass="bg-green-600 hover:bg-green-700"
            />
            <ConfirmationModal
                isOpen={isAutoFillConfirmOpen}
                onClose={() => setAutoFillConfirmOpen(false)}
                onConfirm={performAutoFillAll}
                title="Auto-Fill All Schedules?"
                message="This will overwrite data for ALL supported schedules with values from the Trial Balance. This action cannot be undone. Are you sure?"
                confirmButtonText="Yes, Overwrite"
                confirmButtonClass="bg-purple-600 hover:bg-purple-700"
            />
        </div>
    );
};