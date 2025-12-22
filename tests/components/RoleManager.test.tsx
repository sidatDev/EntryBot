import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { RoleManager } from '@/components/users/RoleManager'
import { createRole } from '@/lib/actions'
import userEvent from '@testing-library/user-event'

// Mock actions and router
vi.mock('@/lib/actions', () => ({
    createRole: vi.fn(),
    updateRole: vi.fn(),
    deleteRole: vi.fn(),
}))

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        refresh: vi.fn(),
    }),
}))

describe('RoleManager', () => {
    const mockRoles = [
        { id: 'role-1', name: 'Existing Role', permissions: '["dashboard.view"]' }
    ]

    it('renders list of roles', () => {
        render(<RoleManager roles={mockRoles} />)
        expect(screen.getByText('Existing Role')).toBeInTheDocument()
    })

    it('creates a new role', async () => {
        render(<RoleManager roles={mockRoles} />)

        // Click create new
        fireEvent.click(screen.getByText('New'))

        // Enter name
        fireEvent.change(screen.getByPlaceholderText('e.g. Junior Bookkeeper'), { target: { value: 'Test Role' } })

        // Toggle permission (Assuming checkboxes are standard)
        // We look for 'DASHBOARD VIEW' label or similar
        // The component upper-cases it: {perm.replace('_', ' ').toUpperCase()} -> VIEW
        // Group name is Dashboard.
        // Let's find checkbox by ID if possible, or by label.
        // Code: id=`${group.key}.${perm}` e.g. 'dashboard.view'
        // Label text might be 'VIEW'

        // Let's try to match by ID if testing lib allows easily or just get by label text 'VIEW' within Dashboard group?
        // Simpler: just click save first to verify validation if any, but code has "if (!roleName) return"

        fireEvent.click(screen.getByText('Save Role'))

        await waitFor(() => {
            expect(createRole).toHaveBeenCalledWith('Test Role', expect.any(Array))
        })
    })

    it('opens editor when clicking a role', async () => {
        render(<RoleManager roles={mockRoles} />)

        fireEvent.click(screen.getByText('Existing Role'))

        await waitFor(() => {
            expect(screen.getByText('Edit Role: Existing Role')).toBeInTheDocument()
        })
    })
})
