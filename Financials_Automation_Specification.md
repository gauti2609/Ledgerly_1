# Financials Automation Tool - Project Specification

## Overview
This document presents the detailed specification for the "Financials Automation Tool" project. It outlines the current challenges, objectives, and the comprehensive solution architecture designed to automate and streamline the preparation of financial statements. This specification serves as a reference for the system's capabilities, matching the rigorous standards of Schedule III compliance and modern software development practices.

## Problem Statement
Based on the analysis of traditional financial statement preparation processes, the following key issues have been identified:
- **Manual Dependency:** Financial statements are often managed using Excel sheets with manual file-sharing, leading to version control issues.
- **Lack of Validation:** Existing processes often lack built-in validation checks, increasing the risk of data entry errors and Schedule III non-compliance.
- **Data Integrity Risks:** Manual handling increases the risk of inconsistencies, and changes are difficult to trace (lack of audit trail).
- **Inefficiency:** The process is time-consuming, making it difficult for senior staff to review statements effectively and timely.
- **Accountability:** It is often difficult to determine responsibility for specific errors or modifications due to a lack of clear logging.

## Objectives
The Financials Automation Tool aims to resolve these issues by achieving the following objectives:
- **Streamline Workflow:** Automate the end-to-end process from Trial Balance import to final Report generation.
- **Reduce Manual Effort:** Minimize reliance on Excel and manual data entry through intelligent mapping and auto-population.
- **Ensure Compliance:** Enforce Schedule III requirements through structured validations and automated checks.
- **Enhance Traceability:** Provide a robust audit trail (logging) for all data changes to ensure accountability.
- **Improve Accuracy:** Use AI-assisted mapping and automated calculations to eliminate human error.

## Solution Features & Functionality

### 1. Mapping Workbench
The core module for transforming raw financial data into structured insights.
- **Trial Balance Import:** Supports CSV import of Trial Balance data.
- **Intelligent Mapping:**
    - Utilizes **Google Gemini AI** to suggest mappings for unmapped ledgers.
    - Displays confidence scores and reasoning for AI suggestions.
    - Allows bulk selection and "Apply Suggestion" for rapid processing.
- **Validation Rules:**
    - Ensures every row contains Account, Major Head, Minor Head, and Grouping.
    - Enforces the accounting equation: Closing Balance = Opening + Debit - Credit.
    - Validates that Opening and Closing columns sum to zero, and Debit sum equals Credit sum.
- **Masters Management:** Provides a comprehensive view of the Chart of Accounts masters.

### 2. Schedules & Notes Management
Dynamic generation of detailed schedules required for financial reporting.
- **Comprehensive Coverage:** Includes schedules for:
    - **Corporate Information & Accounting Policies** (with AI drafting support).
    - **Balance Sheet Items:** Share Capital, PPE, Trade Receivables/Payables, Cash & Equivalents, etc.
    - **P&L Items:** Revenue, Employee Benefits, Finance Costs, Tax Expense, etc.
    - **Regulatory Disclosures:** MSME, Benami Property, Wilful Defaulter, Crypto, CSR, etc.
- **Accounting Standards Support:** Implements specific schedules for AS 7 (Construction), AS 15 (Employee Benefits), AS 17 (Segment Reporting), AS 19 (Leases), and more.
- **Dynamic Note Numbering:** Automatically assigns and updates note numbers based on user selection.

### 3. Financial Reports
Automated generation of statutory financial statements.
- **Balance Sheet & P&L:** Automatically generated based on mapped values and user-entered notes.
    - Compliant with **Schedule III** format.
    - Displays Current Year and Previous Year figures side-by-side.
- **Cash Flow Statement:** Automated generation using the indirect method.
- **Ratio Analysis:** Automated calculation of mandatory ratios with Schedule III compliant presentation.
- **Export:** Full capability to export reports and notes to Excel for final formatting and distribution.

### 4. Entity & User Management
A secure, multi-user environment.
- **Entity Support:** Supports multiple financial entities (Private Limited, LLP, etc.) with automatic classification based on ICAI criteria.
- **Role-Based Access:** Secure login and registration flows using JWT authentication.
- **Data Isolation:** Ensures strict separation of data between different users and entities.

### 5. AI Integration
Leveraging advanced AI for efficiency.
- **Chatbot Assistant:** Embedded AI chatbot (Gemini-2.5-flash) to answer accounting standard queries within the app.
- **Policy Drafting:** AI generation of "Significant Accounting Policies" text (Gemini-2.5-pro).

## Technical Requirements & Constraints

### Trial Balance Rules
- **Structure:** Expected 9-value row structure (Ledger, Opening, Debit, Credit, Closing, Part, Major, Minor, Grouping).
- **Validation:** Strict adherence to predefined Major/Minor heads. Auto-calculation of closing balances if components are provided.

### Logging & Security
- **Audit Trail:** The system maintains a complete log of all critical actions (creation, modification, deletion).
- **Log content:** Captures User Identity, Timestamp, Action Type, Previous Value, and Updated Value.
- **Immutability:** Logs are read-only and retained for audit purposes.
- **Security:** API keys (Gemini) are secured via backend proxies; Data is persisted in a robust PostgreSQL database.

### Deployment
- **Flexible Deployment:** Supports multiple deployment models to suit infrastructure needs:
    - **Containerized (Recommended):** Fully Dockerized application (Frontend + Backend + Database) for simplified setup and consistency across different environments (NAS, seamless updates).
    - **Direct Execution:** Can be deployed directly on local Windows/Linux servers using standard Node.js and PostgreSQL installations for "bare metal" performance and integration with existing server management tools.
- **Architecture:** 
    - **Frontend:** React, Vite, TypeScript, TailwindCSS.
    - **Backend:** NestJS, Prisma ORM.
    - **Database:** PostgreSQL.

## Conclusion
The Financials Automation Tool represents a significant leap forward from manual financial reporting. By combining rigid accounting compliance (Schedule III) with flexible, modern technology (AI, Web-based UI), it ensures accuracy, efficiency, and peace of mind for finance professionals.
