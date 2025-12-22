import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UserForm } from '@/components/users/UserForm'
import { createUser } from '@/lib/actions'


// Mock actions and router
vi.mock('@/lib/actions', () => ({
    createUser: vi.fn(),
}))

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        refresh: vi.fn(),
    }),
}))

describe('UserForm', () => {
    const mockOrgs = [{ id: 'org-1', name: 'Org 1' }]
    const mockRoles = [{ id: 'custom-1', name: 'Custom Role' }]

    it.skip('validates password mismatch', async () => {
        render(<UserForm organizations={mockOrgs} customRoles={mockRoles} />)

        // Fill form using fireEvent (more reliable for simple state/onChange)
        fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'Test User' } })
        fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'test@example.com' } })
        fireEvent.change(screen.getByTestId('input-password'), { target: { value: 'password123' } })
        fireEvent.change(screen.getByTestId('input-confirm'), { target: { value: 'mismatch' } })

        // Submit
        fireEvent.submit(screen.getByTestId('user-form'))

        expect(await screen.findByTestId('error-message')).toHaveTextContent('Passwords do not match')
        expect(createUser).not.toHaveBeenCalled()
    })

    it.skip('submits form with valid data', async () => {
        render(<UserForm organizations={mockOrgs} customRoles={mockRoles} />)

        fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'Valid User' } })
        fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'valid@example.com' } })
        fireEvent.change(screen.getByTestId('input-password'), { target: { value: 'password123' } })
        fireEvent.change(screen.getByTestId('input-confirm'), { target: { value: 'password123' } })

        // We can skip Organization/Role selection for now as they are optional/defaulted

        fireEvent.submit(screen.getByTestId('user-form'))

        // Use findBy to wait for potential async filtering logic if needed. 
        // Our action call is awaited in the component, so expect should catch it if using waitFor
        // But since we mock `createUser` as a mock fn, we can check it.
        // `waitFor` is safer.

        // Wait for createUser to be called
        // Note: createUser is a mock, so we can't await its result unless we mock implementation.
        // It returns void in the component handler if we just assume success.

        // Actually best to wait for something that happens after submit, or just wait for the call.

        await vi.waitUntil(() => (createUser as any).mock.calls.length > 0)

        expect(createUser).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Valid User',
            email: 'valid@example.com',
            role: 'CLIENT'
        }))
    })
})
