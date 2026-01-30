
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const doc = await prisma.document.findFirst({
        where: { name: { contains: 'Merged Document' } },
        orderBy: { createdAt: 'desc' }
    });

    if (!doc || !doc.orderId) {
        console.log("No merged document order found");
        return;
    }

    const order = await prisma.order.findUnique({
        where: { id: doc.orderId },
        include: {
            documents: true
        }
    });

    if (!order) {
        console.log("Order not found");
        return;
    }

    const allDocs = await prisma.document.findMany({
        where: { orderId: order.id }
    });

    console.log(`Order ID: ${order.id}`);
    console.log(`Order Status: ${order.status}`);
    console.log(`Total Docs: ${allDocs.length}`);

    console.log("--- DOCUMENT LIST ---");
    for (const d of allDocs) {
        console.log(`ID: ${d.id}`);
        console.log(`Name: ${d.name}`);
        console.log(`Status: ${d.status}`);
        console.log(`Approval: ${d.approvalStatus}`);
        console.log(`DeletedAt: ${d.deletedAt}`);
        console.log("---------------------");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
