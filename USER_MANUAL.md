# User Manual: Financials Automation Tool

Welcome to the **Financials Automation Tool**. This guide will help you use the application to prepare financial statements efficiently, even if you are not an accounting expert.

---

## Table of Contents
1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
    - [Login & Access](#login--access)
    - [The Dashboard](#the-dashboard)
3. [Core Functions & How to Use Them](#3-core-functions--how-to-use-them)
    - [Step 1: Import Trial Balance](#step-1-import-trial-balance)
    - [Step 2: Mapping ("The Match Game")](#step-2-mapping-the-match-game)
    - [Step 3: Schedules & Data Entry](#step-3-schedules--data-entry)
    - [Step 4: Generating Reports](#step-4-generating-reports)
4. [Using AI Features](#4-using-ai-features)
5. [User Roles & Restrictions](#5-user-roles--restrictions)

---

## 1. Introduction

**What is this tool?**
Think of this tool as a smart assistant that takes your raw accounting data (Trial Balance) and automatically organizes it into official financial reports (Balance Sheet, Profit & Loss). It checks for errors, does the math for you, and ensures you follow important rules (Schedule III).

**Who is it for?**
- **Admins:** To manage companies and users.
- **Accountants/Managers:** To map data and prepare reports.
- **Auditors/Viewers:** To review the final reports.

---

## 2. Getting Started

### Login & Access
You cannot register yourself. An Administrator must create an account for you and send you the credentials.
1.  Open the application in your web browser (e.g., `http://localhost:8080`).
2.  Enter your **Email** and **Password**.
3.  Click **Login**.

### The Dashboard
Once logged in, you will see a list of "Financial Entities" (these are the Companies or LLPs you are working on).
- **To specific work:** Click on a Company Name to open it.
- **To add a new Company:** Click "Create New Entity" (⚠️ *Restricted to Admins only*).

---

## 3. Core Functions & How to Use Them

### Step 1: Import Trial Balance
This is where you upload your raw numbers.
1.  Go to the **"Mapping Workbench"** tab (usually the first screen).
2.  Click the **"Import Trial Balance"** button.
3.  Select your CSV file. *Note: Your file must have headers like Ledger Name, Debit, Credit.*
4.  The system will load your data into a list.

### Step 2: Mapping ("The Match Game")
"Mapping" just means telling the system where each item belongs. For example, telling it that "HDFC Bank" belongs to "Cash & Bank Balances".
1.  Look at the likely **"Unmapped"** list on the left or top.
2.  For each item, use the dropdowns to select:
    - **Major Head:** (e.g., Current Assets)
    - **Minor Head:** (e.g., Cash and Cash Equivalents)
    - **Grouping:** (e.g., Balances with Banks)
3.  **Pro Tip (AI Suggestions):** Look for the "wand" icon or "Auto-Map" button. The AI will guess where items belong. You just need to review and click **"Apply"**.

### Step 3: Schedules & Data Entry
Some data (like "Share Capital details" or "Directors' names") isn't in the Trial Balance. You have to type it in.
1.  Navigate to the **"Schedules"** page.
2.  You will see a list of forms on the left (e.g., "Corporate Info", "Share Capital", "Fixed Assets").
3.  Click a form and fill in the blanks.
    - **Yellow boxes:** These are auto-filled from your mapped Trial Balance. You can't change them here (go back to Mapping if they are wrong).
    - **White boxes:** Type the details here.
4.  **Save** your work frequently!

### Step 4: Generating Reports
This is the final result.
1.  Go to the **"Financial Reports"** page.
2.  Click onto tabs like **"Balance Sheet"** or **"Profit & Loss"**.
3.  The report is generated automatically.
4.  **Export:** Click the "Export to Excel" button to download a file you can print or share.

---

## 4. Using AI Features

- **Chatbot:** stuck on a rule? Click the chat bubble icon in the corner. Ask questions like *"What is the depreciation rate for computers?"*
- **Policy Drafting:** In the "Accounting Policies" schedule, look for "Generate with AI". It can write standard legal text for you.

---

## 5. User Roles & Restrictions

Not everyone can do everything. Here is what your role allows:

| Feature | **Viewer / Auditor** | **Manager / Editor** | **Entity Admin** | **Tenant / Platform Admin** |
| :--- | :---: | :---: | :---: | :---: |
| **View Reports** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Edit Data (Mapping/Schedules)** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Create New Companies** | ❌ No | ❌ No | ❌ No | ✅ Yes |
| **Delete Companies** | ❌ No | ❌ No | ✅ Yes (Soft Delete) | ✅ Yes |
| **Manage Users** | ❌ No | ❌ No | ✅ Yes (Assign roles) | ✅ Yes |
| **Lock/Finalize Data** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |

**Common Errors & Restrictions:**
- **"Access Denied"**: You are trying to do something your role doesn't permit (e.g., a Viewer trying to save changes).
- **"Registration Disabled"**: You cannot create a new account yourself; ask your Admin.
- **Delete Button Missing**: You don't have permission to delete this item.

---
*For technical support, please contact your System Administrator.*
