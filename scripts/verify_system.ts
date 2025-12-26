
// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Verifying System Data...");

    // 1. List All Organizations
    const orgs = await prisma.organization.findMany({
        include: {
            parent: true,
            users: true
        }
    });

    console.log(`\n🏢 Found ${orgs.length} Organizations:`);
    orgs.forEach(org => {
        console.log(`\n[${org.type}] Name: "${org.name}" (ID: ${org.id})`);
        if (org.parent) console.log(`   ↳ Parent: "${org.parent.name}"`);
        console.log(`   ↳ Status: ${org.status}, Credits: ${org.credits}`);

        if (org.users.length > 0) {
            console.log(`   ↳ Users:`);
            org.users.forEach(u => {
                console.log(`      - ${u.name} (${u.email}) [Role: ${u.role}]`);
            });
        } else {
            console.log(`   ⚠️ No users found for this organization.`);
        }
    });

    // 2. Summary for User
    const masterOrg = orgs.find(o => o.type === 'MASTER_CLIENT');
    const childOrg = orgs.find(o => o.type === 'CHILD_CLIENT' || o.type === 'SUB_CLIENT');
    const admin = orgs.find(o => o.type === 'INTERNAL' || o.name === 'EntryBot Internal');

    const summary = `
✅ === CREDENTIALS SUMMARY ===
${admin && admin.users.length > 0 ? `🔐 Super Admin:\n   Email: ${admin.users[0].email}\n   Password: password123 (Default)` : '❌ No Super Admin found'}

${masterOrg && masterOrg.users.length > 0 ? `🔐 Master Client (${masterOrg.name}):\n   Email: ${masterOrg.users[0].email}\n   Password: welcome123 (Default)` : '❌ No Master Client found'}

${childOrg && childOrg.users.length > 0 ? `🔐 Child Client (${childOrg.name}):\n   Email: ${childOrg.users[0].email}\n   Password: welcome123 (Default)` : '❌ No Child Client found'}
`;

    console.log(summary);
    // Write to file for safety
    const fs = require('fs');
    fs.writeFileSync('scripts/system_creds.txt', summary);

}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
