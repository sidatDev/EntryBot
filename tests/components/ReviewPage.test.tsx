import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
// Import default export
import DocumentReviewPage from '@/app/(dashboard)/qa/[id]/review/page'
import { submitQualityReview } from '@/lib/actions/qa'
import userEvent from '@testing-library/user-event'

// Mock actions
vi.mock('@/lib/actions/qa', () => ({
    submitQualityReview: vi.fn(),
}))

// Mock next-auth
vi.mock('next-auth/react', () => ({
    useSession: () => ({
        data: { user: { id: 'reviewer-1' } }
    })
}))

// Mock router
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}))

describe('DocumentReviewPage', () => {
    it('renders form and submits review', async () => {
        const user = userEvent.setup()
        // Provide mock params
        const params = { id: 'doc-1' }

        render(<DocumentReviewPage params={params} />)

        // Check for header
        expect(screen.getByText('Quality Review')).toBeInTheDocument()

        // Fill inputs
        const scoreInput = screen.getByDisplayValue('100') // defaultValue is 100
        await user.clear(scoreInput)
        await user.type(scoreInput, '95')

        await user.type(screen.getByPlaceholderText('Describe any errors found...'), 'Great job')

        // Click Pass button
        await user.click(screen.getByText('Pass'))

        await waitFor(() => {
            expect(submitQualityReview).toHaveBeenCalledWith({
                documentId: 'doc-1',
                reviewerId: 'reviewer-1',
                status: 'PASSED',
                score: 95,
                notes: 'Great job'
            })
        })
    })

    it('submits failed review', async () => {
        const user = userEvent.setup()
        const params = { id: 'doc-1' }
        render(<DocumentReviewPage params={params} />)

        await user.click(screen.getByText('Fail'))

        await waitFor(() => {
            expect(submitQualityReview).toHaveBeenCalledWith(expect.objectContaining({
                status: 'FAILED'
            }))
        })
    })
})
