/**
 * Quick script to fix uploaderId for merged documents
 * This updates merged documents to have the uploaderId from their source documents
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMergedDocumentUploader() {
    try {
        // Find all merged documents
        const mergedDocs = await prisma.document.findMany({
            where: {
                source: 'MERGE_OPERATION'
            },
            include: {
                organization: {
                    include: {
                        documents: {
                            where: {
                                source: {
                                    not: 'MERGE_OPERATION'
                                }
                            },
                            take: 1 // Get first non-merged document from the org
                        }
                    }
                }
            }
        });

        console.log(`Found ${mergedDocs.length} merged documents`);

        for (const doc of mergedDocs) {
            // Get the first document from the same organization
            const sourceDoc = doc.organization?.documents[0];

            if (sourceDoc && sourceDoc.uploaderId !== doc.uploaderId) {
                console.log(`\nUpdating merged document: ${doc.name}`);
                console.log(`  Current uploaderId: ${doc.uploaderId}`);
                console.log(`  New uploaderId: ${sourceDoc.uploaderId}`);

                await prisma.document.update({
                    where: { id: doc.id },
                    data: {
                        uploaderId: sourceDoc.uploaderId
                    }
                });

                console.log(`  ✅ Updated!`);
            } else {
                console.log(`\nSkipping ${doc.name} - already has correct uploaderId or no source found`);
            }
        }

        console.log('\n✅ Done fixing merged documents!');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixMergedDocumentUploader();
