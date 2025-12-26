import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting seed...");

    // 1. Create System Roles
    const roles = [
        { name: "SUPER_ADMIN", description: "Full system access", permissions: ["*"], isSystem: true },
        { name: "MASTER_ADMIN", description: "Master Client Admin", permissions: ["org.manage", "user.manage", "billing.view"], isSystem: true },
        { name: "MANAGER", description: "Team Manager", permissions: ["team.manage", "doc.approve"], isSystem: true },
        { name: "DATA_ENTRY", description: "Standard Data Entry", permissions: ["doc.process", "doc.view"], isSystem: true },
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role.name },
            update: {
                permissions: JSON.stringify(role.permissions),
            },
            create: {
                name: role.name,
                description: role.description,
                permissions: JSON.stringify(role.permissions),
                isSystem: role.isSystem,
            },
        });
        console.log(`✅ Role ensured: ${role.name}`);
    }

    // 2. Create Default Internal Organization
    const internalOrg = await prisma.organization.upsert({
        where: { id: "entrybot-internal-org" },
        update: {},
        create: {
            id: "entrybot-internal-org",
            name: "EntryBot Internal",
        },
    });
    console.log(`🏢 Organization ensured: ${internalOrg.name}`);

    // 3. Upsert Super Admin User
    const password = await hash(process.env.ADMIN_PASSWORD || "password123", 12);
    const superAdminRole = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } });

    const user = await prisma.user.upsert({
        where: { email: "admin@entrybot.io" },
        update: {
            organizationId: internalOrg.id,
            role: "ADMIN",
            customRoleId: superAdminRole?.id, // Link to Custom Role
        },
        create: {
            email: "admin@entrybot.io",
            name: "Super Admin",
            passwordHash: password,
            role: "ADMIN",
            organizationId: internalOrg.id,
            customRoleId: superAdminRole?.id, // Link to Custom Role
        },
    });

    console.log(`👤 Admin user ensured: ${user.email} (Org: ${internalOrg.name})`);

    // 4. Seed Packages
    console.log("📦 Seeding Packages...");
    await prisma.package.upsert({
        where: { name: "Bronze" },
        update: {},
        create: { name: "Bronze", price: 49.99, monthlyCredits: 500, description: "Starter entry level package" }
    });
    await prisma.package.upsert({
        where: { name: "Silver" },
        update: {},
        create: { name: "Silver", price: 149.99, monthlyCredits: 2000, description: "Standard business package" }
    });
    await prisma.package.upsert({
        where: { name: "Gold" },
        update: {},
        create: { name: "Gold", price: 499.99, monthlyCredits: 10000, description: "Enterprise volume package" }
    });

    console.log("🌱 Seeding finished.");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
