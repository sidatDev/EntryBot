import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@entrybot.ai';
    // A simple initial password - in a real scenario, this should be env var or prompt
    const password = 'admin';
    const hashedPassword = await hash(password, 12);

    console.log(`Creating admin user: ${email}...`);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            // Ensure role is admin if user exists
            role: 'ADMIN',
            status: 'ACTIVE'
        },
        create: {
            email,
            name: 'Admin User',
            password: hashedPassword,
            role: 'ADMIN',
            status: 'ACTIVE'
        },
    });

    console.log('Admin user created/updated successfully:');
    console.log({ id: user.id, email: user.email, role: user.role });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
