Financials Automation (Phase I) – Detailed Build Prompt and Functional Blueprint

Purpose

* Build a Windows 10/11 desktop automation tool to draft financial statements as per Schedule III Division I (AS, not Ind AS) with maximum automation, minimal human intervention, multi-user access over local network, PostgreSQL as the central database, and a local licensing system hosted on an ASUSTOR AS6704T NAS.
* Phase I scope: Companies under Division I (Accounting Standards Rules, 2006). System must be architected to extend in Phase II to Division II (Ind AS), LLPs, Partnerships, Sole Proprietors, and Auditing functions.

Personas and Roles

* Admin: Manages users/roles, company profiles, licensing, environments, backups, and system-wide settings.
* Preparer: Imports TB, curates mappings, enters/supporting schedules (PPE, CWIP, etc.), reviews auto-generated statements/notes.
* Reviewer: Reviews/locks versions, provides sign-offs, edits narrative fields, runs exception reports.
* ReadOnly: Can view/export outputs but cannot change data.
* Auditor (Phase II): Read-only + audit modules, checklists, and evidence linkage.

Architecture and Stack (recommended for reliability and packaging)

* Phase I UIs: Web app (React/TypeScript or Blazor) served by ASP.NET Core on NAS/host for LAN access AND .NET 8 WPF desktop client for Windows 10/11. Both are deliverables for Phase I.
* API/Services: ASP.NET Core Web API (C#) hosting web UI, Licensing Service, and REST endpoints; both Web and WPF clients consume the same API. EF Core to PostgreSQL.
* Database: PostgreSQL 16 on ASUSTOR NAS (App Central or Docker). Centralized, multi-user; EF Core migrations for schema.
* Excel Export: ClosedXML for generating .xlsx with formulas; optional Office Interop for special cases (avoid if possible).
* Background tasks: Hangfire (optional) in API for async jobs (bulk import/export) if App API is used; batch DB writes and proper indexing to maintain speed.
* Packaging/Deployment: Docker Compose on NAS/host for web API/UI, Postgres and licensing service; plus MSI installer (WiX) for WPF client; per-company config via .env.
* AI assistance during build: Use GitHub Copilot + GPT-4.1/4o for code generation; use Claude 3.5 Sonnet for spec reasoning. Signal “Design Phase Start” at Milestone M0 sign-off (schema + env finalized), then switch to Sonnet 3.5 for detailed design reviews.

Environment and Configuration (.env samples)

* App client env (supports profiles; development uses localhost):

  * APP\_ENV=Development|Production
  * POSTGRES\_HOST=localhost (Development) / 192.168.1.100 or nas.local (Production)
  * POSTGRES\_PORT=5432
  * POSTGRES\_DB=financial\_automation
  * POSTGRES\_USER=fin\_app\_user
  * POSTGRES\_PASSWORD=…
  * POSTGRES\_SSLMODE=Disable
  * POSTGRES\_MIN\_CONN=2 (optional)
  * POSTGRES\_MAX\_CONN=10 (optional)
  * LICENSE\_SERVER\_URL=http://localhost:8088 (Development) / http://nas.local:8088 (Production)
  * LICENSE\_ORG\_ID=your\_org
  * FILESTORE\_NETWORK\_PATH=\\NAS\\FinancialsData
  * EXPORT\_TEMPLATE\_DIR=templates
  * EXPORT\_NUMBER\_FORMAT=Absolute|ScheduleIII
  * EXPORT\_SIII\_POLICY=AutoByTurnover|Manual
  * EXPORT\_SIII\_UNIT=Thousands|Lakhs|Crores (used when Manual)
  * TURNOVER\_THRESHOLD\_CR=100 (as per Schedule III para 4; adjustable)

* NAS (licensing service) .env:

  * LICENSE\_DB\_PATH=/data/licenses
  * LICENSE\_SEATS\_TOTAL=50
  * LICENSE\_OFFLINE\_GRACE\_DAYS=0
  * LICENSE\_ISSUER\_KEY=/keys/license\_pub.pem

High-Level Modules and Goals

1. Identity, AuthN/AuthZ, Licensing

* Local user store in Postgres with strong hashing (Argon2/BCrypt), role-based access control (RBAC): Admin, Preparer, Reviewer, ReadOnly, Auditor (Phase II).
* Admin UI: create users, assign roles, reset passwords, deactivate/reactivate, delete; per-company access scoping (user → company mappings) and feature toggles per role.
* Central license service on NAS:

  * License type: Named User only. Device binding: disabled. Offline grace: 0 days; Seat count: 50. Session heartbeats every N minutes; lockout when license expired; audit log of allocations/releases.
  * Endpoints: POST /license/checkout, POST /license/heartbeat, POST /license/release, GET /license/status.
  * Client startup flow: authenticate user → checkout license → proceed; handle offline grace window.

* Audit logging: who did what/when (user, machine, action, entity, before/after snapshot hash).

2. Company Master and Multi-Entity

* Company table with: legal name, CIN, address, FY start/end, currency, rounding policy, number format preference (Absolute/ScheduleIII), turnover, auditor\_info, signatories, related\_parties (name + relation\_type), logo/branding (optional), default accounting policy selections; sign-offs required: BS, P\&L, Cash Flow, PPE, Final page.
* Support multi-company and multiple financial years; per-company Control sheet settings; versions/snapshots per company-year; lock mechanism once “finalized”.

3. Master Lists and Mapping Governance (Major/Minor/Grouping)

* Master tables (application-level/global): major\_heads, minor\_heads, groupings with hierarchical links (Grouping→Minor→Major). Enforce referential integrity.
* Admin screens to CRUD masters; CSV/Excel bulk import/export (with validation). Auto-increment codes and uniqueness constraints.
* Mapping dictionary for ledger names (fuzzy matching rules, synonyms, regex). System auto-suggest mapping for new TB items, flag confidence, allow bulk-accept.
* Hard rule: when adding any Grouping, user must select its Minor and Major; when adding a Minor, user must select its Major. Prevent unmapped states.

4. Data Import and Validation

* Trial Balance import from Excel/CSV with supported schemas: columns for Ledger, Opening CY, Debit CY, Credit CY, Closing CY, Closing PY, Type (BS/PL), Major, Minor, Grouping (optional in file).
* Import pipeline: schema sniffing → header mapping wizard → preview → validations → write to DB. Validations include:

  * Sum check: Opening + Debits – Credits = Closing (per ledger)
  * Type/Sign rules per Schedule III nuances (PL negatives → income; BS negatives → credits)
  * Mapping check: detect unmapped/unknown major/minor/grouping; provide “Missing Masters Report” and downloadable CSV of required additions.
  * Duplicates/near-duplicates by fuzzy match; case/spacing normalization.

* Final Closing Entries: post manual journals within app and auto-map to TB; versioned and reversible.
* Re-import behavior: upsert by ledger+company+year; keep history of imports and ability to roll back.

5. Core Statement Generators

* Balance Sheet, Statement of Profit and Loss, Cash Flow Statement (Indirect) auto-built from TB + input schedules. CY vs PY throughout.
* Headers fed by company master (entity name, address, CIN, dates, currency, rounding unit, number format, negative format).
* Auto-number notes and cross-reference to line items; dynamic renumber upon selection changes.
* Selection Sheet concept: full checklist with “System Recommend”, “User Selection”, “Final” columns. System marks based on TB presence, master heads, and other triggers (e.g., Related Parties table non-empty). Supports sub-notes (e.g., 1.a, 1.b).

6. Notes and Disclosures (minimum Schedule III Division I + AS)

* Implement the following sets, auto-drafted with placeholders where manual narrative is needed. Where feasible, pull numbers from TB/schedules; narrative defaults are editable.
* A. General and Policies: A.1 Corporate info \& basis; A.2.1–A.2.16 policy set (AS 2, 3, 7, 9, 10, 11, 12, 13, 15, 16, 17, 19, 22, 26, 28, 29).
* B. Equity \& Liabilities: Share capital (movements; promoter/5% table); Other Equity movement; Borrowings (terms, security, covenants, default table); Trade payables (aging MSME/non-MSME; disputed/unbilled); Other liabilities/provisions (movements; AS 29); Employee benefit obligations (AS 15 – actuarial placeholders/	s).
* C. Assets: PPE movement; Title deeds not in co. name (2021 amendment table); CWIP aging + completion schedules; Intangibles \& under development aging + completion; Investments (NC/Current); Inventories; Trade receivables (aging, disputed/undisputed, allowance movement); Cash \& bank; Loans/advances/other assets; Balances/transactions with struck-off companies (2021 amendment).
* D. P\&L Notes: Revenue (AS 9); Other income; COGS/Purchases/Changes in inventories; Employee benefits expense (P\&L view); Finance costs; Depreciation \& amortization; Other expenses; Exceptional/Extraordinary; Prior period items; EPS (AS 20); Income taxes (AS 22) with reconciliation.
* E. Cross-cutting AS: Cash flow disclosures; Events after balance sheet (AS 4); Related parties (AS 18); Leases (AS 19); Contingent liabilities \& commitments (AS 29).
* F. 2021 Amendments: Intermediaries/ultimate beneficiaries; Compliance with layers; Benami proceedings; Wilful defaulter; Struck-off companies; Crypto assets; Undisclosed income; Ratios (current, debt-equity, DSCR, ROE, inventory/trade receivable/payable turnover, net capital turnover, net profit, ROCE, ROI) with >25% variance explanations; Bank return vs books reconciliation; Charges not registered beyond period; NBFC registration if applicable; CSR unspent.
* G. Other: Managerial remuneration (Sec 197); MSME disclosures.

7. Supporting Input Schedules (Data Entry UIs)

* Share Capital (authorized/issued/reconciliation; promoter/5% shareholders).
* PPE movement; CWIP with projects, status, and expected completion; Intangibles movement and under development; Investments (NC/Current) with quoted/unquoted, cost/market values; Employee Benefits (P\&L and BS rollforward; actuarial inputs); Taxes (components and reconciliation); Related Parties (names, relationships, txn types, amounts, balances); Contingent liabilities \& commitments; Receivables ledger (invoices, settlements, disputed flag; aging buckets); Payables ledger (invoices, settlements, MSME/Other; disputed; aging buckets).

8. Analytics and Ratios

* Ratio sheet calculating required ratios with CY/PY and variance; flag absolute variance ≥25% and collate into a “Ratios Variance Note”.
* MSME analysis and aging summaries; AR/AP aging per Schedule III buckets (undisputed/disputed; MSME vs others).

9. Reporting/Export

* Excel export of BS, P\&L, Cash Flow, Notes, Ratio, Aging with live formulas and consistent formatting (Bookman Old Style 11; accounting format; negatives in brackets; zero display option). Honor Control sheet settings: Number Format = Absolute or Schedule III para 4; when Schedule III is selected, auto-pick units based on turnover bands per para 4 (Thousands/Lakhs/Crores) unless user overrides to Absolute or Manual unit selection.
* Export: Single workbook with tabs only. Include watermark “Draft” until locked.
* Import/Export masters as CSV/Excel; export “Missing Masters Report” and “Unmapped Ledgers” lists.

10. Workflow and Versioning

* Draft → Review → Finalize workflow; per-stage locks; maintain version history and ability to snapshot/duplicate a version.
* Change log per entity-year; diff view between versions for statements and notes.

11. Admin Console

* User/role management; company setup; license dashboard (seats used/free, active sessions); environment variables; backup/restore; data retention settings.

12. Security, Audit, and Compliance

* RBAC enforced on API and client; least privilege defaults. All sensitive config stored outside source control.
* Transport security: LAN HTTP is acceptable for NAS licensing inside trusted network; optionally enable TLS (NAS reverse proxy).
* Audit trail persisted with tamper-evident hashes. Optional daily export of activity logs to NAS share.

13. NAS and Network Deployment

* ASUSTOR NAS (ADM):

  * Prefer App Central PostgreSQL (v16) or Docker (Container Manager) with compose; confirm ADM compatibility.
  * licensing-service: ASP.NET Core container on port 8088 with volume /data/licenses
  * optional: pgAdmin for DB admin (internal only)

* Shared filestore on NAS (SMB) for templates and exports: \\NAS\\FinancialsData with per-company subfolders and ACLs.
* Remote access: optional via ASUSTOR EZ-Connect if NAS is mounted; apply security hardening if exposed.

14. Performance and Concurrency

* Target 20 concurrent users across ~300 entities; optimistic concurrency on TB and masters; row-versioning. Bulk imports handled transactionally with progress UI.
* Indexes on company\_id, year, ledger, major/minor/grouping codes.

15. Testing and Acceptance

* Seed with provided Sample TB.xlsx; automated import tests; unit tests for mapping engine; golden-file tests for Excel exports (hash compare) for both Absolute and Schedule III rounding modes; Schedule III para 4 ruleset test suite; performance checks to ensure responsive UI and fast exports.
* UAT checklist mapped to the Function Audit Report items; include Schedule III 2021 disclosure presence tests.

16. Phase II Readiness (Design now; build later)

* Audit module:

  * Risk assessment templates; compliance checklists (Companies Act, Income Tax TDS, 269SS/269ST, GST, etc.); evidence attachments; sampling worksheets; audit observations → management responses; audit trail and sign-offs.

* Entity frameworks for Division II (Ind AS) and non-corporates (LLP, Partnership, Proprietor): keep statement/notes generator pluggable by “Reporting Framework”.
* Consolidation (optional): parent-subsidiary mapping; intercompany eliminations.

Database Model (high-level)

* users(id, name, email, password\_hash, is\_active, created\_at)
* roles(id, name) ; user\_roles(user\_id, role\_id)
* companies(id, name, cin, address, fy\_start, fy\_end, currency, turnover, rounding\_policy, number\_format\_pref, negative\_format, auditor\_info\_json, signatories\_json)
* company\_related\_parties(id, company\_id, name, relation\_type)
* licenses(id, org\_id, type, seats\_total, seats\_in\_use, expires\_at, settings\_json)
* license\_sessions(id, user\_id, device\_fingerprint, issued\_at, last\_heartbeat\_at, status)
* major\_heads(id, code, name)
* minor\_heads(id, code, name, major\_id)
* groupings(id, code, name, minor\_id, major\_id)
* ledger\_dictionary(id, company\_id, pattern, suggested\_grouping\_id, confidence)
* trial\_balances(id, company\_id, year, import\_batch\_id, ledger, opening\_cy, debit\_cy, credit\_cy, closing\_cy, closing\_py, type\_bs\_pl, major\_id, minor\_id, grouping\_id)
* imports(id, company\_id, year, source, user\_id, started\_at, finished\_at, status, report\_path)
* statements(id, company\_id, year, version, type, payload\_json)
* closing\_entries(id, company\_id, year, version, entry\_no, date, account, debit, credit, narration, posted\_by, posted\_at)
* notes(id, company\_id, year, version, code, title, payload\_json)
* schedules (ppe, cwip, intangible, investments, emp\_benefits, taxes, related\_parties, contingencies, receivables, payables, etc.) tables normalized with CY/PY fields
* selections(id, company\_id, year, code, system\_rec, user\_sel, final\_sel, auto\_number)
* ratio\_results(id, company\_id, year, name, cy, py, variance)
* audit\_logs(id, user\_id, action, entity, entity\_id, at, meta\_json)

Key Automation Rules (minimal human intervention)

* Auto-mapping engine attempts to map TB ledgers to Grouping via fuzzy logic and synonyms; confidence > threshold → auto-accept; else flag for review.
* System Recommendation for notes based on presence of mapped Major/Minor/Grouping, schedule data (e.g., related party entries), and regulatory triggers (e.g., MSME data present).
* Auto-generate and renumber notes; inject cross-references to BS/P\&L lines; maintain linkage when user adds custom notes.
* Apply rounding and number formatting from Control sheet per company-year: Absolute or Schedule III para 4; auto-unit by turnover unless Manual override; zeros display toggle; negative in brackets.
* Auto-generate “Missing Masters” and “Unmapped Ledgers” reports; provide one-click CSV to import new masters.

UI Flows

* Home/Dashboard: company/year selector, task checklist (Import TB → Review Mappings → Enter Schedules → Generate → Review → Finalize → Export).
* Mapping Workbench: filter (All/Mapped/Unmapped/ReviewRequired), side-by-side Unmapped Ledgers, Suggested Mapping with confidence, and Master browser; bulk accept and CSV export of unmapped.
* Schedules: tabbed forms with validation, totals, and helpful tooltips (AS references).
* Statements \& Notes: live preview; drilldowns to source; warnings/flags panel for missing disclosures.
* Admin: users/roles; license status and sessions; masters import/export; backups.

Excel Export Requirements

* One .xlsx with sheets: Control (company-year settings; Number Format, Schedule III policy), Common Data, TB, Selection, Balance Sheet, P\&L, Cash Flow, Notes (multi-note layout), Ratios, Aging, Schedules (PPE, CWIP, Intangibles, Investments, EB, Taxes, RPT, Contingencies, AR, AP).
* Preserve formulas; consistent fonts and number formats; auto-width; header blocks per Schedule III; page setup sensible for print.

Schedule III and AS Coverage Check (must include)

* Incorporate disclosures per Schedule III.docx (2021 amendments notably: ratios, title deeds, benami, struck-off, intermediaries/ultimate beneficiaries, CSR, bank returns reconciliation, charges not registered, layers compliance, crypto, wilful defaulter, undisclosed income, NBFC registration).

Non-Functional Requirements

* Reliability: deterministic exports; repeatable builds; idempotent imports.
* Performance: import 50k TB rows < 30s on mid-range PC; Excel export < 30s typical.
* Usability: keyboard-first data entry; clear validation messages; context help linking to AS references.
* Maintainability: clean layering; EF Core migrations; diagnostics logs.

Deliverables (Phase I)

* Web app (ASP.NET Core + React/Blazor) container + compose; deployment guide for NAS/host.
* WPF client MSI + configuration guide.
* Licensing Service Docker image + compose file for NAS.
* PostgreSQL schema and seed scripts (masters, policy templates, ratio formulas).
* PostgreSQL 16 installation and configuration guide (Production setup).
* User manual and UAT checklist; Sample TB import walkthrough; Excel export samples.

Model and Language Recommendation

* Primary: C#/.NET 8 (ASP.NET Core Web API + React/Blazor + WPF client) with EF Core for PostgreSQL.
* AI assistance:
  * GitHub Copilot + GPT-4.1 for routine coding, unit tests, refactors.
  * GPT-4o for complex data transformations, performance tuning, Excel formula generation.
  * Claude 3.5 Sonnet for specification refinement and architecture/design reviews at and after Design Phase start (post-M0) and prior to major refactors.
  * GPT-4.1 for migration scripts and integration test authoring; Claude for validating disclosure coverage checklists.
  * Log chosen model per task in progress document to avoid mixing in a single PR.
* Both UIs share one API and business layer; WPF used where native Excel interop or offline is needed.

Additional Inputs from developer (harmonized; duplicates removed; conflicts resolved above)

* Licensing: Named-user, 50 Seat count, no offline grace policy, Device binding not required
* Users: Expected max concurrent users 20 and entities 300. SSO/AD integration may be desired in later phase, not currently
* Number formatting preferences: INR Absolute or Schedule III (Thousands/Lakhs/Crores) per Clause 4 of Schedule III; no Hundreds.
* NAS details: Fixed hostname, ports, and SMB share path/permissions? TLS requirement on LAN?
* M0: Provision NAS services (Postgres + Licensing), schema migrations, Admin login, company setup.
* M1: Masters and mapping workbench with import/export; TB import validations; “Missing Masters” report.
* M2: Statement generators (BS, P\&L, Cash Flow) and Selection sheet; initial Notes set (A, B.1–B.7, C.1–C.7, D.1–D.6, D.10–D.11, E.3, E.5); Excel export v1.
* M3: 2021 amendments, CWIP/Intangibles completion schedules, ratio set + variance note, AR/AP aging and MSME notes; Excel export v2.
* M4: Hardening, MSI packaging, UAT with Sample TB; docs and handover.
* User shall provide excel/csv TB with following parameters (data may be in all the fields or only in the closing fields depending upon data provided by the client):

  - Ledger Name

  - Opening Balance (CY)

  - Debit (CY)

  - Credit (CY)

  - Closing Balance (CY)

  - Opening Balance (PY)

  - Debit (PY)

  - Credit (PY)

  - Closing Balance (PY)

  - Type (BS/PL)

  - Major Head

  - Minor Head

  - Grouping

* Additional Input Sheets for user if not already specified above

  - Common Control Data (Entity name, CIN, FY dates, currency, units, etc.)

  - Share Capital details

  - PPE Schedule

  - CWIP Schedule

  - Intangible Assets Schedule

  - Investments

  - Employee Benefits (Gratuity, PF)

  - Tax Information (Current, Deferred)

  - Related Party Transactions

  - Contingent Liabilities \& Commitments

  - Receivables Ledger (for aging, disputed/undisputed, good/provision)

  - Payables Ledger (for aging, MSME classification, disputed/undisputed)

* Phase 1 deliverables

  - Balance Sheet (as per Schedule III Division I)

  - Statement of Profit \& Loss (as per Schedule III Division I)

  - Cash Flow Statement (Indirect Method)

  - Notes to Accounts\*(all AS requirements + 2021 amendments)

  - Ratio Analysis with variance explanations (>25%)

  - Aging Schedules (Receivables, Payables with MSME segregation)

* Selection Sheet Functionality (if not provided above)

  - Auto-populate based on Trial Balance analysis

  - User can override system recommendations (Yes/No dropdowns)

  - Auto-numbering of notes based on selections

  - Support for sub-notes (e.g., accounting policies as 1.a, 1.b, etc.)

  - Dynamic updates when selections change

* Notes to Accounts - Minimum Coverage

 	1. General Notes (Mandatory)

 		- 1.1: Corporate Information

 		- 1.2: Significant Accounting Policies (15 sub-policies)



 	2. Equity \& Liabilities Notes

 		- 2.1: Share Capital (reconciliation, promoter shareholding, 5% holders)

 		- 2.2: Reserves \& Surplus

 		- 2.3: Borrowings (terms, security, defaults, quarterly bank reconciliation)

 		- 2.4: Trade Payables (aging, MSME compliance)

 		- 2.5-B.7: Other liabilities, provisions, employee benefits (AS 15 full disclosure)



 	3. Assets Notes

 		- 3.1: PPE (movement schedule, title deeds not in company name, CWIP aging)

 		- 3.2: CWIP (aging, overdue projects)

 		- 3.3: Intangible Assets (movement, under-development aging)

 		- 3.4: Investments (AS 13 classifications)

 		- 3.5: Inventories (AS 2)

 		- 3.6: Trade Receivables (aging, disputed/undisputed)

 		- 3.7: Cash \& Cash Equivalents

 		- 3.8: Loans, advances, other assets



 	4. P\&L Notes

 		- 4.1-4.7: Revenue, expenses breakups

 		- 4.8-4.9: Exceptional items, prior period items

 		- 4.10: EPS (AS 20)

 		- 4.11: Income Tax (AS 22 - full reconciliation)



 	5. AS-Specific Disclosures

 		- 5.1: AS 3 - Cash Flow details

 		- 5.2: AS 4 - Events after balance sheet date

 		- 5.3: AS 18 - Related Party Disclosures (full matrix)

 		- 5.4: AS 19 - Leases

 		- 5.5: AS 29 - Contingencies \& Commitments



 	6. Schedule III 2021 Amendments

 		- 6.1: Borrowed funds utilization

 		- 6.2: Title deeds not in company name (tabular format)

 		- 6.3: Benami property proceedings

 		- 6.4: Wilful defaulter status

 		- 6.5: Struck-off companies transactions

 		- 6.6: Crypto/virtual currency

 		- 6.7: Undisclosed income surrendered

 		- 6.8: Ratios with >25% variance explanations

 		- 6.9: Aging schedules

 		- 6.10: Unspent CSR



 	7. Other Statutory Disclosures

 		- 7.1: Managerial remuneration (Section 197)

 		- 7.2: MSME disclosures (principal + interest due)



Import/Export Functions

\- Import:

  - Trial Balance (Excel/CSV)

  - Master lists (Major/Minor/Grouping heads)

  - Related Parties list

  - Ledger details (Receivables/Payables)



\- Export:

  - Complete Financial Statements (with formulas)

  - Unmapped items list (for review/creation)

  - Master data lists

  - Individual schedules/notes



CRITICAL VALIDATIONS:

1\. Trial Balance must balance (Dr = Cr)

2\. All items must be mapped to Major Head

3\. All items must be mapped to Minor Head within Major Head

4\. All items must be mapped to Grouping within Minor Head

5\. Balance Sheet must tally (Assets = Liabilities + Equity)

6\. P\&L closing must flow to Reserves \& Surplus

7\. Cash Flow closing must match Balance Sheet cash

8\. Date validations (FY end, invoice dates, etc.)

9\. Required fields cannot be blank

10\. Dropdown selections from master lists only



Accounting Standards Compliance

AS Division I (NOT Ind AS):

\- AS 1: Disclosure of Accounting Policies

\- AS 2: Valuation of Inventories

\- AS 3: Cash Flow Statements

\- AS 4: Contingencies and Events after BS Date

\- AS 5: Prior Period Items, Extraordinary \& Exceptional Items

\- AS 7: Construction Contracts (if applicable)

\- AS 9: Revenue Recognition

\- AS 10: Property, Plant \& Equipment

\- AS 11: Foreign Exchange

\- AS 12: Government Grants (if applicable)

\- AS 13: Investments

\- AS 15: Employee Benefits

\- AS 16: Borrowing Costs

\- AS 17: Segment Reporting (if threshold met)

\- AS 18: Related Party Disclosures

\- AS 19: Leases

\- AS 20: Earnings Per Share

\- AS 22: Taxes on Income

\- AS 26: Intangible Assets

\- AS 28: Impairment of Assets

\- AS 29: Provisions, Contingent Liabilities, Contingent Assets



Critical Sign Conventions:

1\. BS Items - Negative Balance = Closing Credit = Show as POSITIVE in BS/Notes (Liabilities/Equity)

2\. BS Items - Positive Balance = Closing Debit = Show as POSITIVE in BS/Notes (Assets)

3\. PL Items - Negative Balance = Revenue/Income = Show as POSITIVE in PL/Notes (unless expense head)

4\. PL Items - Positive Balance = Expense = Show as POSITIVE in PL/Notes



Formatting Requirements

\- Font: Bookman Old Style, Size 11

\- Number Format: Accounting format with brackets for negatives

\- Units: Absolute or Thousands/Lakhs/Crores (Schedule III)

\- Currency: INR

\- Zeros: Show as "0" or blank (user choice)

\- Dates: DD-MMM-YYYY format



Critical Success Factors

1\. Data Integrity: All mappings must be validated before generation

2\. Formula Linking: Output Excel must have live formulas, not hard values

3\. Ease of Use: User with no coding knowledge must be able to operate

4\. Error Handling: Clear, actionable error messages

5\. Performance: Handle Trial Balances with 1000+ line items

6\. Compliance: 100% Schedule III and AS coverage

7\. WPF MSI: Must install and run on Windows 10/11 without issues



Documentation Requirements

1\. User Manual (PDF) - step-by-step with screenshots

2\. Installation Guide - how to install MSI

3\. Sample Data Guide - how to prepare Trial Balance

4\. Troubleshooting Guide - common issues and solutions

5\. Master Data Setup Guide - how to configure Major/Minor/Groupings

6\. Updated Progress document during the development phase so that it is clear at all times and in case of new sessions as to what is done, what is pending, what is the next step and which model needs to be called for.





Acceptance Criteria (excerpt)

* End-to-end: Import Sample TB.xlsx → zero unmapped after assisted mapping → generate statements/notes → export Excel with correct formulas and totals; CY/PY consistent.
* Schedule III and AS minimum disclosures appear when applicable, with warnings if data missing.
* Admin can create/reset/delete users; role restrictions enforced; licensing blocks excess sessions.
* Works on multiple Windows PCs over LAN using NAS-hosted DB and licensing service.
