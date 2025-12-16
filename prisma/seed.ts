import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@entrybot.ai'; // Default admin email
    const password = process.env.ADMIN_PASSWORD || 'admin'; // Default password, can be overridden by env
    const hashedPassword = await hash(password, 12);

    console.log(`Start seeding ...`);

    const admin = await prisma.user.upsert({
        where: { email },
        update: {
            role: 'ADMIN',
            status: 'ACTIVE',
        },
        create: {
            email,
            name: 'Admin User',
            password: hashedPassword,
            role: 'ADMIN',
            status: 'ACTIVE'
        },
    });

    console.log(`Created/Updated admin user with id: ${admin.id}`);
    console.log(`Execution complete.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
