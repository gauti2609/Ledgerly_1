
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// The complete, updated masters structure
const UPDATED_MASTERS = {
    majorHeads: [
        { code: 'A', name: 'Assets' },
        { code: 'B', name: 'Equity and Liabilities' },
        { code: 'C', name: 'Profit & Loss Statement' },
    ],
    minorHeads: [
        { code: 'A.10', name: 'Property, Plant and Equipment', majorHeadCode: 'A' },
        { code: 'A.20', name: 'Capital Work-in-Progress', majorHeadCode: 'A' },
        { code: 'A.30', name: 'Intangible Assets', majorHeadCode: 'A' },
        { code: 'A.40', name: 'Intangible Assets under Development', majorHeadCode: 'A' },
        { code: 'A.50', name: 'Non-Current Investments', majorHeadCode: 'A' },
        { code: 'A.60', name: 'Long-Term Loans and Advances', majorHeadCode: 'A' },
        { code: 'A.70', name: 'Deferred Tax Assets', majorHeadCode: 'A' },
        { code: 'A.80', name: 'Other Non-Current Assets', majorHeadCode: 'A' },
        { code: 'A.90', name: 'Current Investments', majorHeadCode: 'A' },
        { code: 'A.100', name: 'Inventories', majorHeadCode: 'A' },
        { code: 'A.110', name: 'Trade Receivables', majorHeadCode: 'A' },
        { code: 'A.120', name: 'Cash and Cash Equivalents', majorHeadCode: 'A' },
        { code: 'A.130', name: 'Short-Term Loans and Advances', majorHeadCode: 'A' },
        { code: 'A.140', name: 'Other Current Assets', majorHeadCode: 'A' },
        { code: 'B.10', name: 'Share Capital', majorHeadCode: 'B' },
        { code: 'B.20', name: 'Reserves and Surplus', majorHeadCode: 'B' },
        { code: 'B.30', name: 'Long-Term Borrowings', majorHeadCode: 'B' },
        { code: 'B.40', name: 'Deferred Tax Liabilities', majorHeadCode: 'B' },
        { code: 'B.50', name: 'Other Long-Term Liabilities', majorHeadCode: 'B' },
        { code: 'B.60', name: 'Long-Term Provisions', majorHeadCode: 'B' },
        { code: 'B.70', name: 'Short-Term Borrowings', majorHeadCode: 'B' },
        { code: 'B.80', name: 'Trade Payables', majorHeadCode: 'B' },
        { code: 'B.90', name: 'Other Current Liabilities', majorHeadCode: 'B' },
        { code: 'B.100', name: 'Short-Term Provisions', majorHeadCode: 'B' },
        { code: 'C.10', name: 'Revenue from Operations', majorHeadCode: 'C' },
        { code: 'C.20', name: 'Other Income', majorHeadCode: 'C' },
        { code: 'C.30', name: 'Cost of Materials Consumed', majorHeadCode: 'C' },
        { code: 'C.40', name: 'Purchases of Stock-in-Trade', majorHeadCode: 'C' },
        { code: 'C.50', name: 'Changes in Inventories', majorHeadCode: 'C' },
        { code: 'C.60', name: 'Employee Benefits Expense', majorHeadCode: 'C' },
        { code: 'C.70', name: 'Finance Costs', majorHeadCode: 'C' },
        { code: 'C.80', name: 'Depreciation and Amortisation', majorHeadCode: 'C' },
        { code: 'C.90', name: 'Other Expenses', majorHeadCode: 'C' },
    ],
    groupings: [
        { code: 'A.10.01', name: 'Land', minorHeadCode: 'A.10' },
        { code: 'A.10.02', name: 'Buildings', minorHeadCode: 'A.10' },
        { code: 'A.10.03', name: 'Plant & Machinery', minorHeadCode: 'A.10' },
        { code: 'A.10.04', name: 'Furniture & Fixtures', minorHeadCode: 'A.10' },
        { code: 'A.10.05', name: 'Vehicles', minorHeadCode: 'A.10' },
        { code: 'A.10.06', name: 'Office Equipment', minorHeadCode: 'A.10' },
        { code: 'A.10.07', name: 'Computers / IT Equipment', minorHeadCode: 'A.10' },
        { code: 'A.10.08', name: 'Electrical Installations', minorHeadCode: 'A.10' },
        { code: 'A.10.09', name: 'Leasehold Improvements', minorHeadCode: 'A.10' },
        { code: 'A.10.10', name: 'Assets under Finance Lease', minorHeadCode: 'A.10' },
        { code: 'A.10.11', name: 'Other PPE', minorHeadCode: 'A.10' },
        { code: 'A.20.01', name: 'Projects in Progress – < 1 year', minorHeadCode: 'A.20' },
        { code: 'A.20.02', name: 'Projects in Progress – 1–2 years', minorHeadCode: 'A.20' },
        { code: 'A.20.03', name: 'Projects in Progress – 2–3 years', minorHeadCode: 'A.20' },
        { code: 'A.20.04', name: 'Projects in Progress – > 3 years', minorHeadCode: 'A.20' },
        { code: 'A.20.05', name: 'Projects Temporarily Suspended', minorHeadCode: 'A.20' },
        { code: 'A.30.01', name: 'Goodwill', minorHeadCode: 'A.30' },
        { code: 'A.30.02', name: 'Computer Software', minorHeadCode: 'A.30' },
        { code: 'A.30.03', name: 'Brands / Trademarks', minorHeadCode: 'A.30' },
        { code: 'A.30.04', name: 'Licences & Franchises', minorHeadCode: 'A.30' },
        { code: 'A.30.05', name: 'Patents & Copyrights', minorHeadCode: 'A.30' },
        { code: 'A.30.06', name: 'Technical Know-how', minorHeadCode: 'A.30' },
        { code: 'A.30.07', name: 'Other Intangible Assets', minorHeadCode: 'A.30' },
        { code: 'A.40.01', name: 'Projects in Progress – < 1 year', minorHeadCode: 'A.40' },
        { code: 'A.40.02', name: 'Projects in Progress – 1–2 years', minorHeadCode: 'A.40' },
        { code: 'A.40.03', name: 'Projects in Progress – 2–3 years', minorHeadCode: 'A.40' },
        { code: 'A.40.04', name: 'Projects in Progress – > 3 years', minorHeadCode: 'A.40' },
        { code: 'A.40.05', name: 'Projects Temporarily Suspended', minorHeadCode: 'A.40' },
        { code: 'A.50.01', name: 'Equity Investments – Subsidiaries', minorHeadCode: 'A.50' },
        { code: 'A.50.02', name: 'Equity Investments – Associates', minorHeadCode: 'A.50' },
        { code: 'A.50.03', name: 'Equity Investments – Joint Ventures', minorHeadCode: 'A.50' },
        { code: 'A.50.04', name: 'Equity Investments – Others', minorHeadCode: 'A.50' },
        { code: 'A.50.05', name: 'Preference Shares', minorHeadCode: 'A.50' },
        { code: 'A.50.06', name: 'Debentures / Bonds', minorHeadCode: 'A.50' },
        { code: 'A.50.07', name: 'Mutual Funds', minorHeadCode: 'A.50' },
        { code: 'A.50.08', name: 'Government Securities', minorHeadCode: 'A.50' },
        { code: 'A.50.09', name: 'Investment Property', minorHeadCode: 'A.50' },
        { code: 'A.50.10', name: 'Partnership Firms', minorHeadCode: 'A.50' },
        { code: 'A.50.11', name: 'Other Non-current Investments', minorHeadCode: 'A.50' },
        { code: 'A.60.01', name: 'Capital Advances', minorHeadCode: 'A.60' },
        { code: 'A.60.02', name: 'Loans to Related Parties', minorHeadCode: 'A.60' },
        { code: 'A.60.03', name: 'Security Deposits', minorHeadCode: 'A.60' },
        { code: 'A.60.04', name: 'Other Long-term Advances', minorHeadCode: 'A.60' },
        { code: 'A.60.05', name: 'Advance Income-tax (LT portion)', minorHeadCode: 'A.60' },
        { code: 'A.70.01', name: 'Deferred Tax Asset – Timing Differences', minorHeadCode: 'A.70' },
        { code: 'A.80.01', name: 'Long-term Trade Receivables', minorHeadCode: 'A.80' },
        { code: 'A.80.02', name: 'Unamortised Expenses', minorHeadCode: 'A.80' },
        { code: 'A.80.03', name: 'Other Non-current Assets', minorHeadCode: 'A.80' },
        { code: 'A.90.01', name: 'Equity Mutual Funds', minorHeadCode: 'A.90' },
        { code: 'A.90.02', name: 'Debt Mutual Funds', minorHeadCode: 'A.90' },
        { code: 'A.90.03', name: 'Equity Shares', minorHeadCode: 'A.90' },
        { code: 'A.90.04', name: 'Preference Shares', minorHeadCode: 'A.90' },
        { code: 'A.90.05', name: 'Debentures / Bonds', minorHeadCode: 'A.90' },
        { code: 'A.90.06', name: 'Government Securities', minorHeadCode: 'A.90' },
        { code: 'A.90.07', name: 'Other Current Investments', minorHeadCode: 'A.90' },
        { code: 'A.100.01', name: 'Raw Materials', minorHeadCode: 'A.100' },
        { code: 'A.100.02', name: 'Work-in-Progress', minorHeadCode: 'A.100' },
        { code: 'A.100.03', name: 'Finished Goods', minorHeadCode: 'A.100' },
        { code: 'A.100.04', name: 'Stock-in-Trade', minorHeadCode: 'A.100' },
        { code: 'A.100.05', name: 'Stores & Spares', minorHeadCode: 'A.100' },
        { code: 'A.100.06', name: 'Loose Tools', minorHeadCode: 'A.100' },
        { code: 'A.100.07', name: 'Goods-in-Transit', minorHeadCode: 'A.100' },
        { code: 'A.100.08', name: 'Other Inventories', minorHeadCode: 'A.100' },
        { code: 'A.110.01', name: 'Trade Receivables – Domestic', minorHeadCode: 'A.110' },
        { code: 'A.110.02', name: 'Trade Receivables – Export', minorHeadCode: 'A.110' },
        { code: 'A.110.03', name: 'Unbilled Revenue', minorHeadCode: 'A.110' },
        { code: 'A.110.04', name: 'Retention Receivables', minorHeadCode: 'A.110' },
        { code: 'A.120.01', name: 'Cash on Hand', minorHeadCode: 'A.120' },
        { code: 'A.120.02', name: 'Balances with Scheduled Banks', minorHeadCode: 'A.120' },
        { code: 'A.120.03', name: 'Balances with Non-scheduled Banks', minorHeadCode: 'A.120' },
        { code: 'A.120.04', name: 'Fixed Deposits (≤12 months)', minorHeadCode: 'A.120' },
        { code: 'A.120.05', name: 'Earmarked Bank Balances', minorHeadCode: 'A.120' },
        { code: 'A.120.06', name: 'Margin Money', minorHeadCode: 'A.120' },
        { code: 'A.130.01', name: 'Advances to Suppliers', minorHeadCode: 'A.130' },
        { code: 'A.130.02', name: 'Advances to Employees', minorHeadCode: 'A.130' },
        { code: 'A.130.03', name: 'Loans to Related Parties', minorHeadCode: 'A.130' },
        { code: 'A.130.04', name: 'Prepaid Expenses', minorHeadCode: 'A.130' },
        { code: 'A.130.05', name: 'Advance Income-tax', minorHeadCode: 'A.130' },
        { code: 'A.130.06', name: 'Other Short-term Advances', minorHeadCode: 'A.130' },
        { code: 'A.140.01', name: 'GST Input Credit Receivable', minorHeadCode: 'A.140' },
        { code: 'A.140.02', name: 'Interest Accrued Receivable', minorHeadCode: 'A.140' },
        { code: 'A.140.03', name: 'Foreign Exchange Receivable', minorHeadCode: 'A.140' },
        { code: 'A.140.04', name: 'Other Current Assets', minorHeadCode: 'A.140' },
        { code: 'A.140.05', name: 'Balance with Govt. authorities', minorHeadCode: 'A.140' },
        { code: 'B.10.01', name: 'Equity Share Capital', minorHeadCode: 'B.10' },
        { code: 'B.10.02', name: 'Preference Share Capital', minorHeadCode: 'B.10' },
        { code: 'B.20.01', name: 'Capital Reserve', minorHeadCode: 'B.20' },
        { code: 'B.20.02', name: 'Securities Premium', minorHeadCode: 'B.20' },
        { code: 'B.20.03', name: 'Capital Redemption Reserve', minorHeadCode: 'B.20' },
        { code: 'B.20.04', name: 'Debenture Redemption Reserve', minorHeadCode: 'B.20' },
        { code: 'B.20.05', name: 'Revaluation Reserve', minorHeadCode: 'B.20' },
        { code: 'B.20.06', name: 'Share Options Outstanding', minorHeadCode: 'B.20' },
        { code: 'B.20.07', name: 'Retained Earnings / Surplus', minorHeadCode: 'B.20' },
        { code: 'B.30.01', name: 'Term Loans – Banks', minorHeadCode: 'B.30' },
        { code: 'B.30.02', name: 'Term Loans – Financial Institutions', minorHeadCode: 'B.30' },
        { code: 'B.30.03', name: 'Debentures / Bonds', minorHeadCode: 'B.30' },
        { code: 'B.30.04', name: 'Deposits', minorHeadCode: 'B.30' },
        { code: 'B.30.05', name: 'Loans from Related Parties', minorHeadCode: 'B.30' },
        { code: 'B.30.06', name: 'Finance Lease Obligations', minorHeadCode: 'B.30' },
        { code: 'B.40.01', name: 'Deferred Tax Liability – Timing Differences', minorHeadCode: 'B.40' },
        { code: 'B.50.01', name: 'Long-term Trade Payables', minorHeadCode: 'B.50' },
        { code: 'B.50.02', name: 'Security Deposits Received', minorHeadCode: 'B.50' },
        { code: 'B.50.03', name: 'Other Long-term Liabilities', minorHeadCode: 'B.50' },
        { code: 'B.60.01', name: 'Gratuity Provision', minorHeadCode: 'B.60' },
        { code: 'B.60.02', name: 'Leave Encashment Provision', minorHeadCode: 'B.60' },
        { code: 'B.60.03', name: 'Other Long-term Provisions', minorHeadCode: 'B.60' },
        { code: 'B.70.01', name: 'Cash Credit / Overdraft', minorHeadCode: 'B.70' },
        { code: 'B.70.02', name: 'Short-term Loans – Banks', minorHeadCode: 'B.70' },
        { code: 'B.70.03', name: 'Short-term Loans – Others', minorHeadCode: 'B.70' },
        { code: 'B.70.04', name: 'Current Maturity of Long-term Debt', minorHeadCode: 'B.70' },
        { code: 'B.70.05', name: 'Loans from Related Parties', minorHeadCode: 'B.70' },
        { code: 'B.80.01', name: 'Trade Payables – MSME', minorHeadCode: 'B.80' },
        { code: 'B.80.02', name: 'Trade Payables – Others', minorHeadCode: 'B.80' },
        { code: 'B.90.01', name: 'Statutory Dues Payable', minorHeadCode: 'B.90' },
        { code: 'B.90.02', name: 'Interest Accrued but not Due', minorHeadCode: 'B.90' },
        { code: 'B.90.03', name: 'Interest Accrued and Due', minorHeadCode: 'B.90' },
        { code: 'B.90.04', name: 'Income Received in Advance', minorHeadCode: 'B.90' },
        { code: 'B.90.05', name: 'Unpaid Dividends', minorHeadCode: 'B.90' },
        { code: 'B.90.06', name: 'Other Payables', minorHeadCode: 'B.90' },
        { code: 'B.90.07', name: 'Salary Payable', minorHeadCode: 'B.90' },
        { code: 'B.90.08', name: 'Expenses Payable', minorHeadCode: 'B.90' },
        { code: 'B.100.01', name: 'Provision for Taxation', minorHeadCode: 'B.100' },
        { code: 'B.100.02', name: 'Provision for Employee Benefits', minorHeadCode: 'B.100' },
        { code: 'B.100.03', name: 'Other Short-term Provisions', minorHeadCode: 'B.100' },
        { code: 'C.10.01', name: 'Sale of Products', minorHeadCode: 'C.10' },
        { code: 'C.10.02', name: 'Sale of Services', minorHeadCode: 'C.10' },
        { code: 'C.10.03', name: 'Other Operating Revenue', minorHeadCode: 'C.10' },
        { code: 'C.20.01', name: 'Interest Income', minorHeadCode: 'C.20' },
        { code: 'C.20.02', name: 'Dividend Income', minorHeadCode: 'C.20' },
        { code: 'C.20.03', name: 'Gain on Sale of Investments', minorHeadCode: 'C.20' },
        { code: 'C.20.04', name: 'Foreign Exchange Gain', minorHeadCode: 'C.20' },
        { code: 'C.20.05', name: 'Other Non-operating Income', minorHeadCode: 'C.20' },
        { code: 'C.30.01', name: 'Opening Stock of Raw Materials', minorHeadCode: 'C.30' },
        { code: 'C.30.02', name: 'Purchases of Raw Materials', minorHeadCode: 'C.30' },
        { code: 'C.30.03', name: 'Closing Stock of Raw Materials', minorHeadCode: 'C.30' },
        { code: 'C.30.04', name: 'Consumption of stores and spare parts', minorHeadCode: 'C.30' },
        { code: 'C.40.01', name: 'Purchases – Trading Goods', minorHeadCode: 'C.40' },
        { code: 'C.50.01', name: 'Increase / Decrease in Inventories', minorHeadCode: 'C.50' },
        { code: 'C.60.01', name: 'Salaries & Wages', minorHeadCode: 'C.60' },
        { code: 'C.60.02', name: 'PF / ESI / Superannuation', minorHeadCode: 'C.60' },
        { code: 'C.60.03', name: 'Staff Welfare Expenses', minorHeadCode: 'C.60' },
        { code: 'C.60.04', name: 'Director\'s Salary', minorHeadCode: 'C.60' },
        { code: 'C.60.05', name: 'Employee Insurance', minorHeadCode: 'C.60' },
        { code: 'C.60.06', name: 'Insurance Expense - Director\'s', minorHeadCode: 'C.60' },
        { code: 'C.60.07', name: 'Bonus', minorHeadCode: 'C.60' },
        { code: 'C.60.08', name: 'Labour Charges', minorHeadCode: 'C.60' },
        { code: 'C.60.09', name: 'Stipend', minorHeadCode: 'C.60' },
        { code: 'C.70.01', name: 'Interest on Borrowings', minorHeadCode: 'C.70' },
        { code: 'C.80.01', name: 'Depreciation – PPE', minorHeadCode: 'C.80' },
        { code: 'C.80.02', name: 'Amortisation – Intangibles', minorHeadCode: 'C.80' },
        { code: 'C.90.01', name: 'Power & Fuel', minorHeadCode: 'C.90' },
        { code: 'C.90.02', name: 'Rent', minorHeadCode: 'C.90' },
        { code: 'C.90.03', name: 'Repair & Maintenance - Machinery', minorHeadCode: 'C.90' },
        { code: 'C.90.04', name: 'Repair & Maintenance - Buildings', minorHeadCode: 'C.90' },
        { code: 'C.90.05', name: 'Repair & Maintenance - Others', minorHeadCode: 'C.90' },
        { code: 'C.90.06', name: 'Legal & Professional Fees', minorHeadCode: 'C.90' },
        { code: 'C.90.07', name: 'Auditor Remuneration', minorHeadCode: 'C.90' },
        { code: 'C.90.08', name: 'Insurance', minorHeadCode: 'C.90' },
        { code: 'C.90.09', name: 'Rates & Taxes', minorHeadCode: 'C.90' },
        { code: 'C.90.10', name: 'CSR Expenditure', minorHeadCode: 'C.90' },
        { code: 'C.90.11', name: 'Miscellaneous Expenses', minorHeadCode: 'C.90' },
        { code: 'C.90.12', name: 'Bank Charges', minorHeadCode: 'C.90' },
        { code: 'C.90.13', name: 'Bad Debts & Provisions', minorHeadCode: 'C.90' },
        { code: 'C.90.14', name: 'Administrative & Office Expenses', minorHeadCode: 'C.90' },
        { code: 'C.90.15', name: 'Communication & IT Expenses', minorHeadCode: 'C.90' },
        { code: 'C.90.16', name: 'Legal, Professional & Consultancy Fees', minorHeadCode: 'C.90' },
        { code: 'C.90.17', name: 'Printing, Stationery & Courier', minorHeadCode: 'C.90' },
        { code: 'C.90.18', name: 'Travel, Conveyance & Vehicle Expenses', minorHeadCode: 'C.90' },
        { code: 'C.90.19', name: 'Repairs & Maintenance', minorHeadCode: 'C.90' },
        { code: 'C.90.20', name: 'Sales, Marketing & Promotion Expenses', minorHeadCode: 'C.90' },
        { code: 'C.90.21', name: 'Commission & Brokerage', minorHeadCode: 'C.90' },
        { code: 'C.90.22', name: 'Logistics, Freight & Transportation', minorHeadCode: 'C.90' },
        { code: 'C.90.23', name: 'Statutory Levies, Taxes & Penalties', minorHeadCode: 'C.90' },
        { code: 'C.90.24', name: 'Recruitment and Training Expenses', minorHeadCode: 'C.90' },
        { code: 'C.90.25', name: 'CSR & Donations', minorHeadCode: 'C.90' },
        { code: 'C.90.26', name: 'Losses, Write-offs & Exceptional Items', minorHeadCode: 'C.90' },
        { code: 'C.90.27', name: 'Foreign Exchange Loss', minorHeadCode: 'C.90' },
        { code: 'C.90.28', name: 'Online Selling Expenses', minorHeadCode: 'C.90' },
        { code: 'C.90.29', name: 'Lease Expenses - Land & Building', minorHeadCode: 'C.90' },
        { code: 'C.90.30', name: 'Lease Expenses - Plant and Machinery', minorHeadCode: 'C.90' },
        { code: 'C.90.31', name: 'Insurance Expenses - Employees', minorHeadCode: 'C.90' },
        { code: 'C.90.32', name: 'Insurance Expenses - Director\'s', minorHeadCode: 'C.90' },
        { code: 'C.90.33', name: 'Insurance Expense - Others', minorHeadCode: 'C.90' },
        { code: 'C.90.34', name: 'Freight Inward', minorHeadCode: 'C.90' },
        { code: 'C.90.35', name: 'Freight Outward', minorHeadCode: 'C.90' },
        { code: 'C.90.36', name: 'Manpower Outsourcing', minorHeadCode: 'C.90' },
        { code: 'C.90.37', name: 'Subscription Fees', minorHeadCode: 'C.90' },
        { code: 'C.90.38', name: 'Marine Insurance', minorHeadCode: 'C.90' },
        { code: 'C.90.39', name: 'Stock Insurance', minorHeadCode: 'C.90' },
    ],
};

async function forceUpdateMasters() {
    console.log('Fetching all financial entities...');
    const entities = await prisma.financialEntity.findMany();

    console.log(`Found ${entities.length} entities. Updating masters...`);

    let updatedCount = 0;

    for (const entity of entities) {
        let data: any;
        try {
            data = typeof entity.data === 'string' ? JSON.parse(entity.data) : (entity.data || {});
        } catch (e) {
            console.warn(`Skipping entity ${entity.name} (id: ${entity.id}) due to unparsable data field`);
            continue;
        }

        // Ensure data is an object
        if (typeof data !== 'object' || data === null) {
            console.warn(`Skipping entity ${entity.name} (id: ${entity.id}) due to invalid data field`);
            continue;
        }

        // Force update the masters
        data.masters = UPDATED_MASTERS;

        await prisma.financialEntity.update({
            where: { id: entity.id },
            data: { data: JSON.stringify(data) }
        });

        updatedCount++;
        console.log(`Updated masters for entity: ${entity.name}`);
    }

    console.log(`\nSuccessfully updated masters for ${updatedCount} entities.`);
}

forceUpdateMasters()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
