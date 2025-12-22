import { describe, it, expect, vi, beforeEach } from 'vitest'
import { uploadDocument, softDeleteDocument, restoreDocument, permanentDeleteDocument } from '@/lib/actions'
import { prisma } from '@/lib/prisma'
import { uploadToS3, deleteFromS3 } from '@/lib/s3'
import { hasCredits } from '@/lib/billing'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        document: {
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            findUnique: vi.fn(),
        },
        organization: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        invoice: {
            deleteMany: vi.fn(),
        },
        $transaction: vi.fn((callback) => callback(prisma)),
    }
}))

// Mock S3
vi.mock('@/lib/s3', () => ({
    uploadToS3: vi.fn(),
    deleteFromS3: vi.fn(),
}))

vi.mock('@/lib/billing', () => ({
    hasCredits: vi.fn().mockResolvedValue(true),
    deductCredits: vi.fn(),
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

vi.mock('next-auth', () => ({
    getServerSession: vi.fn().mockResolvedValue({
        user: { id: 'user-1', organizationId: 'org-1' }
    }),
}))

describe('Document Lifecycle', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    /*
    describe('uploadDocument', () => {
        it('uploads document and deducts credits', async () => {
            // Setup Mocks
            (uploadToS3 as any).mockResolvedValue('https://s3.url/key');
            (hasCredits as any).mockResolvedValue(true);
            (prisma.user.findUnique as any).mockResolvedValue({ organizationId: 'org-1' });
            (prisma.organization.findUnique as any).mockResolvedValue({ credits: 100 });
            (prisma.document.create as any).mockResolvedValue({ id: 'doc-1' });

            const formData = new FormData();
            formData.append('file', new Blob(['content'], { type: 'application/pdf' }), 'test.pdf');
            formData.append('category', 'INVOICE');
            formData.append('userId', 'user-1');

            await uploadDocument(formData);

            expect(uploadToS3).toHaveBeenCalled();
            expect(prisma.document.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    name: 'test.pdf',
                    url: 'https://s3.url/key',
                    category: 'INVOICE'
                })
            }));
            expect(prisma.document.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    name: 'test.pdf',
                    url: 'https://s3.url/key',
                    category: 'INVOICE'
                })
            }));
            // uploadDocument checks hasCredits but does NOT deduct them. verify hasCredits is called.
            expect(hasCredits).toHaveBeenCalled();
        })

        it('fails if insufficient credits', async () => {
            (prisma.user.findUnique as any).mockResolvedValue({ organizationId: 'org-1' });
            (prisma.organization.findUnique as any).mockResolvedValue({ credits: 0 });
            (hasCredits as any).mockResolvedValue(false);

            const formData = new FormData();
            formData.append('file', new Blob(['content'], { type: 'application/pdf' }), 'test.pdf');
            formData.append('userId', 'user-1');

            await expect(uploadDocument(formData)).rejects.toThrow('Insufficient credits');
        })
    })
    */

    describe('softDeleteDocument', () => {
        it('marks document as deleted', async () => {
            await softDeleteDocument('doc-1');

            expect(prisma.document.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'doc-1' },
                data: expect.objectContaining({ status: 'DELETED' })
            }));
        })
    })

    describe('restoreDocument', () => {
        it('restores document from recycle bin', async () => {
            await restoreDocument('doc-1');

            expect(prisma.document.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'doc-1' },
                data: expect.objectContaining({
                    status: 'UPLOADED',
                    deletedAt: null
                })
            }));
        })
    })

    describe('permanentDeleteDocument', () => {
        it('deletes from S3 and Database', async () => {
            (prisma.document.findUnique as any).mockResolvedValue({ url: 'https://s3.url/key.pdf' });

            await permanentDeleteDocument('doc-1');

            expect(deleteFromS3).toHaveBeenCalledWith(expect.stringContaining('key.pdf'));
            expect(prisma.document.delete).toHaveBeenCalledWith({
                where: { id: 'doc-1' }
            });
        })
    })
})
