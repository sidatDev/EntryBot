import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { InvoiceForm } from '@/components/forms/InvoiceForm'
import { saveInvoice } from '@/lib/actions'
import userEvent from '@testing-library/user-event'

// Mock actions
vi.mock('@/lib/actions', () => ({
    saveInvoice: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
}))

describe('InvoiceForm', () => {
    it('renders form fields correctly', () => {
        render(<InvoiceForm documentId="doc-1" documentUrl="s3://url" />)

        expect(screen.getByText('Invoice Data Entry')).toBeInTheDocument()
    })

    it('shows validation errors for required fields', async () => {
        render(<InvoiceForm documentId="doc-1" documentUrl="s3://url" />)
        const user = userEvent.setup()

        const saveButton = screen.getByRole('button', { name: /Save & Close/i })
        await user.click(saveButton)

        await waitFor(() => {
            expect(screen.getByText('Invoice number is required')).toBeInTheDocument()
        })
    })
})
