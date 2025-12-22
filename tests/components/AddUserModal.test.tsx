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
        render(<AddUserModal organizations={mockOrgs} customRoles={mockRoles} />)

        // Open modal
        fireEvent.click(screen.getByText('Add New User'))

        // Wait for modal
        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument()
        })

        // Fill form using name attributes which are stable
        const container = document.body
        fireEvent.change(container.querySelector('input[name="name"]')!, { target: { value: 'Test User' } })
        fireEvent.change(container.querySelector('input[name="email"]')!, { target: { value: 'test@example.com' } })
        fireEvent.change(container.querySelector('input[name="password"]')!, { target: { value: 'password123' } })
        fireEvent.change(container.querySelector('input[name="confirmPassword"]')!, { target: { value: 'mismatch' } })

        // Submit
        fireEvent.click(screen.getByRole('button', { name: 'Create User' }))

        await waitFor(() => {
            expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
        })
        expect(createUser).not.toHaveBeenCalled()
    })

    it('submits form with valid data', async () => {
        render(<AddUserModal organizations={mockOrgs} customRoles={mockRoles} />)

        fireEvent.click(screen.getByText('Add New User'))

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument()
        })

        const container = document.body
        fireEvent.change(container.querySelector('input[name="name"]')!, { target: { value: 'Valid User' } })
        fireEvent.change(container.querySelector('input[name="email"]')!, { target: { value: 'valid@example.com' } })
        fireEvent.change(container.querySelector('input[name="password"]')!, { target: { value: 'password123' } })
        fireEvent.change(container.querySelector('input[name="confirmPassword"]')!, { target: { value: 'password123' } })

        // Select logic might be tricky with Radix/Headless UI via testing-library
        // We might just stick to inputs we can easily control. 
        // Default role is CLIENT.

        fireEvent.click(screen.getByRole('button', { name: 'Create User' }))

        await waitFor(() => {
            expect(createUser).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Valid User',
                email: 'valid@example.com',
                role: 'CLIENT'
            }))
        })
    })
})
