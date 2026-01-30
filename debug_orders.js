
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
            documents: true
        }
    });

    if (orders.length === 0) {
        console.log("No orders found");
        return;
    }

    console.log(`Found ${orders.length} orders`);

    for (const order of orders) {
        console.log(`\nOrder ID: ${order.id}`);
        console.log(`Status: ${order.status}`);
        console.log(`Created: ${order.createdAt}`);
        console.log(`Total Docs: ${order.documents.length}`);
        order.documents.forEach(d => {
            console.log(`  - [${d.id}] ${d.name} | ${d.status} | ${d.approvalStatus}`);
        });
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
