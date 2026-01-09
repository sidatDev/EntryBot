Summary of Client Side – Login, Signup, and Dashboard Flow for Receipt-Bot Application
This document details the authentication process, dashboard functions, and document management features for clients using the Receipt-Bot system to upload receipts, monitor submissions, and manage account information.

1. Client Signup Flow
The signup process enables new clients to create accounts for submitting and tracking receipts and financial documents.

Clients access the Signup screen from the main app.
Required fields:
Full Name / Business Name
Email Address (unique and valid)
Password and Confirm Password
Mobile Number (optional, for OTP)
Acceptance of Terms and Conditions (checkbox)
The system validates input for email format, password strength, and password match.
Identity confirmation is done via an email verification link or OTP.
Upon verification:
Account creation completes.
User is redirected to the organization setup screen.
The Next button is visible only after all mandatory fields are completed.
After completing business setup, a completion message with guidelines is displayed.
Clicking Get Started leads to the client dashboard (specific to Entry Bot design).
Screenshots provided relate only to signup flow, not UI design.
2. Client Login Flow
Returning clients securely log in to access their dashboards.

Clients enter email address and password.
System authenticates credentials:
Success: redirects to Client Dashboard.
Failure: shows error and offers password reset.
Optional features:
Remember Me for persistent login.
Forgot Password initiates recovery via email or OTP.
Optional Two-Factor Authentication (2FA) via SMS or Authenticator App.
3. Client Dashboard and Document Management
The dashboard serves as the central hub for document uploads, viewing, filtering, and exporting.

Upload and View Documents
Upload Button: Opens a popup allowing document upload by selecting document type and browsing files.
View Data Button: Opens relevant grids (e.g., purchase invoices) in new tabs showing document status.
Document IDs are generated sequentially per business starting at 1, regardless of document module.
Terminology Updates
“Invoice and receipts” renamed to Purchase Invoices.
“Supplier Name” renamed to Contact Name.
4. Purchase Invoices Module
This module manages purchase invoices with several interactive features:

Feature	Description
Add Files	Upload documents specifically as purchase invoices; popup opens with purchase invoice type pre-selected.
Export CSV	Download selected processed documents as a single Excel CSV file (bulk export).
Bulk Edit	Edit multiple selected documents simultaneously (e.g., Contact Name, Document Type).
Filters	Various filters applied to refine search results: Doc ID, Description, Document Number, Type, Date, Contact Name, Currency, Amount range, Category, Payment Method, VAT rate, and Include Processing checkbox.
Tabs in Purchase Invoices
Tab Name	Content Description
All	Shows all documents regardless of status (processing, processed, approved, exported).
New	Shows newly uploaded or processing documents, awaiting client action.
Processed	Shows documents processed but not yet approved or exported.
Approved	Shows documents approved by the client; these are removed from New and Processed tabs.
Exported	Shows documents downloaded or exported by the client; removed from Processed tab once exported.
Report	Displays business expenses monthly and yearly; summarized by supplier, category, VAT, or user.
5. Action Column Conditions in Purchase Invoices
For non-integrated businesses: “Approve” button appears. Clicking moves document to Approved tab and removes it from New and Processed.
For businesses integrated with Xero: “Export to Xero” button appears; exports document to integrated Xero account.
For businesses integrated with QuickBooks: “Export to QuickBooks” button appears; exports document to integrated QuickBooks account.
6. Expense Report Tab
Shows annual reports by supplier, category, VAT, or user.
Uses the business registration month as the starting point for the 12-month reporting period.
Export CSV option is available for downloading the report data.
Further clarifications can be obtained via video or direct contact with Hamza.
7. Bank & Card Statement Module
Similar tab structure as Purchase Invoices: All, New, Processed, Exported.
Upload file button opens popup with document type preset to “Bank & Card Statement”.
Bulk Download allows downloading multiple documents filtered by the same payment method.
If multiple payment methods are selected, the system opens a popup to select documents with matching payment methods.
Downloaded file names follow the format:
BankName-AccountNo-PeriodStartDate-PeriodEndDate
Additional Client Side Screens (Not Fully Detailed)
Other Document Screen
Upload History
Recycle Bin
Integration Data Screen (includes Contacts, Chart of Accounts, Payment Methods, VAT/GST Rates)
Setting
Practice Dashboard, Staff, Profile
Business Profile (multi-part explanation)
Details on these screens are marked as Not Specified/Uncertain in this document.

Key Insights
The system emphasizes validation and security via email/OTP verification and optional 2FA.
Document management is centralized and modular, with consistent tab structures across different document types.
Bulk operations (upload, edit, export) are key features enhancing user efficiency.
Integration with accounting software like Xero and QuickBooks enables seamless export workflows.
The reporting feature offers customizable expense views aligned with business registration dates.
Clear UI behaviors such as visibility of buttons (Next, Approve, Export) are tied to user actions and business integration status.
This summary captures the core flows, functional modules, and user interface behaviors as described in the source content without any assumptions or additions beyond the provided details.