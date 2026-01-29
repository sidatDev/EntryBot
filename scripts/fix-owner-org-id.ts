/**
 * Fix user organizationId for organization owners
 * Clears organizationId for users who are owners of organizations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOwnerOrganizationId() {
    try {
        // Find all users who own organizations but still have organizationId set
        const usersWithOwnedOrgs = await prisma.user.findMany({
            where: {
                ownedOrganizations: {
                    some: {} // Has at least one owned organization
                },
                organizationId: {
                    not: null // But still has organizationId set (old data)
                }
            },
            include: {
                ownedOrganizations: true
            }
        });

        console.log(`Found ${usersWithOwnedOrgs.length} users who own organizations but have organizationId set`);

        for (const user of usersWithOwnedOrgs) {
            console.log(`\n${user.email}:`);
            console.log(`  Currently has organizationId: ${user.organizationId}`);
            console.log(`  Owns ${user.ownedOrganizations.length} organizations`);

            // Clear organizationId since they're owners, not members
            await prisma.user.update({
                where: { id: user.id },
                data: { organizationId: null }
            });

            console.log(`  ✅ Cleared organizationId`);
        }

        console.log('\n✅ Done fixing organization ownership!');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixOwnerOrganizationId();
