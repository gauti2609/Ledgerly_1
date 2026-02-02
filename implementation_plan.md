# Implementation Plan - FinAutomate Pre-Production Updates

This plan outlines the steps dealing with the "OpenCode Assessment.md" to transition the application to a Release Candidate state.

## 1. Resolved Issues & Bug Fixes

### A. Critical Application Crashes (Safe Navigation)
**Goal:** Prevent "White Screen of Death" by handling partial data states in reports.
**Changes:**
- [ ] **Modify `components/reports/BalanceSheet.tsx`, `ProfitAndLossStatement.tsx`, `CashFlowStatement.tsx`**
    - Add "Gatekeeper" checks at the top of components: returns `<div>Loading...</div>` if `allData?.scheduleData` is missing.
    - Implement optional chaining (`?.`) for all deep property accesses (e.g., `scheduleData?.ppe?.assets`).
- [ ] **Create `components/ErrorBoundary.tsx`**
    - Create a React Error Boundary component to catch crashes and display a friendly UI.
- [ ] **Modify `pages/ReportsPage.tsx`**
    - Wrap report components with `<ErrorBoundary>`.

### B. Schedule Auto-Population
**Goal:** Enable "Auto-Fill" for complex schedules like Trade Payables and Inventories.
**Changes:**
- [ ] **Create `utils/scheduleAutoPopulate.ts`**
    - Implement `populateScheduleFromTB` function.
    - Add logic for:
        - **Trade Payables:** Map total grouped valus to "< 1 Year" ageing.
        - **Inventories:** Create rows dynamically based on mapped inventory ledgers in TB.
        - **PPE:** Map Closing Gross Block.
- [ ] **Modify `pages/SchedulesPage.tsx`**
    - Add "Auto-Fill" button to schedule forms.
    - Integrate `populateScheduleFromTB` logic.

### C. Backend Security & Validation
**Goal:** detailed server-side validation ensuring Assets = Liabilities.
**Changes:**
- [ ] **Create `backend/src/validation/validation.module.ts`**
- [ ] **Create `backend/src/validation/validation.service.ts`**
    - Implement `validateBalanceSheetEquation(data)` checking `Assets - (Liabilities + Equity) < 1.0`.
- [ ] **Modify `backend/src/financial-entity/financial-entity.service.ts`**
    - Inject `ValidationService`.
    - Run validation before saving entity data.
- [ ] **Modify `backend/src/app.module.ts`**
    - Import `ValidationModule`.

### D. Startup Fix (Circular Dependency)
**Goal:** Fix circular dependency in `approvalService`.
**Changes:**
- [ ] **Modify `services/approvalService.ts`**
    - Remove imports from `apiService`.
    - Use `fetchWithAuth` directly or restructure imports.

### E. Data Flow Rectification
**Goal:** Fix data loss and missing fields identified during audit.
**Changes:**
- [x] **Modify `AdditionalRegulatoryInfoSchedule.tsx` & Note**
    - Implement tabular input for "Benami Property".
    - Implement input tables for "Fund Utilisation".
    - Update CSR "Reason for Shortfall" to use `InputWithCheckbox`.
- [x] **Modify `RelatedPartySchedule.tsx` & Note**
    - Add "Balances Outstanding" table (Receivable/Payable).
    - Update Note to display balances.
- [x] **Modify `EmployeeBenefitsNote.tsx`**
    - Logic update: Prioritize manual inputs (Salaries, Welfare, etc.) over Trial Balance values if provided.

## 2. New Feature Implementations

### A. Approval Workflow
**Goal:** Manager/Executive workflow.
**Changes:**
- [ ] **Backend:** Verify/Create `ApprovalModule` (or `PendingChangesModule`).
    - Ensure endpoints `submit`, `approve`, `reject` exist.
- [ ] **Frontend:**
    - **Create `components/ApprovalDashboard.tsx`**: UI to list and act on changes.
    - **Modify `pages/DashboardPage.tsx`**: Add button to access Approval Dashboard.

### B. Professional Excel Export
**Goal:** Board-ready Excel formatting.
**Changes:**
- [ ] **Modify `services/exportService.ts`**
    - Replace `xlsx` with `xlsx-js-style`.
    - Apply styles: Bold Headers (Blue Bg, White Text), Currency Borders, Column Widths.
- [ ] **Install Dependency:** `npm install xlsx-js-style` (Frontend).

### F. Theme Switcher
**Goal:** Global Dark/Light mode toggle.
**Changes:**
- [ ] **Modify `index.html`**
    - Add `darkMode: 'class'` to tailwind config.
- [ ] **Create `components/ThemeSwitcher.tsx`**
    - Implement logic to toggle class on `html` tag.
    - Persist to local storage.
    - Listen to system preference.
    - UI: Fixed bottom-left button.
- [ ] **Modify `App.tsx`**
    - Mount `<ThemeSwitcher />` globally.

# Features Priority: High

## Goal Description
Implement critical usability enhancements and multi-year data management capabilities.
1.  **State Persistence**: Ensure refreshing the page retains the user's current view.
2.  **Entity Search**: Add a search bar to the Dashboard.
3.  **Multi-Year Support**: Manage multiple financial years for a single company (grouped by unique code).
4.  **Duplicate Safety**: Alert users on similar names to prevent accidental duplicates or correctly link years.

## User Review Required
> [!IMPORTANT]
> **Schema Change**:
> - `financialYear` (String): e.g., "2024-2025".
> - `companyCode` (String): Unique UUID for grouping years of the same company. Internal use only.
> **Workflow Change**: creating an entity now involves a "Duplicate Check" step. User must confirm if they are adding a year to an existing company or creating a brand new one.

## Proposed Changes

### Backend
#### [MODIFY] [schema.prisma](file:///d:/GoogleAILocal_antigravity/GoogleAILocal_v0/backend/prisma/schema.prisma)
- Add `financialYear` String (default "2024-2025").
- Add `companyCode` String (default uuid for migration).

#### [MODIFY] [entities.service.ts](file:///d:/GoogleAILocal_antigravity/GoogleAILocal_v0/backend/src/entities/entities.service.ts)
- Update `create`:
    - Perform a check for existing entities with similar names (Case-insensitive check).
    - If similar exists and no `confirmNew` flag: return "Possible Matches".
    - If `linkToCode` provided: Create new entity with that `companyCode`.
    - If `confirmNew` provided: Create new entity with fresh `companyCode`.

### Frontend Structure & Logic
#### [MODIFY] [DashboardPage.tsx](file:///d:/GoogleAILocal_antigravity/GoogleAILocal_v0/pages/DashboardPage.tsx)
- **Grouping**: Group displayed entities by `companyCode`. Show "Card" as Company Name, with dropdown/list of Years.
- **Search**: Filter companies by name.
- **Create Modal**:
    - **Step 1**: Enter Name, Type, FY.
    - **Step 2 (Hidden if no duplicates)**: "We found similar companies. Do you want to add this year to one of them?"
        - List matches.
        - Options: "Link to [Selected Match]" OR "No, Create New Company".

#### [MODIFY] [App.tsx](file:///d:/GoogleAILocal_antigravity/GoogleAILocal_v0/App.tsx)
- Implement URL Persistence (`?entityId=...`).

#### [MODIFY] [MainApp.tsx](file:///d:/GoogleAILocal_antigravity/GoogleAILocal_v0/components/MainApp.tsx)
- **Header**: Add Year Switcher.
    - Fetch all entities with same `companyCode` (excluding current one) to populate switcher.
    - Switching redirects/reloads app with new `entityId`.

## Verification Plan

### Manual Verification
1.  **Duplicate Flow**:
    - Create "Alpha Corp" (2024).
    - Try creating "alpha corp" (2025).
    - Verify Alert: "Similar name found".
    - Choose "Link to Alpha Corp".
    - Verify Dashboard shows one "Alpha Corp" card with 2 years.
2.  **New Entity Flow**:
    - Create "Beta Inc".
    - Try creating "Beta Inc".
    - Verify Alert.
    - Choose "Create New".
    - Verify Dashboard shows TWO "Beta Inc" cards (if allowed) or distinct groups.
3.  **Persistence**: Reload page, verify state.
