export type Page = 'mapping' | 'schedules' | 'notes' | 'reports' | 'caro' | 'tax-audit' | 'cash-flow' | 'tax-bridge' | 'consolidation' | 'approval-center';
export type EntityType = 'Company' | 'LLP' | 'Non-Corporate';

// --- API & High Level ---
export interface FinancialEntity {
    id: string;
    name: string;
    entityType: EntityType;
    createdAt: string;
    updatedAt: string;
    tenantId?: string;
    isSoftDeleted?: boolean;
    deletedAt?: string;
    decimalPlaces?: number;
    financialYear: string;
    companyCode: string;
}

export type ChangeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PendingChange {
    id: string;
    financialEntityId: string;
    userId: string;
    type: string;
    data: any;
    status: ChangeStatus;
    reviewedBy?: string;
    reviewedAt?: string;
    createdAt: string;
}

export type Role = 'PLATFORM_ADMIN' | 'TENANT_ADMIN' | 'ENTITY_ADMIN' | 'MANAGER' | 'EXECUTIVE' | 'ADMIN' | 'EDITOR' | 'VIEWER';

export type TenantType = 'CA_FIRM' | 'OTHER';

export interface Tenant {
    id: string;
    name: string;
    type: TenantType;
    isSuspended: boolean;
    createdAt: string;
}

export interface User {
    id: string;
    email: string;
    role: Role;
    tenantId?: string;
    entityId?: string;
}


// --- Trial Balance & Mapping ---

// Ledger Attributes for CARO/3CD/Disclosure triggers
export interface LedgerAttributes {
    isMSME?: boolean;              // MSME applicable (for Trade Payables)
    isRelatedParty?: boolean;      // Related Party flag (for Loans, Borrowings)
    securedUnsecured?: 'Secured' | 'Unsecured' | null;  // For Borrowings
    isDisputed?: boolean;          // Disputed (for Receivables/Payables ageing)
    isCashNonCash?: 'Cash' | 'Non-Cash' | null;  // For Cash Flow categorization
    ageingApplicable?: boolean;    // Whether ageing disclosure is required
    isForeignCurrency?: boolean;   // Foreign Currency transaction
    isExceptional?: boolean;       // Exceptional/Non-recurring item
}

export interface TrialBalanceItem {
    id: string;
    ledger: string;
    closingCy: number; // Closing Current Year
    closingPy: number; // Closing Previous Year
    isMapped: boolean;
    majorHeadCode: string | null;
    minorHeadCode: string | null;
    groupingCode: string | null;
    noteLineItemId: string | null; // For sub-grouping within a note
    suggestedMajorHeadCode?: string | null;
    suggestedMinorHeadCode?: string | null;
    suggestedGroupingCode?: string | null;
    suggestionConfidence?: number;
    suggestionReasoning?: string | null;
    attributes?: LedgerAttributes;  // Optional ledger attributes for CARO/3CD
}

export interface MajorHead {
    code: string;
    name: string;
}

export interface MinorHead {
    code: string;
    name: string;
    majorHeadCode: string;
}

export interface Grouping {
    code: string;
    name: string;
    minorHeadCode: string;
}

export interface Masters {
    majorHeads: MajorHead[];
    minorHeads: MinorHead[];
    groupings: Grouping[];
}

export interface MappingSuggestion {
    majorHeadCode: string;
    minorHeadCode: string;
    groupingCode: string;
    confidence: number;
    reasoning: string;
}

// --- Schedule Data ---

export type RoundingUnit = 'ones' | 'hundreds' | 'thousands' | 'lakhs' | 'millions' | 'crores';

export interface ManualInput {
    value: string;
    isSelected: boolean;
}

export interface EntityInfoData {
    companyName: string; // Generic name for entity
    cin: string; // Or other registration number
    incorporationDate: string;
    registeredOffice: string;
    currencySymbol: string;
    roundingUnit: RoundingUnit;
    entityType: EntityType;
    turnoverCy: string;
    turnoverPy: string;
    borrowingsCy: string;
    borrowingsPy: string;
    employeesCy: string;
    employeesPy: string;
    numberFormat: 'Indian' | 'European';
    decimalPlaces?: number;
}

export interface AccountingPolicy {
    id: string;
    title: string;
    policy: string | ManualInput;
}

export interface AccountingPoliciesData {
    basisOfPreparation: string | ManualInput;
    policies: AccountingPolicy[];
}

export interface ShareCapitalItem {
    id: string;
    particular: string;
    noOfSharesCy: string;
    amountCy: string;
    noOfSharesPy: string;
    amountPy: string;
}

export interface ShareReconciliationItem {
    id: string;
    particular: string;
    noOfShares: string;
    amount: string;
}

export interface Shareholder {
    id: string;
    name: string;
    noOfShares: string;
    percentage: string;
}

export interface PromoterShareholding {
    id: string;
    promoterName: string;
    noOfShares: string;
    percentageTotal: string;
    percentageChange: string;
}

export interface ShareCapitalData {
    authorized: ShareCapitalItem[];
    issued: ShareCapitalItem[];
    subscribed: ShareCapitalItem[];
    reconciliationCy: ShareReconciliationItem[];
    reconciliationPy: ShareReconciliationItem[];
    rightsPreferences: string | ManualInput;
    holdingCompanyShares: string | ManualInput;
    shareholders: Shareholder[];
    sharesReserved: string | ManualInput;
    fiveYearHistoryBonus: string | ManualInput;
    fiveYearHistoryNoCash: string | ManualInput;
    fiveYearHistoryBuyback: string | ManualInput;
    convertibleSecurities: string | ManualInput;
    callsUnpaid: string | ManualInput;
    forfeitedShares: string | ManualInput;
    promoterShareholding: PromoterShareholding[];
}

export interface OtherEquityItem {
    id: string;
    reserveName: string;
    opening: string;
    additions: string;
    deductions: string;
    closing: string; // Calculated
    openingPy: string;
    additionsPy: string;
    deductionsPy: string;
    groupingCode?: string;
}

export interface PartnerAccountRow {
    id: string;
    partnerName: string;
    opening: string;
    introduced: string;
    remuneration: string;
    interest: string;
    withdrawals: string;
    profitShare: string;
    closing: string; // Calculated
    agreedContribution?: string;
    profitSharePercentage?: string;
    openingPy: string;
    introducedPy: string;
    remunerationPy: string;
    interestPy: string;
    withdrawalsPy: string;
    profitSharePy: string;
}

export interface PartnersFundsData {
    capitalAccount: PartnerAccountRow[];
    currentAccount: PartnerAccountRow[];
}


export interface BorrowingItem {
    id: string;
    nature: string;
    classification: 'secured' | 'unsecured';
    amountCy: string;
    amountPy: string;
    repaymentTerms: string | ManualInput;
    defaultPeriod: string | ManualInput;
    defaultAmount: string;
    groupingCode?: string;
}

export interface BorrowingsData {
    longTerm: BorrowingItem[];
    shortTerm: BorrowingItem[];
    directorGuarantees: string | ManualInput;
    reissuableBonds: string | ManualInput;
    undrawnBorrowingFacilities: string | ManualInput;
}

export type TradePayablesAgeingCategory = 'msme' | 'others' | 'disputedMsme' | 'disputedOthers';

export interface TradePayablesAgeingRow {
    category: TradePayablesAgeingCategory;
    lessThan1Year: string;
    '1To2Years': string;
    '2To3Years': string;
    moreThan3Years: string;
}

export interface MsmeDisclosureData {
    principalAndInterestDue: string;
    interestPaid: string;
    interestDueAndPayable: string;
    interestAccruedAndUnpaid: string;
    furtherInterest: string;
}

export interface TradePayablesData {
    ageing: TradePayablesAgeingRow[];
    msmeDisclosures: MsmeDisclosureData;
}

export interface PpeAssetRow {
    id: string;
    assetClass: string;
    isUnderLease: boolean;
    // Current Year
    grossBlockOpening: string;
    grossBlockAdditions: string;
    grossBlockDisposals: string;
    grossBlockClosing: string; // Calculated
    depreciationOpening: string;
    depreciationForYear: string;
    depreciationOnDisposals: string;
    depreciationClosing: string; // Calculated
    impairmentLoss: string;
    impairmentReversal: string;
    netBlockClosing: string; // Calculated
    // Previous Year
    grossBlockOpeningPy: string;
    grossBlockAdditionsPy: string;
    grossBlockDisposalsPy: string;
    depreciationOpeningPy: string;
    depreciationForYearPy: string;
    depreciationOnDisposalsPy: string;
    impairmentLossPy: string;
    impairmentReversalPy: string;
}

export interface PpeScheduleData {
    assets: PpeAssetRow[];
    commitments: string | ManualInput;
    pledgedAssets: string | ManualInput;
    borrowingCostsCapitalized: string | ManualInput;

}

export interface IntangibleAssetsScheduleData {
    assets: PpeAssetRow[]; // Re-using PPE structure
    commitments: string | ManualInput;
    pledgedAssets: string | ManualInput;
    researchAndDevelopmentExpense: string | ManualInput;

}

export interface CwipAssetRow {
    // TBD if needed
}

export interface AssetAgeingRow {
    id: string;
    particular: string;
    lessThan1Year: string;
    '1To2Years': string;
    '2To3Years': string;
    moreThan3Years: string;
}


export interface CWIPRow {
    id: string;
    particular: string;
    opening: string;
    additions: string;
    capitalized: string;
    closing: string; // Calculated
}

export interface InventoryBalanceRow {
    id: string;
    item: string;
    amountCy: string;
    amountPy: string;
    groupingCode?: string;
}

export type TradeReceivablesAgeingCategory = 'undisputedGood' | 'undisputedDoubtful' | 'disputedGood' | 'disputedDoubtful';

export interface TradeReceivablesAgeingRow {
    category: TradeReceivablesAgeingCategory;
    lessThan6Months: string;
    '6MonthsTo1Year': string;
    '1To2Years': string;
    '2To3Years': string;
    moreThan3Years: string;
}

export interface TradeReceivablesData {
    securedGood: string;
    unsecuredGood: string;
    doubtful: string;
    provisionForDoubtful: string;
    ageing: TradeReceivablesAgeingRow[];
}

export interface CashComponent {
    id: string;
    particular: string;
    amountCy: string;
    amountPy: string;
    groupingCode?: string;
}
export interface CashAndCashEquivalentsData {
    cashOnHand: string;
    balancesWithBanks: CashComponent[];
    chequesDraftsOnHand: string;
    others: CashComponent[];
    repatriationRestrictions: string | ManualInput;
}

export interface GenericScheduleItem {
    id: string;
    particular: string;
    amountCy: string;
    amountPy: string;
    groupingCode?: string;
}

export interface InvestmentItem {
    id: string;
    particular: string;
    classification: 'quoted' | 'unquoted';
    marketValue: string;
    amountCy: string;
    amountPy: string;
    basisOfValuation: string;
    groupingCode?: string;
}

export interface InvestmentsScheduleData {
    items: InvestmentItem[];
    provisionForDiminution: string | ManualInput;
}

export interface LoanAdvanceItem {
    id: string;
    particular: string;
    security: 'secured' | 'unsecured';
    status: 'good' | 'doubtful';
    amountCy: string;
    amountPy: string;
    groupingCode?: string;
}

export interface LoansAndAdvancesScheduleData {
    items: LoanAdvanceItem[];
    allowanceForBadAndDoubtful: string | ManualInput;
}


export interface InventoryRow {
    id: string;
    name: string;
    amountCy: string;
    amountPy: string;
    groupingCode?: string;
}

export interface ChangesInInventoriesData {
    opening: InventoryRow[];
    closing: InventoryRow[];
}

export interface DefinedBenefitPlanReconciliation {
    opening: string;
    currentServiceCost: string;
    interestCost: string;
    actuarialLossGain: string;
    benefitsPaid: string;
    closing: string; // Calculated
    openingPy: string;
    currentServiceCostPy: string;
    interestCostPy: string;
    actuarialLossGainPy: string;
    benefitsPaidPy: string;
    groupingCode?: string;
}

export interface DefinedBenefitPlanAssetsReconciliation {
    opening: string;
    expectedReturn: string;
    actuarialLossGain: string;
    contributions: string;
    benefitsPaid: string;
    closing: string; // Calculated
    openingPy: string;
    expectedReturnPy: string;
    actuarialLossGainPy: string;
    contributionsPy: string;
    benefitsPaidPy: string;
}

export interface ActuarialAssumptions {
    discountRate: string;
    expectedReturnOnAssets: string;
    salaryIncreaseRate: string;
}

export interface DefinedBenefitPlanData {
    obligationReconciliation: DefinedBenefitPlanReconciliation;
    assetReconciliation: DefinedBenefitPlanAssetsReconciliation;
    actuarialAssumptions: ActuarialAssumptions;
}

export interface EmployeeBenefitsData {
    salariesAndWages: string;
    contributionToFunds: string;
    staffWelfare: string;
    definedBenefitPlans: DefinedBenefitPlanData;
}

export interface TaxExpenseData {
    currentTax: string;
    deferredTax: string;
}

export interface EpsData {
    pat: string;
    preferenceDividend: string;
    weightedAvgEquityShares: string;
    potentiallyDilutiveShares: string;
    profitAdjustmentForDilution: string;
}

export interface RelatedParty {
    id: string;
    name: string;
    relationship: string;
}

export interface RelatedPartyTransaction {
    id: string;
    relatedPartyId: string;
    nature: string;
    amountCy: string;
    amountPy: string;
}


export interface RelatedPartyBalance {
    id: string;
    relatedPartyId: string;
    balanceType: 'Receivable' | 'Payable';
    amountCy: string;
    amountPy: string;
}

export interface RelatedPartyData {
    parties: RelatedParty[];
    transactions: RelatedPartyTransaction[];
    balances: RelatedPartyBalance[];
}

export interface ContingentLiability {
    id: string;
    nature: string;
    amountCy: string;
    amountPy: string;
}

export interface EventsAfterBalanceSheetData {
    content: string | ManualInput;
}

export interface ForeignExchangeImportData {
    rawMaterials: string;
    components: string;
    capitalGoods: string;
}

export interface ForeignExchangeData {
    earnings: GenericScheduleItem[];
    expenditure: GenericScheduleItem[];
    imports: ForeignExchangeImportData;
}

export interface AuditorPaymentsData {
    asAuditor: string;
    forTaxation: string;
    forCompanyLaw: string;
    forManagement: string;
    forOther: string;
    forReimbursement: string;
}

export interface ExceptionalItem {
    id: string;
    type: 'exceptional' | 'extraordinary' | 'priorPeriod';
    particular: string;
    amountCy: string;
    amountPy: string;
}


export interface RatioExplanation {
    id: string;
    explanationCy: string | ManualInput;
    explanationPy: string;
}

export interface DeferredTaxRow {
    id: string;
    particular: string;
    openingBalance: string;
    pnlCharge: string;
    closingBalance: string; // Calculated
    groupingCode?: string;
}

export interface DeferredTaxData {
    assets: DeferredTaxRow[];
    liabilities: DeferredTaxRow[];
}



export interface CryptoData {
    profitOrLoss: string;
    amountHeld: string;
    advances: string;
}

export interface FundUtilisationIntermediary {
    id: string;
    name: string;
    date: string;
    amount: string;
}

export interface FundUtilisationUltimate {
    id: string;
    name: string;
    date: string;
    amount: string;
}

export interface FundUtilisationGuarantee {
    id: string;
    name: string;
    date: string;
    amount: string;
}


export interface FundUtilisationData {
    intermediaries: FundUtilisationIntermediary[];
    ultimateBeneficiaries: FundUtilisationUltimate[];
    guarantees: FundUtilisationGuarantee[];
}

export interface ImmovableProperty {
    id: string;
    lineItem: string;
    description: string;
    grossCarrying: string;
    holderName: string;
    isPromoter: string;
    heldSince: string;
    reason: string;
}

export interface LoanToPromoter {
    id: string;
    borrowerType: string;
    amount: string;
    percentage: string;
}

export interface BenamiProperty {
    id: string;
    details: string;
    amount: string;
    beneficiaries: string;
    inBooks: string;
    reason: string;
}

export interface StruckOffCompany {
    id: string;
    name: string;
    nature: string;
    balance: string;
    relationship: string;
}

export interface PpeRevaluationRow {
    id: string;
    assetClass: string;
    dateOfRevaluation: string;
    amount: string;
    valuerName: string;
    method: string;
}

export interface CsrProjectRow {
    id: string;
    projectName: string;
    location: string;
    amountOutlay: string;
    amountSpent: string;
    modeOfImplementation: string; // Direct or Agency
}

export interface CsrData {
    required: string;
    spent: string;
    shortfall: string;
    reason: string | ManualInput;
    details: CsrProjectRow[]; // Added
}

export interface AdditionalRegulatoryInfoData {
    immovableProperty: ImmovableProperty[];
    ppeRevaluation: PpeRevaluationRow[] | string | ManualInput; // Support both for migration
    loansToPromoters: LoanToPromoter[];
    benamiProperty: BenamiProperty[];
    currentAssetBorrowings: string | ManualInput;
    wilfulDefaulter: string | ManualInput;
    struckOffCompanies: StruckOffCompany[];
    csr: CsrData;
    crypto: CryptoData;
    registrationOfCharges: string | ManualInput;
    layerCompliance: string | ManualInput;
    schemeOfArrangements: string | ManualInput;
    fundUtilisation: FundUtilisationData;
    undisclosedIncome: string | ManualInput;
    applicability?: Record<string, boolean>; // Key: field name (e.g. 'immovableProperty', 'csr'), Value: true if applicable
}

export interface ProvisionReconciliationRow {
    id: string;
    provisionName: string;
    opening: string;
    additions: string;
    usedOrReversed: string;
    closing: string; // Calculated
    groupingCode?: string;
}

export interface ProvisionsData {
    longTerm: ProvisionReconciliationRow[];
    shortTerm: ProvisionReconciliationRow[];
}

export interface ConstructionContractItem {
    id: string;
    contractName: string;
    contractRevenue: string;
    costsIncurred: string;
    profitsRecognised: string;
    advancesReceived: string;
    retentions: string;
}

export interface ConstructionContractData {
    items: ConstructionContractItem[];
}

export interface GovernmentGrantItem {
    id: string;
    nature: string;
    amountRecognised: string;
    policy: string | ManualInput;
}

export interface GovernmentGrantsData {
    items: GovernmentGrantItem[];
}

export interface SegmentItem {
    id: string;
    segmentName: string;
    revenue: string;
    result: string;
    assets: string;
    liabilities: string;
}

export interface SegmentReportingData {
    items: SegmentItem[];
}

export interface MlpReconciliation {
    notLaterThan1Year: string | ManualInput;
    laterThan1YearAndNotLaterThan5Years: string | ManualInput;
    laterThan5Years: string | ManualInput;
}

export interface LeasesData {
    lesseeFinanceMlp: MlpReconciliation;
    lesseeOperatingMlp: MlpReconciliation;
    lesseeGeneralDescription: string | ManualInput;
    lessorFinanceMlp: MlpReconciliation;
    lessorOperatingMlp: MlpReconciliation;
    lessorGeneralDescription: string | ManualInput;
}

export interface DiscontinuingOperationAssetLiability {
    id: string;
    particular: string;
    carryingAmount: string; // Keep as string for now as it's inside a list
}

export interface DiscontinuingOperationData {
    description: string | ManualInput;
    initialDisclosureDate: string | ManualInput;
    expectedCompletionDate: string | ManualInput;
    assets: DiscontinuingOperationAssetLiability[];
    liabilities: DiscontinuingOperationAssetLiability[];
    revenue: string | ManualInput;
    expenses: string | ManualInput;
    preTaxProfitLoss: string; // Calculated
    incomeTaxExpense: string | ManualInput;
    netProfitLoss: string; // Calculated
}

export interface AmalgamationConsiderationItem {
    id: string;
    particular: string;
    amount: string;
}

export interface AmalgamationData {
    nature: 'merger' | 'purchase';
    amalgamatedCompany: string | ManualInput;
    effectiveDate: string | ManualInput;
    accountingMethod: string | ManualInput;
    consideration: AmalgamationConsiderationItem[];
    treatmentOfReserves: string | ManualInput;
    additionalInfo: string | ManualInput;
}

// NEW: For sub-grouping within notes
export interface NoteLineItem {
    id: string;
    noteId: string; // e.g., 'otherExpenses'
    name: string;   // e.g., 'Rent'
}

export interface ARAPEntry {
    id: string;
    partyName: string;
    amount: string;
}

export interface ARAPListData {
    entries: ARAPEntry[];
    tradeBalance: string;
    advances: string; // Advances from Customers (AR) or Advances to Vendors (AP)
}


// --- Main ScheduleData structure ---
export interface ScheduleData {
    isFinalized: boolean;
    entityInfo: EntityInfoData;
    accountingPolicies: AccountingPoliciesData;
    companyShareCapital: ShareCapitalData;
    companyOtherEquity: OtherEquityItem[];
    partnersFunds: PartnersFundsData;
    borrowings: BorrowingsData;
    otherLongTermLiabilities: GenericScheduleItem[];
    longTermProvisions: GenericScheduleItem[];
    otherCurrentLiabilities: GenericScheduleItem[];
    shortTermProvisions: GenericScheduleItem[];
    tradePayables: TradePayablesData;
    ppe: PpeScheduleData;
    cwip: CWIPRow[];
    cwipAgeing: AssetAgeingRow[];
    intangibleAssets: IntangibleAssetsScheduleData;
    intangibleAssetsUnderDevelopmentMovement: CWIPRow[];
    intangibleAssetsUnderDevelopmentAgeing: AssetAgeingRow[];
    investments: InvestmentsScheduleData; // Non-current
    currentInvestments: InvestmentsScheduleData;
    loansAndAdvances: LoansAndAdvancesScheduleData; // Long-term
    shortTermLoansAndAdvances: LoansAndAdvancesScheduleData;
    otherNonCurrentAssets: GenericScheduleItem[];
    otherCurrentAssets: GenericScheduleItem[];
    inventories: InventoryBalanceRow[];
    inventoriesValuationMode: string;
    tradeReceivables: TradeReceivablesData;
    longTermTradeReceivables: TradeReceivablesData;
    cashAndCashEquivalents: CashAndCashEquivalentsData;
    revenueFromOps: GenericScheduleItem[];
    otherIncome: GenericScheduleItem[];
    costOfMaterialsConsumed: ChangesInInventoriesData;
    purchases: GenericScheduleItem[];
    changesInInventories: ChangesInInventoriesData;
    employeeBenefits: EmployeeBenefitsData;
    financeCosts: GenericScheduleItem[];
    otherExpenses: GenericScheduleItem[];
    taxExpense: TaxExpenseData;
    exceptionalItems: ExceptionalItem[];
    eps: EpsData;
    relatedParties: RelatedPartyData;
    contingentLiabilities: ContingentLiability[];
    commitments: ContingentLiability[]; // Re-using structure
    eventsAfterBalanceSheet: EventsAfterBalanceSheetData;
    foreignExchange: ForeignExchangeData;
    auditorPayments: AuditorPaymentsData;
    additionalRegulatoryInfo: AdditionalRegulatoryInfoData;
    deferredTax: DeferredTaxData;
    provisions: ProvisionsData;
    constructionContracts: ConstructionContractData;
    governmentGrants: GovernmentGrantsData;
    segmentReporting: SegmentReportingData;
    leases: LeasesData;
    discontinuingOperations: DiscontinuingOperationData;
    amalgamations: AmalgamationData;
    ratioExplanations: Record<string, RatioExplanation>;
    noteSelections: { id: string, name: string, order: number, isSelected: boolean }[];
    noteLineItems: NoteLineItem[]; // NEW
    arList: ARAPListData; // NEW
    apList: ARAPListData; // NEW
}


// --- AllData Wrapper ---
export interface AllData {
    trialBalanceData: TrialBalanceItem[];
    masters: Masters;
    scheduleData: ScheduleData;
}


// --- Consolidation Types ---

export type ConsolidationMethod = 'full' | 'proportionate' | 'equity';
export type EliminationType = 'investment' | 'receivable-payable' | 'revenue-expense' | 'dividend' | 'other';

export interface SubsidiaryConfig {
    entityId: string;
    entityName: string;            // Cached for display
    ownershipPercentage: number;   // 0-100
    isFullyOwned: boolean;         // True if 100%
    consolidationMethod: ConsolidationMethod;
}

export interface InterCompanyElimination {
    id: string;
    description: string;
    eliminationType: EliminationType;
    debitGroupingCode: string;
    debitGroupingName: string;     // Cached for display
    creditGroupingCode: string;
    creditGroupingName: string;    // Cached for display
    amountCy: number;
    amountPy: number;
}

export interface ConsolidationGroup {
    id: string;
    name: string;                  // e.g., "ABC Group CFS"
    parentEntityId: string;
    parentEntityName: string;      // Cached for display
    subsidiaries: SubsidiaryConfig[];
    eliminations: InterCompanyElimination[];
    createdAt: string;
    updatedAt: string;
}

export interface ConsolidatedTrialBalanceItem {
    groupingCode: string;
    groupingName: string;
    minorHeadCode: string;
    minorHeadName: string;
    majorHeadCode: string;
    majorHeadName: string;
    closingCy: number;
    closingPy: number;
    eliminationCy: number;
    eliminationPy: number;
    consolidatedCy: number;
    consolidatedPy: number;
    entityBreakdown: { entityId: string; entityName: string; amountCy: number; amountPy: number }[];
}

export interface MinorityInterest {
    entityId: string;
    entityName: string;
    ownershipPercentage: number;
    minorityPct: number;
    equityCy: number;
    equityPy: number;
    profitCy: number;
    profitPy: number;
}

export interface ConsolidatedData {
    groupId: string;
    groupName: string;
    consolidatedTB: ConsolidatedTrialBalanceItem[];
    minorityInterests: MinorityInterest[];
    totalAssetsCy: number;
    totalAssetsPy: number;
    totalLiabilitiesCy: number;
    totalLiabilitiesPy: number;
    totalRevenueCy: number;
    totalRevenuePy: number;
    netProfitCy: number;
    netProfitPy: number;
}