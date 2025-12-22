import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createOrganization } from '@/lib/actions/organization'
import { createPackage, deletePackage } from '@/lib/actions/packages'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        organization: {
            create: vi.fn(),
            findMany: vi.fn(),
        },
        user: {
            create: vi.fn(),
        },
        role: {
            findUnique: vi.fn(),
        },
        package: {
            create: vi.fn(),
            delete: vi.fn(),
            findMany: vi.fn(),
        },
        subscription: {
            count: vi.fn(),
        }
    }
}))

// Mock dependencies
vi.mock('bcryptjs', () => ({
    hash: vi.fn(),
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

describe('Super Admin Features', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('createOrganization', () => {
        it('validates hierarchy for Child Client', async () => {
            const result = await createOrganization({
                name: 'Child Org',
                type: 'CHILD_CLIENT',
                // parentId missing
                adminName: 'Admin',
                adminEmail: 'admin@child.com'
            } as any)

            expect(result).toHaveProperty('error', 'Child Client must have a Master Client (parentId)')
        })

        it('creates organization and initial admin user', async () => {
            (hash as any).mockResolvedValue('hashed_pwd')
                ; (prisma.organization.create as any).mockResolvedValue({ id: 'org-1' })
                ; (prisma.role.findUnique as any).mockResolvedValue({ id: 'role-master' })
                ; (prisma.user.create as any).mockResolvedValue({ id: 'user-admin' })

            const result = await createOrganization({
                name: 'Master Corp',
                type: 'MASTER_CLIENT',
                adminName: 'Master Admin',
                adminEmail: 'admin@master.com',
                adminPassword: 'password123'
            })

            expect(result).toHaveProperty('success', true)
            expect(prisma.organization.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    name: 'Master Corp',
                    type: 'MASTER_CLIENT'
                })
            }))
            expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    email: 'admin@master.com',
                    password: 'hashed_pwd',
                    organizationId: 'org-1'
                })
            }))
        })
    })

    describe('Packages', () => {
        it('creates a package', async () => {
            await createPackage({
                name: 'Gold',
                price: 99,
                monthlyCredits: 1000
            })

            expect(prisma.package.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    name: 'Gold',
                    price: 99
                })
            }))
        })

        it('prevents deletion if package is in use', async () => {
            (prisma.subscription.count as any).mockResolvedValue(5)

            await expect(deletePackage('pkg-1')).rejects.toThrow('Cannot delete package in use')
        })

        it('deletes package if unused', async () => {
            (prisma.subscription.count as any).mockResolvedValue(0)

            await deletePackage('pkg-1')

            expect(prisma.package.delete).toHaveBeenCalledWith({ where: { id: 'pkg-1' } })
        })
    })
})
