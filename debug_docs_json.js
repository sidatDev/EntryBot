
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
    const doc = await prisma.document.findFirst({
        where: { name: { contains: 'Merged Document' } },
        orderBy: { createdAt: 'desc' }
    });

    if (!doc || !doc.orderId) {
        fs.writeFileSync('debug_output.json', JSON.stringify({ error: "No merged document order found" }));
        return;
    }

    const order = await prisma.order.findUnique({
        where: { id: doc.orderId },
    });

    const allDocs = await prisma.document.findMany({
        where: { orderId: doc.orderId }
    });

    const result = {
        orderId: order.id,
        orderStatus: order.status,
        totalDocs: allDocs.length,
        documents: allDocs.map(d => ({
            id: d.id,
            name: d.name,
            status: d.status,
            approvalStatus: d.approvalStatus,
            deletedAt: d.deletedAt,
            organizationId: d.organizationId,
            assignedToId: d.assignedToId
        }))
    };

    fs.writeFileSync('debug_output.json', JSON.stringify(result, null, 2));
    console.log("Written to debug_output.json");
}

main()
    .catch(e => {
        fs.writeFileSync('debug_output.json', JSON.stringify({ error: e.message }));
        console.error(e);
    })
    .finally(async () => await prisma.$disconnect());
