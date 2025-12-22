import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getDocuments } from '@/lib/actions'
import { prisma } from '@/lib/prisma'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        document: {
            findMany: vi.fn(),
        }
    }
}))

describe('Server Actions - getDocuments', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should fetch documents with correct filters', async () => {
        const mockDocs = [{ id: '1', name: 'Test.pdf' }]
            // Type case to any to avoid complex mock typing for now
            ; (prisma.document.findMany as any).mockResolvedValue(mockDocs)

        const result = await getDocuments('SALES_INVOICE', 'COMPLETED')

        expect(prisma.document.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                category: 'SALES_INVOICE',
                status: 'COMPLETED',
                deletedAt: null
            }),
            orderBy: { createdAt: 'desc' }
        }))
        expect(result).toEqual(mockDocs)
    })

    it('should handle no filters', async () => {
        ; (prisma.document.findMany as any).mockResolvedValue([])

        await getDocuments()

        expect(prisma.document.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                deletedAt: null
            }
        }))
    })
})
