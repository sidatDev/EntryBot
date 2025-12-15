
---
**Target Pages:**
1.  User Management Dashboard
2.  Role Management (Custom Role Creator)

**Objective:** Design and implement a secure, intuitive module for Administrators to manage users, assign static roles (Admin, Client), and create/manage granular custom roles and permissions.

### 1. 📋 Core Functionality & Features

* **User Lifecycle Management:** Ability to create, view, edit, and deactivate users.
* **Role Assignment:** Simple mechanism for assigning one of the defined roles (Admin, Client, Custom Role) to a user.
* **Custom Role Creation:** A dedicated interface for Admins to create new roles with highly granular permissions.
* **Permission Mapping:** Map specific application features (menu items, buttons, data access) to roles.

### 2. 🎨 UI Components & Layout: User Management Dashboard

This page lists all active and inactive users and allows the Admin to manage them.

| Component | Label/Action | Functionality |
| :--- | :--- | :--- |
| **Primary Button** | `+ Add New User` | Opens a modal/form for user creation (Name, Email, Password, Role Assignment). |
| **Search/Filter Bar** | `Search by Name or Email` | Efficiently locate users. |
| **Table** | User List | Displays all users with the following columns: |
| - | `Name` | |
| - | `Email` | |
| - | `Role` | Assigned role (Admin, Client, or Custom Role Name). |
| - | `Status` | Active/Inactive. |
| - | `Actions` | Icons for **Edit User Details** and **Deactivate/Activate User**. |

### 3. 🎨 UI Components & Layout: Role Management (Custom Role Creator)

This page allows the Admin to define the permissions for custom roles.

#### A. Role Creation Controls

| Component | Label | Functionality |
| :--- | :--- | :--- |
| **Input Field** | `Role Name` | Text input for naming the new custom role (e.g., "Junior Bookkeeper"). |
| **Primary Button** | `Save Role` | Persists the new role and its defined permissions. |

#### B. Permission Definition Panel (Checklist/Tree View)

The core component is a structured checklist where Admins select the exact access level for the role. Permissions must align with the application's menu structure:

| Permission Group (Menu Item) | Access Checkboxes (Read, Write, Delete) | Static Role Access |
| :--- | :--- | :--- |
| **Dashboard** | `View` | Admin, Client |
| **Invoices & Receipts** | `View`, `Upload`, `Approve`, `Export` | Admin, Client |
| **Bank & Card Statements** | `View`, `Upload`, `Bulk Edit`, `Export` | Admin, Client |
| **Other Documents** | `View`, `Upload`, `Tagging`, `Edit Properties` | Admin, Client |
| **Upload History** | `View` | Admin, Client |
| **Recycle Bin** | `View`, `Restore`, `Permanent Delete` | Admin, Client |
| **Integration Data** | `View`, `Edit Integration` | Admin, Client |
| **User/Role Management** | `View Users`, `Create/Edit Users`, `Create/Edit Roles` | Admin Only |
| **Settings (Contacts, Chart of Accounts, etc.)** | `View`, `Create/Edit` | Admin Only |

### 4. 🔒 Role-Based Access Control (RBAC) Logic

The system must strictly adhere to the following access rules:

| Role Name | Access Level / Scope | Notes |
| :--- | :--- | :--- |
| **Admin** | **Full Access to Everything** (Users, Roles, Configuration, and all Document Management). | Reserved for system owners/high-level control. |
| **Client** | **Standard Document Access:** Access to the following main menu items: Invoices & Receipts, Bank and Card Statement, Other Documents, Upload history, Recycle Bin, and Integration Data. | Standard user/client access, focused on document workflow. |
| **Custom User** | **Granular Permissions:** Access is determined *only* by the specific permissions granted when the custom role was created by the Admin. | This allows the Admin to define roles like "Approver" (View/Approve only) or "Uploader" (Upload/View only). |

### 5. 💡 Design Notes

* **Usability:** The Custom Role Creator must use clear labels and a logical grouping (like the table above) to prevent Admins from misconfiguring roles.
* **Security:** Access control logic must be enforced at the API level, not just the UI level. If a Custom User does not have access to a menu item, it must be hidden or disabled entirely.
* **Prompting:** When an Admin creates a Custom Role, the system should allow them to select from the *entire* list of possible permissions, not just the Client's limited view.

---


---

### 1. Modal Specifications

* **Title:** "Add New User"
* **Action Buttons:** `Cancel` (Closes modal) and `Create User` (Submits form).
* **Default State:** All fields should be clear and the default role should be set to "Client" or a placeholder requiring explicit selection.

### 2. Form Fields and Validation

The modal must contain the following fields. All fields marked with $\text{(*)}$ are mandatory.

| Field Label | Input Type | Validation Rules | Notes |
| :--- | :--- | :--- | :--- |
| **Full Name** $\text{(*)}$ | Text Input | Required; Minimum 3 characters. | Used for user greeting (e.g., "Welcome Hamza Sheikh"). |
| **Email Address** $\text{(*)}$ | Email Input | Required; Must be a valid email format (e.g., `user@domain.com`); Must be unique in the system. | Serves as the user's primary login ID. |
| **Initial Password** $\text{(*)}$ | Password Input | Required; Minimum 8 characters; Must include upper and lower case letters, a number, and a special character (e.g., strong password policy). | The first password the user will use. |
| **Confirm Password** $\text{(*)}$ | Password Input | Required; Must exactly match the **Initial Password** field. | For verification of the initial password. |
| **Assign Role** $\text{(*)}$ | Dropdown Select | Required; Must select one option. | Options include: **Admin**, **Client**, and all **Custom Roles** created by the Admin. |
| **Send Welcome Email** | Checkbox | Optional; Defaulted to checked. | If checked, an automated welcome email with login details is sent to the user's Email Address. |
| **User Status** | Toggle Switch | Defaults to $\text{Active}$. | Allows the Admin to create a user profile that is immediately active or temporarily inactive. |

### 3. Submission and Feedback

* **Error Handling:** If any validation rule is violated, display an inline error message next to the corresponding field (e.g., "Email address already exists" or "Password is too weak"). The `Create User` button must remain disabled until all required fields are valid.
* **Success Handling:**
    1.  On successful submission, the modal should close.
    2.  A success toast/notification should appear (e.g., "User [User Name] created successfully.").
    3.  The new user should immediately appear in the **User Management Dashboard** table list with their assigned role and active status.

---