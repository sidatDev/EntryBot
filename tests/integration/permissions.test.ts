import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUserPermissionsAction } from '@/lib/permissions-actions'
import { prisma } from '@/lib/prisma'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        },
    }
}))

describe('User Permissions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns ADMIN permissions for ADMIN role', async () => {
        (prisma.user.findUnique as any).mockResolvedValue({
            id: 'admin-1',
            role: 'ADMIN',
            customRole: null
        })

        const result = await getUserPermissionsAction('admin-1')
        expect(result.role).toBe('ADMIN')
        expect(result.permissions).toContain('*')
    })

    it('returns custom permissions for CUSTOM role', async () => {
        const mockPermissions = ['dashboard.view', 'invoices.view'];
        (prisma.user.findUnique as any).mockResolvedValue({
            id: 'user-1',
            role: 'SUBMITTER',
            customRole: {
                id: 'role-1',
                name: 'Custom Role',
                permissions: JSON.stringify(mockPermissions)
            }
        })

        const result = await getUserPermissionsAction('user-1')
        expect(result.permissions).toEqual(mockPermissions)
        expect(result.customRoleName).toBe('Custom Role')
    })

    it('returns default CLIENT permissions for standard user', async () => {
        (prisma.user.findUnique as any).mockResolvedValue({
            id: 'client-1',
            role: 'SUBMITTER',
            customRole: null
        })

        const result = await getUserPermissionsAction('client-1')
        expect(result.permissions).toContain('dashboard.view')
        expect(result.permissions).toContain('invoices.upload')
    })

    it('returns empty permissions for non-existent user', async () => {
        (prisma.user.findUnique as any).mockResolvedValue(null)

        const result = await getUserPermissionsAction('unknown')
        expect(result.permissions).toEqual([])
    })
})
