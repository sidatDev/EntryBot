# Gap & Alignment Analysis: Receipt-Bot vs EntryBot
> **Date**: 2026-01-09
> **Reference Documents**: 
> 1. `AppDocuments/documentation1` (Core Scope)
> 2. `AppDocuments/documentation2` (Client-Side Receipt-Bot Specs)

## 1. Executive Summary
The current codebase ("EntryBot") has a strong foundational overlap with the requirements ("Receipt-Bot"), particularly in backend structure (Organization, Roles, Documents). However, there is a significant **User Experience & Terminology Drift**. The code builds a generic "Data Entry Hub", whereas the documentation asks for a specific "Client Receipt Portal" with strict sequential workflows, specific naming conventions, and Wizard-based onboarding.

## 2. Comparison Table: Requirement vs. Implementation
| Feature Area | Requirement (From Docs) | Implementation (Current Code) | Status |
| :--- | :--- | :--- | :--- |
| **Terminology** | "Purchase Invoices", "Contact Name" | "Invoices & Receipts", "Supplier Name" | 🔴 **Mismatch** |
| **Auth Flow** | Signup -> Mobile/OTP -> Org Setup Wizard -> Dashboard | Name/Email/Pass -> Dashboard -> Manual Org Creation | 🔴 **Gap** |
| **Document IDs** | **Sequential ID** (1, 2, 3...) per Business | **CUID** (Safe, alphanumeric, random) | 🔴 **Mismatch** |
| **Dashboard** | specific Tabs: All, New, Processed, Approved, Exported | Filters (`?status=UPLOADED`) | 🟡 **Partial** |
| **Bulk Actions** | **Bulk Edit** (Contact, Type), **Bulk Invoice Export** | Single Doc Edit only. CSV Export is basic. | 🔴 **Missing** |
| **Bank Statements** | **Bulk Download** grouped by Payment Method | List View exists. Bulk download missing. | 🔴 **Missing** |
| **Action Logic** | "Approve" (Local) vs "Export to Xero" (Integrated) | "Approve" button exists. Integration-aware toggle missing. | 🟡 **Partial** |
| **Validations** | Email Format, Password Strength, Match | Basic HTML5 validation | 🟡 **Partial** |

## 3. The "Off-Track" Check

### 👻 Ghost Features (Code exists, but not in Docs)
*   **Identity Card Module**: The codebase features a fully mature Identity Card processing module (Front/Back image, Urdu name support). The documentation only vaguely mentions "Other Documents".
*   **The Hub**: The "Hub" dashboard provides a multi-tenant command center for Master Clients. The documentation focuses more on a single-client "Dashboard". The Hub is actually *more* advanced than the requested Dashboard in some ways.

### 💔 Broken Promises (In Docs, missing in Code)
*   **"Mobile Number & OTP"**: The documentation explicitly requires Mobile Number collection and OTP verification during signup. The code has no implementation for SMS or Mobile fields.
*   **"Sequential Document IDs"**: The documentation promises human-readable, sequential IDs (e.g., Doc #55). The database uses UUIDs (`cl9x...`), which are not user-friendly for this requirement.

### 🏚️ Architectural Drift
*   **Onboarding Flow**: The code assumes a "Master Client" creates an account and then *manually* creates an organization in the Hub. The docs describes a forced "Setup Wizard" immediately after signup. The current implementation allows a user to exist without an organization in a limbo state (fixed partially by redirects, but still not a guided wizard).

## 4. Prioritized Immediate Fixes (Top 5)

### 1. 🏷️ Terminology & ID Update (High Visibility)
*   **Action**: Rename "Invoices" to "Purchase Invoices" in Sidebar/Headers. Rename "Supplier" to "Contact Name" in Forms/Tables.
*   **Action**: Add `semanticId` (Int, Autoincrement) to `Document` model scoped by `Organization`. Display this instead of UUID.

### 2. ⚡ "Action Column" Logic
*   **Action**: Update `DocumentList.tsx` columns. Check `user.integrationStatus` (or similar).
*   **Logic**:
    *   If `Not Integrated`: Show **[Approve]** (Moves to Approved tab).
    *   If `Xero`: Show **[Export to Xero]**.
    *   If `QuickBooks`: Show **[Export to QB]**.

### 3. 📂 Dashboard Tabs Implementation
*   **Action**: Replace the generic "Filter" dropdowns with explicit Tabs (`<Tabs>`) in `src/app/(dashboard)/documents/page.tsx`.
*   **Tabs**: `All | New (Uploaded/Processing) | Processed (Draft/Saved) | Approved | Exported`.

### 4. 📝 Signup Wizard & Org Setup
*   **Action**: Implement the "Organization Setup" screen.
*   **Flow**: Signup -> Email Verify (Stub) -> **Create Organization Form (Mandatory)** -> Dashboard.

### 5. 📦 Bulk Edit & Export
*   **Action**: Add Checkboxes to `LineItemsTable` or Document List.
*   **Action**: Create `BulkEditModal` (Inputs: Contact, Type).
*   **Action**: Implement `BulkExportAction` to generate CSV matching the sample format.
