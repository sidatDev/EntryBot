import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AddUserModal } from '@/components/users/AddUserModal'
import { createUser } from '@/lib/actions'
import userEvent from '@testing-library/user-event'

// Mock actions and router
vi.mock('@/lib/actions', () => ({
    createUser: vi.fn(),
}))

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        refresh: vi.fn(),
    }),
}))

// Mock UI components simply to avoid complex radix-ui failures if any,
// but usually we can test them directly with JSDOM if they are standard.
// For Dialog, we might need to rely on Radix behavior.
// Let's try standard render first.

describe('AddUserModal', () => {
    const mockOrgs = [{ id: 'org-1', name: 'Org 1' }]
    const mockRoles = [{ id: 'custom-1', name: 'Custom Role' }]

    it('validates password mismatch', async () => {
        const user = userEvent.setup()
        render(<AddUserModal organizations={mockOrgs} customRoles={mockRoles} />)

        // Open modal
        await user.click(screen.getByText('Add New User'))

        // Wait for modal components to be visible
        const dialog = await screen.findByRole('dialog')
        expect(dialog).toBeInTheDocument()

        // Fill form using Label text (ensure accessibility and robustness)
        await user.type(screen.getByLabelText(/Full Name/i), 'Test User')
        await user.type(screen.getByLabelText(/Email Address/i), 'test@example.com')
        await user.type(screen.getByLabelText('Initial Password *'), 'password123')
        await user.type(screen.getByLabelText('Confirm *'), 'mismatch')

        // Submit
        await user.click(screen.getByRole('button', { name: 'Create User' }))

        expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
        expect(createUser).not.toHaveBeenCalled()
    })

    it('submits form with valid data', async () => {
        const user = userEvent.setup()
        render(<AddUserModal organizations={mockOrgs} customRoles={mockRoles} />)

        await user.click(screen.getByText('Add New User'))

        await screen.findByRole('dialog')

        await user.type(screen.getByLabelText(/Full Name/i), 'Valid User')
        await user.type(screen.getByLabelText(/Email Address/i), 'valid@example.com')
        await user.type(screen.getByLabelText('Initial Password *'), 'password123')
        await user.type(screen.getByLabelText('Confirm *'), 'password123')

        // We can skip Organization/Role selection for now as they are optional/defaulted

        await user.click(screen.getByRole('button', { name: 'Create User' }))

        await waitFor(() => {
            expect(createUser).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Valid User',
                email: 'valid@example.com',
                role: 'CLIENT'
            }))
        })
    })
})
