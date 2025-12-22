import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mergeDocuments, splitDocument } from '@/lib/actions'
import { prisma } from '@/lib/prisma'
import { getFileBufferFromS3, uploadToS3 } from '@/lib/s3'
import { PDFDocument } from 'pdf-lib'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        document: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
        },
    }
}))

// Mock S3
vi.mock('@/lib/s3', () => ({
    getFileBufferFromS3: vi.fn(),
    uploadToS3: vi.fn(),
}))

// Mock next/cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

// Mock pdf-lib
vi.mock('pdf-lib', () => {
    return {
        PDFDocument: {
            create: vi.fn().mockResolvedValue({
                copyPages: vi.fn().mockResolvedValue(['page1', 'page2']),
                addPage: vi.fn(),
                save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
            }),
            load: vi.fn().mockResolvedValue({
                getPageIndices: vi.fn().mockReturnValue([0, 1]),
                getPageCount: vi.fn().mockReturnValue(2),
                copyPages: vi.fn().mockResolvedValue(['page1']),
            })
        }
    }
})

describe('PDF & S3 Operations', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('mergeDocuments', () => {
        it('throws if less than 2 documents', async () => {
            await expect(mergeDocuments(['doc-1'], 'user-1')).rejects.toThrow('Need at least 2 documents')
        })

        it('merges documents successfully', async () => {
            // Setup Mocks
            const mockDocs = [
                { id: 'doc-1', url: 's3://url1', category: 'SALES' },
                { id: 'doc-2', url: 's3://url2', category: 'SALES' }
            ]
                ; (prisma.document.findMany as any).mockResolvedValue(mockDocs)
                ; (getFileBufferFromS3 as any).mockResolvedValue(Buffer.from('pdf-content'))
                ; (uploadToS3 as any).mockResolvedValue('https://s3.bucket/merged.pdf')

            // Execute
            await mergeDocuments(['doc-1', 'doc-2'], 'user-1')

            // Verify
            expect(getFileBufferFromS3).toHaveBeenCalledTimes(2)
            expect(uploadToS3).toHaveBeenCalled()
            expect(prisma.document.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    name: 'Merged Document.pdf',
                    source: 'MERGE_OPERATION',
                    url: 'https://s3.bucket/merged.pdf'
                })
            }))
        })
    })

    describe('splitDocument', () => {
        it('throws if document not found', async () => {
            (prisma.document.findUnique as any).mockResolvedValue(null)
            await expect(splitDocument('doc-1')).rejects.toThrow('Document not found')
        })

        it('throws if document is single page', async () => {
            // Mock loading a single page PDF
            const singlePagePdfMock = {
                getPageCount: () => 1
            }
                ; (PDFDocument.load as any).mockResolvedValueOnce(singlePagePdfMock)
                ; (getFileBufferFromS3 as any).mockResolvedValue(Buffer.from('pdf'))
                ; (prisma.document.findUnique as any).mockResolvedValue({ id: 'doc-1', type: 'PDF', url: 's3://url' })

            await expect(splitDocument('doc-1')).rejects.toThrow('Document has only 1 page')
        })

        it('splits document into multiple files', async () => {
            // Standard mock from top level is multi-page (2 pages)
            ; (prisma.document.findUnique as any).mockResolvedValue({
                id: 'doc-1',
                name: 'MyDoc',
                type: 'PDF',
                url: 's3://url',
                userId: 'user-1',
                category: 'SALES'
            })
                ; (getFileBufferFromS3 as any).mockResolvedValue(Buffer.from('pdf'))
                ; (uploadToS3 as any).mockResolvedValue('https://s3.bucket/page.pdf')

            await splitDocument('doc-1')

            expect(prisma.document.create).toHaveBeenCalledTimes(2) // 2 pages
            expect(uploadToS3).toHaveBeenCalledTimes(2)
        })
    })
})
