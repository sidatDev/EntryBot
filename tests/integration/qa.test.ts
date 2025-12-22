import { describe, it, expect, vi, beforeEach } from 'vitest'
import { submitQualityReview, getQAQueue } from '@/lib/actions/qa'
import { prisma } from '@/lib/prisma'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        qualityReview: {
            upsert: vi.fn(),
        },
        document: {
            update: vi.fn(),
            findMany: vi.fn(),
        },
    }
}))

// Mock next/cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

describe('QA Module', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('submitQualityReview', () => {
        it('upserts review and marks document as COMPLETED if passed', async () => {
            await submitQualityReview({
                documentId: 'doc-1',
                reviewerId: 'reviewer-1',
                status: 'PASSED',
                score: 95
            })

            expect(prisma.qualityReview.upsert).toHaveBeenCalled()
            expect(prisma.document.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'doc-1' },
                data: expect.objectContaining({
                    status: 'COMPLETED',
                    qaStatus: 'PASSED'
                })
            }))
        })

        it('marks document as REJECTED if failed', async () => {
            await submitQualityReview({
                documentId: 'doc-1',
                reviewerId: 'reviewer-1',
                status: 'FAILED',
                score: 40
            })

            expect(prisma.document.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'doc-1' },
                data: expect.objectContaining({
                    status: 'REJECTED',
                    qaStatus: 'FAILED'
                })
            }))
        })
    })

    describe('getQAQueue', () => {
        it('fetches documents with QA_REVIEW status', async () => {
            const mockDocs = [{ id: 'doc-1' }]
                ; (prisma.document.findMany as any).mockResolvedValue(mockDocs)

            const result = await getQAQueue()

            expect(prisma.document.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    status: 'QA_REVIEW'
                })
            }))
            expect(result).toHaveLength(1)
        })

        it('filters by organizationId if provided', async () => {
            await getQAQueue('org-1')

            expect(prisma.document.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    status: 'QA_REVIEW',
                    organizationId: 'org-1'
                })
            }))
        })
    })
})
