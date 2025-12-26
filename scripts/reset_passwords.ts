
// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log("🔐 Resetting all user passwords...");

    const newPasswordHash = await hash("welcome123", 12);

    // Update all users
    const update = await prisma.user.updateMany({
        data: {
            passwordHash: newPasswordHash
        }
    });

    console.log(`✅ Updated ${update.count} users to have password 'welcome123'.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
