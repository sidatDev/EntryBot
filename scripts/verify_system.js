
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

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

    console.log(`\n🏢 Found ${orgs.length} Organizations`);

    // 2. Summary for User
    const masterOrg = orgs.find(o => o.type === 'MASTER_CLIENT');
    const childOrg = orgs.find(o => o.type === 'CHILD_CLIENT' || o.type === 'SUB_CLIENT');
    const adminOrg = orgs.find(o => o.type === 'INTERNAL' || o.name === 'EntryBot Internal');

    const summary = `
✅ === CREDENTIALS SUMMARY ===
${adminOrg && adminOrg.users[0] ? `🔐 Super Admin:\n   Email: ${adminOrg.users[0].email}\n   Password: password123 (Default)` : '❌ No Super Admin found'}

${masterOrg && masterOrg.users[0] ? `🔐 Master Client (${masterOrg.name}):\n   Email: ${masterOrg.users[0].email}\n   Password: welcome123 (Default)` : '❌ No Master Client found'}

${childOrg && childOrg.users[0] ? `🔐 Child Client (${childOrg.name}):\n   Email: ${childOrg.users[0].email}\n   Password: welcome123 (Default)` : '❌ No Child Client found'}
`;

    console.log(summary);
    // Write to file for safety
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
