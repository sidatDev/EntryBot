# EntryBot Project Roadmap & Tasks

##  Phase 1: Foundation & Core Data Entry (Priority)
**Goal:** Enable full Data Entry operations within a hierarchical client structure immediately.

### 1.1 Infrastructure & Hierarchy Setup
- [ ] **Database Schema Updates**
    - [ ] Create `Organization` model (Attributes: Name, Type, ParentId, Settings)
    - [ ] Update `User` model (Link to Organization, granular Permissions)
    - [ ] Create `Role` model (System Roles vs Custom Roles)
    - [ ] Create `AuditLog` model (Track all user actions)

- [ ] **User Management System**
    - [ ] Super Admin Screen: Create Master Clients
    - [ ] Master Client Screen: Create Child Clients (Sub-accounts)
    - [ ] Role Assignment Interface (Assign specific permissions)

### 1.2 Core Data Entry System
- [ ] **Entity Management Screen (The Hub)**
    - [ ] **Entity List View**: Display all assigned Clients/Child Clients.
    - [ ] **Columns**: Client Name, Processing Status (Trial, Active, Blocked), Remaining Credits, Assigned Team.
    - [ ] **Filters**: Filter by Status, Team, Priority.

- [ ] **Processing Interface (The Workbench)**
    - [ ] **Split Screen UI**: Left side Document Viewer, Right side Data Entry Form.
    - [ ] **Document Viewer**: Zoom, Rotate, Pan controls.
    - [ ] **Shortcuts**: Hostkeys for rapid navigation (e.g., Ctrl+S to save, Ctrl+N for next field).
    - [ ] **Auto-Save**: Save draft progress every 30 seconds.

- [ ] **Task & Queue Management**
    - [ ] **Processing Queue**: List of documents waiting for data entry.
    - [ ] **My Tasks**: Personal queue for logged-in Data Entry user.
    - [ ] **Task Assignment**: Admin/Manager assigns specific docs to specific users.

- [ ] **Document Workflow Actions**
    - [ ] **Upload**: Multi-file upload with drag-and-drop.
    - [ ] **Categorize**: Tag document type (Invoice, Bank Statement, Receipt).
    - [ ] **Process**: manual data entry.
    - [ ] **Submit/Complete**: Mark as done -> Move to QA (if applicable) or Completed.

### 1.3 Basic Document Backend
- [x] S3 Storage Integration
- [x] Basic CRUD Actions
- [ ] PDF Split/Merge Enhancements (Visual page selector)

---

## Phase 2: Commercialization & Advanced Management
**Goal:** Enable selling the product (Subscriptions) and managing large teams.

### 2.1 Subscription & Billing
- [ ] **Schema**: `Package` (Limits, Price) & `Subscription` (StartDate, EndDate, Status).
- [ ] **Billing Engine**: Logic to deduct credits per document/line.
- [ ] **Package Management UI**: Super Admin creates/edits packages.
- [ ] **Subscription Enforcement**: Block actions if credits exhausted.

### 2.2 Supervisor & Quality Assurance
- [ ] **Team Management**: Create Teams, assign Users to Teams.
- [ ] **Performance Dashboard**: Track Docs Processed/Hour, Error Rate.
- [ ] **Quality Control (QC)**: Random sampling of processed docs for review.
- [ ] **Service Level Agreements (SLA)**: Alert if doc sits in queue > X hours.

---

## Phase 3: Client Experience & Reporting
**Goal:** Give clients detailed visibility and control.

### 3.1 Client Portals
- [ ] **Master Client Dashboard**: High-level view of all Sub-accounts, usage stats, total spend.
- [ ] **Child Client Dashboard**: View only their own documents and status.
- [ ] **Upload Portal**: branded upload page for clients.

### 3.2 Reporting & Analytics
- [ ] **Export Engine**: Generate CSV/Excel/PDF reports.
- [ ] **Financial Reports**: Expense summaries based on extracted data.
- [ ] **Audit Trail**: View logs of who uploaded/viewed/downloaded a file.

### 3.3 System Notifications
- [ ] **Notification Center**: Bell icon with dropdown for alerts.
- [ ] **Email Alerts**: "Document Processed", "Credits Low".

---

## Phase 4: Integration & AI Automation
**Goal:** Automate and connect with external world.

### 4.1 External Integrations
- [ ] **Xero Connector**: Push invoices to Xero.
- [ ] **QuickBooks Connector**: Push invoices to QuickBooks.
- [ ] **Email Ingestion**: Forward emails to `receipts@entrybot.ai`.

### 4.2 AI Capabilities
- [ ] **Automated OCR**: AWS Textract integration.
- [ ] **Auto-Extraction**: Map OCR results to Invoice fields automatically.
- [ ] **Anomaly Detection**: Flag duplicate invoices or suspicious amounts.
