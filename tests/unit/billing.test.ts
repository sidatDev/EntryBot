import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hasCredits, deductCredits } from '@/lib/billing'
import { prisma } from '@/lib/prisma'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        organization: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    }
}))

describe('Billing Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('hasCredits', () => {
        it('returns false if organization not found', async () => {
            (prisma.organization.findUnique as any).mockResolvedValue(null)
            const result = await hasCredits('org-1')
            expect(result).toBe(false)
        })

        it('returns true for INTERNAL organizations', async () => {
            (prisma.organization.findUnique as any).mockResolvedValue({ id: 'org-internal', type: 'INTERNAL', credits: 0 })
            const result = await hasCredits('org-internal')
            expect(result).toBe(true)
        })

        it('returns true if credits allow', async () => {
            (prisma.organization.findUnique as any).mockResolvedValue({ id: 'org-1', type: 'CLIENT', credits: 10 })
            const result = await hasCredits('org-1', 5)
            expect(result).toBe(true)
        })

        it('returns false if insufficient credits', async () => {
            (prisma.organization.findUnique as any).mockResolvedValue({ id: 'org-1', type: 'CLIENT', credits: 2 })
            const result = await hasCredits('org-1', 5)
            expect(result).toBe(false)
        })
    })

    describe('deductCredits', () => {
        it('throws if organization not found', async () => {
            (prisma.organization.findUnique as any).mockResolvedValue(null)
            await expect(deductCredits('org-1')).rejects.toThrow('Organization not found')
        })

        it('does not deduct for INTERNAL organizations', async () => {
            (prisma.organization.findUnique as any).mockResolvedValue({ id: 'org-internal', type: 'INTERNAL', credits: 100 })
            const result = await deductCredits('org-internal', 50)
            expect(result).toBe(100)
            expect(prisma.organization.update).not.toHaveBeenCalled()
        })

        it('throws if insufficient credits', async () => {
            (prisma.organization.findUnique as any).mockResolvedValue({ id: 'org-1', type: 'CLIENT', credits: 1 })
            await expect(deductCredits('org-1', 5)).rejects.toThrow('Insufficient credits')
        })

        it('deducts credits and returns new balance', async () => {
            (prisma.organization.findUnique as any).mockResolvedValue({ id: 'org-1', type: 'CLIENT', credits: 10 })
                ; (prisma.organization.update as any).mockResolvedValue({ credits: 9 })

            const result = await deductCredits('org-1', 1)

            expect(prisma.organization.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'org-1' },
                data: { credits: { decrement: 1 } }
            }))
            expect(result).toBe(9)
        })
    })
})
