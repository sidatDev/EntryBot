import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Sidebar } from '@/components/layout/Sidebar'
import { useSession } from 'next-auth/react'
import { getUserPermissionsAction } from '@/lib/permissions-actions'

// Mock next-auth
vi.mock('next-auth/react', () => ({
    useSession: vi.fn(),
    signOut: vi.fn(),
}))

// Mock permissions action
vi.mock('@/lib/permissions-actions', () => ({
    getUserPermissionsAction: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
    usePathname: () => '/dashboard',
    useRouter: () => ({ push: vi.fn() }),
}))

// Mock next/link
vi.mock('next/link', () => ({
    default: ({ children, href }: any) => <a href={href}>{children}</a>
}))

describe('Sidebar', () => {
    it('renders admin links if user has admin permissions', async () => {
        (useSession as any).mockReturnValue({
            data: { user: { id: 'admin-1', name: 'Admin' } },
            status: 'authenticated'
        })
            ; (getUserPermissionsAction as any).mockResolvedValue({ permissions: ['*'] })

        render(<Sidebar />)

        // Wait for effect
        await waitFor(() => {
            expect(screen.getByText('User Management')).toBeInTheDocument()
        })
        expect(screen.getByText('Invoices & Receipts')).toBeInTheDocument()
    })

    it('hides restricted links for standard users', async () => {
        (useSession as any).mockReturnValue({
            data: { user: { id: 'user-1', name: 'User' } },
            status: 'authenticated'
        })
            // Only dashboard access
            ; (getUserPermissionsAction as any).mockResolvedValue({ permissions: ['dashboard.view'] })

        render(<Sidebar />)

        await waitFor(() => {
            expect(screen.getByText('Dashboard')).toBeInTheDocument()
        })

        expect(screen.queryByText('User Management')).not.toBeInTheDocument()
        expect(screen.queryByText('Role Management')).not.toBeInTheDocument()
    })
})
