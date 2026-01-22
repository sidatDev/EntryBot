
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const docId = 'cmkp14so80001rencg54t4uin';
    console.log(`Checking document: ${docId}`);

    const doc = await prisma.document.findUnique({
        where: { id: docId },
        include: {
            user: true,
        }
    });

    if (!doc) {
        console.log('Document NOT FOUND in database.');
    } else {
        console.log('Document FOUND:');
        console.log('ID:', doc.id);
        console.log('UploaderID:', doc.uploaderId);
        console.log('Uploader Email:', doc.user?.email);
        console.log('Category:', doc.category);
        console.log('Type:', doc.type);
        console.log('Status:', doc.status);
        console.log('AssignedTo:', doc.assignedToId);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
