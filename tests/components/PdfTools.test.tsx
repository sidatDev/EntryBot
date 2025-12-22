import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PdfTools } from '@/components/tools/PdfTools'
import { mergeDocuments, splitDocument } from '@/lib/actions'
import { useSession } from 'next-auth/react'

// Mock actions
vi.mock('@/lib/actions', () => ({
    mergeDocuments: vi.fn(),
    splitDocument: vi.fn(),
}))

// Mock next-auth
vi.mock('next-auth/react', () => ({
    useSession: vi.fn(),
}))

// Mock lucide
vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal() as any
    return { ...actual }
})

describe('PdfTools', () => {

    it('does not render when no items selected', () => {
        (useSession as any).mockReturnValue({ data: { user: { id: 'u1' } } })
        render(<PdfTools selectedIds={[]} onComplete={vi.fn()} />)
        expect(screen.queryByText('selected')).not.toBeInTheDocument()
    })

    it('renders with correct count', () => {
        (useSession as any).mockReturnValue({ data: { user: { id: 'u1' } } })
        render(<PdfTools selectedIds={['1', '2']} onComplete={vi.fn()} />)
        expect(screen.getByText('2 selected')).toBeInTheDocument()
    })

    it('disables split when multiple items selected', () => {
        render(<PdfTools selectedIds={['1', '2']} onComplete={vi.fn()} />)
        const splitBtn = screen.getByText('Split').closest('button')
        expect(splitBtn).toBeDisabled()

        const mergeBtn = screen.getByText('Merge').closest('button')
        expect(mergeBtn).not.toBeDisabled()
    })

    it('disables merge when single item selected', () => {
        render(<PdfTools selectedIds={['1']} onComplete={vi.fn()} />)
        const mergeBtn = screen.getByText('Merge').closest('button')
        expect(mergeBtn).toBeDisabled()

        const splitBtn = screen.getByText('Split').closest('button')
        expect(splitBtn).not.toBeDisabled()
    })

    it('calls mergeDocuments on click', async () => {
        (useSession as any).mockReturnValue({ data: { user: { id: 'user-1' } } })
        const onComplete = vi.fn()

        render(<PdfTools selectedIds={['1', '2']} onComplete={onComplete} />)

        fireEvent.click(screen.getByText('Merge'))

        await waitFor(() => {
            expect(mergeDocuments).toHaveBeenCalledWith(['1', '2'], 'user-1')
            expect(onComplete).toHaveBeenCalled()
        })
    })

    it('calls splitDocument on click', async () => {
        const onComplete = vi.fn()
        render(<PdfTools selectedIds={['1']} onComplete={onComplete} />)

        fireEvent.click(screen.getByText('Split'))

        await waitFor(() => {
            expect(splitDocument).toHaveBeenCalledWith('1')
            expect(onComplete).toHaveBeenCalled()
        })
    })
})
