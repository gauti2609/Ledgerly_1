# AGENT INSTRUCTIONS - Financial Automation Application

## Project Overview
**Goal**: Create a Windows 10/11 executable (.exe) for automated drafting of Financial Statements as per Schedule III of the Companies Act and Indian Accounting Standards (AS, not Ind AS).

**Date Created**: October 15, 2025
**Repository**: SMBC-1

## Background
- Previous attempts using app.trysolid.com created a web app but failed to generate working .exe
- VBA code from Gemini exists but needs to be reimplemented as a standalone Windows application
- User has **NO coding experience** - application must be production-ready and fully functional

## Core Requirements

### 1. Input Requirements
- **Trial Balance Upload**: Excel/CSV format with columns:
  - Ledger Name
  - Opening Balance (CY)
  - Debit (CY)
  - Credit (CY)
  - Closing Balance (CY)
  - Closing Balance (PY)
  - Type (BS/PL)
  - Major Head
  - Minor Head
  - Grouping

- **Additional Input Sheets**:
  - Common Control Data (Entity name, CIN, FY dates, currency, units, etc.)
  - Share Capital details
  - PPE Schedule
  - CWIP Schedule
  - Intangible Assets Schedule
  - Investments
  - Employee Benefits (Gratuity, PF)
  - Tax Information (Current, Deferred)
  - Related Party Transactions
  - Contingent Liabilities & Commitments
  - Receivables Ledger (for aging)
  - Payables Ledger (for aging, MSME classification)

### 2. Master Data Management
**CRITICAL**: Hierarchical mapping must be enforced

- **Groupings** → mapped to → **Minor Heads** → mapped to → **Major Heads**
- User MUST select parent classifications when adding items
- System must validate mappings before accepting Trial Balance
- If unmapped items found in uploaded TB:
  - Generate downloadable list of missing items
  - Require user to create them (via upload or manual entry)
  - Re-validate before proceeding

### 3. Output Requirements
- **Balance Sheet** (as per Schedule III Division I)
- **Statement of Profit & Loss** (as per Schedule III Division I)
- **Cash Flow Statement** (Indirect Method)
- **Notes to Accounts** (all AS requirements + 2021 amendments)
- **Ratio Analysis** with variance explanations (>25%)
- **Aging Schedules** (Receivables, Payables with MSME segregation)

**Output Format**: Excel (.xlsx) with **live formulas** linking all numbers

### 4. Selection Sheet Functionality
- Auto-populate based on Trial Balance analysis
- User can override system recommendations (Yes/No dropdowns)
- Auto-numbering of notes based on selections
- Support for sub-notes (e.g., accounting policies as 1.a, 1.b, etc.)
- Dynamic updates when selections change

### 5. Notes to Accounts - Minimum Coverage

#### A. General Notes (Mandatory)
- A.1: Corporate Information
- A.2: Significant Accounting Policies (15 sub-policies)

#### B. Equity & Liabilities Notes
- B.1: Share Capital (reconciliation, promoter shareholding, 5% holders)
- B.2: Reserves & Surplus
- B.3: Borrowings (terms, security, defaults, quarterly bank reconciliation)
- B.4: Trade Payables (aging, MSME compliance)
- B.5-B.7: Other liabilities, provisions, employee benefits (AS 15 full disclosure)

#### C. Assets Notes
- C.1: PPE (movement schedule, title deeds not in company name, CWIP aging)
- C.2: CWIP (aging, overdue projects)
- C.3: Intangible Assets (movement, under-development aging)
- C.4: Investments (AS 13 classifications)
- C.5: Inventories (AS 2)
- C.6: Trade Receivables (aging, disputed/undisputed)
- C.7: Cash & Cash Equivalents
- C.8: Loans, advances, other assets

#### D. P&L Notes
- D.1-D.7: Revenue, expenses breakups
- D.8-D.9: Exceptional items, prior period items
- D.10: EPS (AS 20)
- D.11: Income Tax (AS 22 - full reconciliation)

#### E. AS-Specific Disclosures
- E.1: AS 3 - Cash Flow details
- E.2: AS 4 - Events after balance sheet date
- E.3: AS 18 - Related Party Disclosures (full matrix)
- E.4: AS 19 - Leases
- E.5: AS 29 - Contingencies & Commitments

#### F. Schedule III 2021 Amendments
- F.1: Borrowed funds utilization
- F.2: Title deeds not in company name (tabular format)
- F.3: Benami property proceedings
- F.4: Wilful defaulter status
- F.5: Struck-off companies transactions
- F.6: Crypto/virtual currency
- F.7: Undisclosed income surrendered
- F.8: Ratios with >25% variance explanations
- F.9: Aging schedules
- F.10: Unspent CSR

#### G. Other Statutory Disclosures
- G.1: Managerial remuneration (Section 197)
- G.2: MSME disclosures (principal + interest due)

### 6. Import/Export Functions
- **Import**:
  - Trial Balance (Excel/CSV)
  - Master lists (Major/Minor/Grouping heads)
  - Related Parties list
  - Ledger details (Receivables/Payables)

- **Export**:
  - Complete Financial Statements (with formulas)
  - Unmapped items list (for review/creation)
  - Master data lists
  - Individual schedules/notes

### 7. User Authentication & Licensing

**IMPORTANT**: Do NOT remove existing authentication/licensing features from previous code

- User authentication system
- License key validation
- Trial/Full version management
- Database to store user credentials and license info

### 8. Data Validation & Checks

**CRITICAL VALIDATIONS**:
1. Trial Balance must balance (Dr = Cr)
2. All items must be mapped to Major Head
3. All items must be mapped to Minor Head within Major Head
4. All items must be mapped to Grouping within Minor Head
5. Balance Sheet must tally (Assets = Liabilities + Equity)
6. P&L closing must flow to Reserves & Surplus
7. Cash Flow closing must match Balance Sheet cash
8. Date validations (FY end, invoice dates, etc.)
9. Required fields cannot be blank
10. Dropdown selections from master lists only

### 9. Accounting Standards Compliance

**AS Division I** (NOT Ind AS):
- AS 1: Disclosure of Accounting Policies
- AS 2: Valuation of Inventories
- AS 3: Cash Flow Statements
- AS 4: Contingencies and Events after BS Date
- AS 5: Prior Period Items, Extraordinary & Exceptional Items
- AS 7: Construction Contracts (if applicable)
- AS 9: Revenue Recognition
- AS 10: Property, Plant & Equipment
- AS 11: Foreign Exchange
- AS 12: Government Grants (if applicable)
- AS 13: Investments
- AS 15: Employee Benefits
- AS 16: Borrowing Costs
- AS 17: Segment Reporting (if threshold met)
- AS 18: Related Party Disclosures
- AS 19: Leases
- AS 20: Earnings Per Share
- AS 22: Taxes on Income
- AS 26: Intangible Assets
- AS 28: Impairment of Assets
- AS 29: Provisions, Contingent Liabilities, Contingent Assets

### 10. Trial Balance Nuances

**Critical Sign Conventions**:
1. **BS Items - Negative Balance** = Closing Credit = Show as POSITIVE in BS/Notes (Liabilities/Equity)
2. **BS Items - Positive Balance** = Closing Debit = Show as POSITIVE in BS/Notes (Assets)
3. **PL Items - Negative Balance** = Revenue/Income = Show as POSITIVE in PL/Notes (unless expense head)
4. **PL Items - Positive Balance** = Expense = Show as POSITIVE in PL/Notes

### 11. Formatting Requirements
- **Font**: Bookman Old Style, Size 11
- **Number Format**: Accounting format with brackets for negatives
- **Units**: User-configurable (Lakhs/Millions/Actual)
- **Currency**: INR
- **Zeros**: Show as "0" or blank (user choice)
- **Dates**: DD-MMM-YYYY format

### 12. Technical Stack Recommendations

**Primary Choice: Python with PyQt5/PySide6**
- GUI Framework: PyQt5 or PySide6 (for Windows native feel)
- Excel Operations: openpyxl or xlsxwriter
- Database: SQLite (embedded, no server required)
- PDF Generation: ReportLab (if needed)
- Packaging: PyInstaller (proven for Windows .exe creation)

**Alternative: Python with Tkinter**
- Lighter weight, built-in GUI
- Same Excel/DB libraries
- May have less polished UI

**Database Schema**:
- Users table (authentication)
- Licenses table
- MajorHeads table
- MinorHeads table (with MajorHeadID foreign key)
- Groupings table (with MinorHeadID foreign key)
- TrialBalance table
- CompanyInfo table
- All input sheets as separate tables

### 13. Application Architecture

```
FinancialAutomation/
├── main.py (Entry point with login)
├── config/
│   ├── __init__.py
│   ├── settings.py (app configuration)
│   └── database.py (DB initialization)
├── models/
│   ├── __init__.py
│   ├── user.py
│   ├── master_data.py (Major/Minor/Grouping)
│   ├── trial_balance.py
│   ├── input_sheets.py
│   └── company_info.py
├── controllers/
│   ├── __init__.py
│   ├── auth_controller.py
│   ├── import_controller.py
│   ├── validation_controller.py
│   ├── generation_controller.py
│   └── export_controller.py
├── views/
│   ├── __init__.py
│   ├── login_window.py
│   ├── main_window.py
│   ├── import_wizard.py
│   ├── master_data_manager.py
│   ├── input_forms.py
│   ├── selection_sheet.py
│   └── preview_window.py
├── services/
│   ├── __init__.py
│   ├── excel_service.py (read/write Excel)
│   ├── validation_service.py
│   ├── calculation_service.py
│   ├── notes_generator.py
│   └── ratio_calculator.py
├── utils/
│   ├── __init__.py
│   ├── helpers.py
│   ├── constants.py
│   └── validators.py
├── resources/
│   ├── icons/
│   ├── templates/ (Excel templates)
│   └── sample_data/
└── requirements.txt
```

### 14. Packaging for Windows .exe

**PyInstaller Configuration**:
```bash
pyinstaller --name="FinancialAutomation" \
            --windowed \
            --onefile \
            --icon=resources/icons/app.ico \
            --add-data "resources;resources" \
            --hidden-import=openpyxl \
            --hidden-import=sqlite3 \
            main.py
```

**Testing Requirements**:
1. Test on clean Windows 10 VM
2. Test on Windows 11 VM
3. Verify no Python installation required
4. Verify database creation on first run
5. Test with Sample TB.xlsx
6. Verify all functions work without errors

### 15. Critical Success Factors

1. **Data Integrity**: All mappings must be validated before generation
2. **Formula Linking**: Output Excel must have live formulas, not hard values
3. **Ease of Use**: User with no coding knowledge must be able to operate
4. **Error Handling**: Clear, actionable error messages
5. **Performance**: Handle Trial Balances with 1000+ line items
6. **Compliance**: 100% Schedule III and AS coverage
7. **Working .exe**: Must install and run on Windows 10/11 without issues

### 16. Development Phases

**Phase 1**: Core Application Setup
- Database schema
- Authentication system
- Main window framework
- Master data management

**Phase 2**: Data Import & Validation
- Trial Balance import
- Validation engine
- Unmapped items detection
- Input forms for all sheets

**Phase 3**: Financial Statement Generation
- Balance Sheet generator
- P&L generator
- Cash Flow generator (indirect method)
- Selection sheet with auto-numbering

**Phase 4**: Notes Generation
- All mandatory notes
- AS-specific disclosures
- Schedule III 2021 amendments
- Aging schedules

**Phase 5**: Ratio Analysis & Export
- Ratio calculations
- Variance analysis
- Export with formulas
- PDF generation (optional)

**Phase 6**: Testing & Packaging
- Unit tests
- Integration tests
- Sample TB testing
- PyInstaller packaging
- Windows VM testing

### 17. Known Pitfalls to Avoid

1. **Don't** use web frameworks (Flask/Django) - need true desktop app
2. **Don't** rely on external services - must work offline
3. **Don't** use platform-specific libraries that won't work in PyInstaller
4. **Don't** forget to bundle all resources in the .exe
5. **Don't** skip validation - bad data = bad financials
6. **Don't** hard-code file paths - use relative paths
7. **Don't** assume Excel is installed - use openpyxl for pure Python solution

### 18. Sample TB Testing Protocol

After building .exe:
1. Install on clean Windows machine
2. Create new company
3. Import Sample TB.xlsx
4. Verify all mappings
5. Generate financial statements
6. Verify Balance Sheet tallies
7. Verify P&L calculations
8. Verify Cash Flow balances
9. Check all notes are generated
10. Verify ratios are calculated
11. Export and verify formulas intact
12. Test all import/export functions

### 19. Documentation Requirements

Create:
1. **User Manual** (PDF) - step-by-step with screenshots
2. **Installation Guide** - how to install .exe
3. **Sample Data Guide** - how to prepare Trial Balance
4. **Troubleshooting Guide** - common issues and solutions
5. **Master Data Setup Guide** - how to configure Major/Minor/Groupings

### 20. Ongoing Maintenance Notes

- Keep this instruction file updated with any changes
- Document all deviations from original requirements
- Maintain change log in version control
- Test thoroughly before each release
- Keep database schema versioned

## Final Checklist Before Delivery

- [ ] .exe file created successfully
- [ ] Runs on Windows 10 without errors
- [ ] Runs on Windows 11 without errors
- [ ] Sample TB imports correctly
- [ ] All master data can be managed
- [ ] All input forms functional
- [ ] Balance Sheet generates correctly
- [ ] P&L generates correctly
- [ ] Cash Flow generates correctly
- [ ] All notes generate correctly
- [ ] Ratios calculate correctly
- [ ] Aging schedules correct (MSME segregation)
- [ ] Selection sheet auto-numbering works
- [ ] Export creates Excel with formulas
- [ ] Validation catches unmapped items
- [ ] Authentication system works
- [ ] License management works
- [ ] No crashes or unhandled exceptions
- [ ] User manual created
- [ ] Installation guide created

---

**REMEMBER**: User has NO coding experience. The application must be production-ready, stable, and fully functional when delivered. No placeholder code, no "TODO" comments in production, no unimplemented features.
