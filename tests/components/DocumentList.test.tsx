import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DocumentList } from '@/components/documents/DocumentList'

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        refresh: vi.fn(),
        push: vi.fn(),
    }),
}))

// Mock next/link
vi.mock('next/link', () => ({
    default: ({ children, href }: any) => <a href={href}>{children}</a>
}))

// Mock lucide-react icons to avoid issues in jsdom if any
vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal()
    return {
        ...actual as any,
        // If specific icons cause issues, mock them here. For now, using actual should work with transpiler.
    }
})

// Mock actions
vi.mock('@/lib/actions', () => ({
    updateDocumentCategory: vi.fn(),
    updateInvoicePaymentMethod: vi.fn(),
    softDeleteDocument: vi.fn(),
    restoreDocument: vi.fn(),
    permanentDeleteDocument: vi.fn(),
    exportInvoicesToCSV: vi.fn(),
}))

// Mock child components
vi.mock('@/components/tools/PdfTools', () => ({
    PdfTools: () => <div data-testid="pdf-tools" />
}))

vi.mock('@/components/upload/UploadModal', () => ({
    UploadModal: () => <button>Upload Modal Trigger</button>
}))

describe('DocumentList', () => {
    const mockDocuments = [
        {
            id: 'doc-1',
            name: 'Invoice 1.pdf',
            type: 'PDF',
            status: 'COMPLETED',
            category: 'SALES_INVOICE',
            createdAt: new Date(),
            invoices: [
                {
                    id: 'inv-1',
                    supplierName: 'Acme Corp',
                    date: new Date('2023-01-01'),
                    totalAmount: 150.00,
                    currency: 'USD',
                    baseCurrencyAmount: 150.00,
                    paymentMethod: 'Cash'
                }
            ]
        },
        {
            id: 'doc-2',
            name: 'Pending.pdf',
            type: 'PDF',
            status: 'PROCESSING',
            category: 'GENERAL',
            createdAt: new Date(),
            invoices: []
        }
    ]

    it('renders "No documents found" when list is empty', () => {
        render(<DocumentList documents={[]} />)
        expect(screen.getByText(/No documents found/i)).toBeInTheDocument()
    })

    it('renders list of documents', () => {
        render(<DocumentList documents={mockDocuments} />)
        expect(screen.getByText('Acme Corp')).toBeInTheDocument()
        // Amount usually appears multiple times (base and invoice currency)
        const amounts = screen.getAllByText('150.00')
        expect(amounts.length).toBeGreaterThan(0)
        // Processing doc
        expect(screen.getByText('Processing...')).toBeInTheDocument()
    })

    it('allows selection of documents', () => {
        render(<DocumentList documents={mockDocuments} />)
        const checkboxes = screen.getAllByRole('button').filter(b => b.querySelector('svg')) // Approximation for checkbox button
        // The first one is "select all", subsequent are rows.
        // DocumentList implementation: The toggle is a button with an icon.
        // Let's rely on row clicks or specific selectors if possible.
        // The component uses custom buttons for checkboxes.

        // Clicking the first row selection button (index 1, as index 0 is select all)
        // Actually, let's look at the component structure:
        // <td><button onClick={() => toggleSelection(doc.id)}>...</button></td>

        // We can find by row content and then find the button within it, or just find all buttons with checkboxes.
    })
})
