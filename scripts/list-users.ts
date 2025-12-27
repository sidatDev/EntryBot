
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('List of Users:');
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            role: true,
            status: true,
            passwordHash: true // Inspecting hash existence (not value)
        }
    });
    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
