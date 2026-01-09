# EntryBot - Project Details

## 📖 Project Overview
EntryBot is an automated accounting application built to streamline the data entry process for accountants and business owners. It serves as a central hub for uploading, processing, and exporting financial documents to major accounting platforms (Xero, QuickBooks).

### Core Philosophy
- **Automation First**: Minimize manual data entry.
- **Integration Centric**: Seamless sync with external accounting software.
- **User Experience**: Clean, modern, and intuitive interface using Shadcn UI.

---

## 🛠️ Tech Stack & Dependencies

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Utility-first), Shadcn UI (Component Library), Lucide React (Icons).
- **State Management**: React Server Components (RSC) for fetching, React Hooks (`useState`, `useTransition`) for client interactivity. No Redux/Zustand is currently used; keep state local or URL-based where possible.

### Backend
- **Server**: Next.js Server Actions (`src/lib/actions.ts`). No separate API server.
- **Database**: SQLite (Stored locally as `prisma/dev.db`).
- **ORM**: Prisma (Type-safe database access).
- **Authentication**: NextAuth.js (v4).

### Key Libraries
- `pdf-lib`: For splitting and merging PDFs.
- `recharts`: For dashboard analytics charts.
- `react-dropzone`: For drag-and-drop file uploads.
- `date-fns`: For consistent date formatting.

---

## 📂 Comprehensive Project Structure

```
c:/Burhan/Projects/AI/EntryBot/entry-bot/
├── .env                    # Environment variables (Database URL, Secrets)
├── prisma/
│   ├── dev.db              # Local SQLite Database (Do not commit)
│   └── schema.prisma       # Single source of truth for DB Schema
├── public/
│   └── uploads/            # Local storage for uploaded files (Git ignored in production recommended)
├── src/
│   ├── app/                # Next.js App Router (File-system based routing)
│   │   ├── (auth)/         # Public routes (Login/Register)
│   │   ├── (dashboard)/    # Protected routes (Requires Session)
│   │   │   ├── layout.tsx  # Main specific layout (Sidebar + Header)
│   │   │   └── [feature]/  # Feature pages (e.g., bank-statements, history)
│   ├── components/
│   │   ├── ui/             # Shadcn primitives (Button, Card, Input). Do not modify logic here often.
│   │   ├── layout/         # Sidebar, HeaderAlert, TopHeader.
│   │   ├── documents/      # Feature-specific components for Docs/Invoices.
│   │   └── integration/    # Feature-specific components for Integrations.
│   ├── lib/
│   │   ├── actions.ts      # ALL Server Actions. This is the API layer.
│   │   ├── utils.ts        # Helper functions (class merging).
│   │   └── prisma.ts       # Singleton Prisma client.
```

---

## 👨‍💻 Developer Guide: How to Work on EntryBot

### 1. The Development Lifecycle
Follow this flow when adding a new feature to ensure consistency and stability.

#### Phase A: Database & Backend
1.  **Modify Schema**: Open `prisma/schema.prisma`. Add your new Model or Field.
    *   *Rule*: Use optional fields (`?`) for data that might be missing during OCR.
2.  **Migrate**: Run `npx prisma migrate dev --name <descriptive_name>`.
    *   *Troubleshooting*: If stuck on "File locked" or `EPERM` (common on Windows with SQLite), **STOP** `npm run dev` and `npx prisma studio` before migrating.
3.  **Update Actions**: Go to `src/lib/actions.ts`.
    *   Create a new async function (e.g., `createFeatureItem`, `getFeatureItems`).
    *   Use `revalidatePath` to ensure the UI updates after mutation.

#### Phase B: User Interface
1.  **Create Components**: Build building blocks in `src/components/<feature>/`.
    *   *Rule*: Make components "Client Components" (`"use client"`) only if they need interactivity (hooks, event listeners). Otherwise, prefer Server Components.
2.  **Assemble Page**: Create/Update `src/app/(dashboard)/<feature>/page.tsx`.
    *   Fetch data here (Server Side) using your actions: `const data = await getData()`.
    *   Pass data to your Client Components as props.

#### Phase C: Verification
1.  **Manual Test**: Click through the flow.
2.  **Build Check**: Run `npm run build` locally to catch Type Errors before committing.

### 2. Coding Standards & Conventions

*   **Type Safety**: Avoid `any`. Define interfaces for your component props.
    *   *Pattern*: `type DocumentWithRelations = Document & { invoices: Invoice[] }`.
*   **Server Actions**: Always include `"use server"` at the top of action files. Validating inputs using `zod` is recommended for complex forms.
*   **UI Consistency**: Use `src/components/ui/*` components (Buttons, Cards, Inputs) instead of raw HTML tags to maintain the design system.
*   **Styling**: Use Tailwind utility classes. Avoid inline `style={{}}`.

### 3. Common Issues & Troubleshooting

#### CRITICAL: Prisma `EPERM` / Database Locked
*   **Symptom**: `Error: EPERM: operation not permitted` during migration.
*   **Cause**: SQLite file is locked because the Dev Server or Prisma Studio is reading it.
*   **Fix**:
    1.  Terminate `npm run dev` (Ctrl+C).
    2.  Terminate `npx prisma studio`.
    3.  Run the migration command.
    4.  Restart dev server.

#### Hydration Errors
*   **Symptom**: "Text content does not match server-rendered HTML".
*   **Cause**: Using browser-specific APIs (`window`, `localStorage`) or random values (`Date.now()`, `Math.random()`) during server rendering.
*   **Fix**: Wrap usage in `useEffect` or use `suppressHydrationWarning` if it's just a timestamp.

### 4. Application Modules Deep Dive

#### Document Processing (`/documents`)
- **Flow**: Upload -> `uploadDocument` action -> DB Record Created (Status: UPLOADED).
- **OCR**: Currently, text extraction logic would sit in `src/lib/actions.ts`. Data is saved to the `Invoice` model via `saveInvoice`.
- **Approval**: Users review extracted data. Clicking "Approve" moves status to `COMPLETED`.

#### Bank Statements (`/bank-statements`)
- Distinct from standard documents.
- Uses `BankStatementList` because columns differ (Account #, Start/End date) compared to Invoices (Supplier, Tax).
- **Bug Note**: Currently requires loose typing (`any`) in the list component due to a Prisma Client sync issue. **Fix this by running migration.**

#### Integration Data (`/integration-data`)
- **Purpose**: Manage OAuth tokens and settings for Xero/QB.
- **Current State**: UI is ready. Backend integration (OAuth flow) is needed. `integrationStatus` field exists on `User`.

---

## 🔮 Roadmap & Next Steps for Developers

1.  **Prisma Migration**: Run the pending migration for `source` and `integrationStatus` fields.
2.  **Type Hardening**: Remove `any` types in `BankStatementList` once migration is done.
3.  **Real OAuth**: Implement the actual OAuth 2.0 handshake for Xero/QuickBooks in `src/lib/actions.ts`.
4.  **OCR Integration**: Connect a real OCR provider (e.g., AWS Textract, Google Vision) in the `uploadDocument` flow.
