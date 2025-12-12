1. Global Navigation & Layout
The application follows a standard Admin Dashboard layout (Sidebar + Top Bar + Main Content Area).

Sidebar (Primary Navigation)
Company Branding: Logo and Company Name (e.g., "Rbtesthamza111").

Navigation Links:

Dashboard

Invoices & Receipts (Active state)

Bank & Card Statements

Other Documents

Upload History

Recycle Bin

Configuration Links: Integration Data, Contacts, Chart of Accounts, Payment Methods, VAT/GST Rates.

Top Header
User Profile: User name (Hamza Sheikh) and avatar.

Quick Actions: Notification bell, Help/Support icon, and Global Settings gear.

System Alert: A "Verification Email" banner with "Resend" and "Change" buttons.

2. Invoices & Receipts Header & Filtering
This section handles the high-level management of the document list.

Status Tabs
These act as primary filters for the data table:

All: Displays every document regardless of status.

New: Only displays recently uploaded, unprocessed documents.

Processed: Documents where data extraction/OCR is complete.

Approved: Documents finalized by the user.

Reports: A view for monthly and annual expense summaries.

Action Toolbar (Top Right)
Primary Actions: + Add Files (Upload), Approve (Bulk approval for selected items).

Secondary Actions: Bulk Edit, Columns (Toggle visibility), Transfer (Export to accounting software).

Utility Actions: Export CSV, Refresh, Filter (Advanced search), and Delete.

3. The Data Table (Core Component)
The table is dynamic and allows for both viewing and inline editing.

Table Columns
Selection (Checkbox): To select multiple rows for bulk actions.

Doc ID: Unique identifier for the document.

Doc Type: Visual icon representing the document type (e.g., Receipt, Invoice, Credit Note).

Supplier Name: Name of the vendor.

Invoice Date: The date found on the document.

Amount (Invoice Currency): Total in the original currency.

Amount (Base Currency): Total converted to the business's functional currency.

Category (Dropdown): Editable field to assign the document to a ledger account (e.g., General Expenses).

Payment Method (Dropdown): Editable field to specify how it was paid (e.g., Commonwealth Bank).

Actions:

Approve Button: To finalize a single document.

View/Edit Icon: Usually to open the document side-by-side with the data for manual verification.

4. Interaction Features
Inline Editing: The Category and Payment Method columns use dropdowns so users can update data without leaving the list view.

Bulk Processing: Selecting multiple checkboxes enables the top "Approve" or "Delete" buttons.

Pagination: A "Show [X] records" dropdown at the bottom left to control row density.

Status Indicators: Visual cues (like the blue loading circle in the "Doc Type" column) to show processing state.

5. Summary of Functional Requirements
To build this, your tech stack will need to handle:

State Management: To handle tab switching and bulk selection.

File Upload: A modal or drop-zone triggered by the "Add Files" button.

CSV Export Logic: To parse the current table view into a downloadable file.

Dynamic Data Fetching: Filtering the table API call based on the active Tab (New, Processed, etc.).