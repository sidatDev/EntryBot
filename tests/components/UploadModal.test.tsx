import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UploadModal } from '@/components/upload/UploadModal'

// Mock Modal since it might use portals or complex logic
vi.mock('@/components/ui/Modal', () => ({
    Modal: ({ isOpen, children, title }: any) => isOpen ? (
        <div role="dialog" aria-label={title}>
            <h2>{title}</h2>
            {children}
        </div>
    ) : null
}))

// Mock UploadZone
vi.mock('@/components/upload/UploadZone', () => ({
    UploadZone: () => <div data-testid="upload-zone">Upload Zone Here</div>
}))

describe('UploadModal', () => {
    it('renders the upload button with correct text based on category', () => {
        render(<UploadModal category="SALES_INVOICE" />)
        expect(screen.getByText('Upload Sales Invoice')).toBeInTheDocument()

        // Cleanup before next render if necessary (RTL does this automatically)
    })

    it('opens modal on button click', async () => {
        render(<UploadModal category="GENERAL" />)
        const button = screen.getByText('Upload Document')
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

        fireEvent.click(button)
        // Wait for modal to appear
        expect(await screen.findByRole('dialog')).toBeInTheDocument()
        expect(screen.getByTestId('upload-zone')).toBeInTheDocument()
    })
})
