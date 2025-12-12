**Target Page:** Integration Data (Accounting Software Connection)

**Objective:** Design and implement the primary interface for managing third-party accounting software integrations (Xero, QuickBooks, API). The page must clearly display the current integration status, provide buttons for initiating connections, and list necessary integration tabs.

### 1. 📋 Core Functionality & Features

* **Integration Management:** Allow users to connect to supported accounting software (Xero, QuickBooks) or a custom API.
* **Status Display:** Show the current integration status (e.g., "No Integration").
* **Configuration Tabs:** Provide navigation to related configuration areas: Contacts, Chart of Accounts, Payment Methods, and VAT/GST Rates.
* **Integration Notes:** Display important informational notes regarding data extraction and export formats.

### 2. 🎨 UI Components & Layout

#### A. Header and Navigation

* **Page Title:** The page must be clearly titled: **"Integration Data"**.
* **Sidebar Menu:** The sidebar must highlight **"Integration Data"** as the active menu item.
* **User Header:** Retain the standard header components (e.g., Verification Alert, `HS Welcome Hamza Sheikh`, Reset/Change).

#### B. Integration Configuration Tabs

The primary navigation for this section is a horizontal set of tabs, starting with the current view:

* **`Accounting Software Integration`** (Current View)
* **`Contacts`**
* **`Chart of Accounts`**
* **`Payment Methods`**
* **`VAT/GST Rates`**

#### C. Integration Connectors Panel

This panel is the main focus, allowing users to select and initiate connection to their accounting software:

* **Header:** `Select an accounting software for integration`.
* **Connector Buttons:** Implement three distinct, clickable buttons for initiating connections:
    * **Button 1:** `Connect to Xero`
        * **Function:** Initiates the connection process to Xero (e.g., redirects to Xero OAuth flow).
    * **Button 2:** `Connect to QuickBooks`
        * **Function:** Initiates the connection process to QuickBooks (e.g., redirects to QuickBooks OAuth flow).
    * **Button 3:** `Connect via API`
        * **Function:** Opens a modal or new interface to configure a custom API connection.

#### D. Status Display

* **Label:** `Status`.
* **Value:** Currently displays `No Integration (Excel Output)`. This value must be dynamic and update based on the active connection (e.g., to "Connected to Xero").

#### E. Informational Notes (`<Note>` Block)

A boxed or distinct section containing key guidelines for the user:

* **Note 1 (Export/Integration):** If exporting Invoices & Receipts from Receipt Bot to Xero or QuickBooks Online, users must use the relevant integration links above.
* **Note 2 (Bank Statements):** Bank Statements data extraction is *only* for viewing. Users can download the data in compatible CSV/Excel formats.
* **Note 3 (Invoices/Receipts without Integration):** If using accounting software other than Xero or QuickBooks Online, Invoice or Receipt data extraction is possible, but users must download data in compatible CSV/Excel formats.

### 3. 💡 Design Notes

* **Button Styling:** The three main connector buttons (`Connect to Xero`, `Connect to QuickBooks`, `Connect via API`) should be prominently styled (e.g., using icons and distinct colors) to encourage interaction.
* **Consistency:** The Integration configuration tabs must use the same styling and interaction as the main document status tabs found on other pages.