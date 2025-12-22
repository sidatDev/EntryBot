import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Checking Prisma Client...");
    if (prisma.package) {
        console.log("✅ prisma.package exists");
        const count = await prisma.package.count();
        console.log(`Current package count: ${count}`);
    } else {
        console.error("❌ prisma.package is UNDEFINED");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
