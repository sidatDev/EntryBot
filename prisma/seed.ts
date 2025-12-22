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
            update: {},
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
        where: { name: "EntryBot Internal" },
        update: {},
        create: {
            name: "EntryBot Internal",
            type: "INTERNAL",
            status: "ACTIVE",
            credits: 999999,
        },
    });
    console.log(`🏢 Organization ensured: ${internalOrg.name}`);

    // 3. Upsert Super Admin User
    const password = await hash(process.env.ADMIN_PASSWORD || "admin", 12);
    const superAdminRole = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } });

    const user = await prisma.user.upsert({
        where: { email: "admin@entrybot.ai" },
        update: {
            organizationId: internalOrg.id,
            customRoleId: superAdminRole?.id,
            role: "ADMIN", // Legacy fallback
        },
        create: {
            email: "admin@entrybot.ai",
            name: "Super Admin",
            password,
            role: "ADMIN",
            organizationId: internalOrg.id,
            customRoleId: superAdminRole?.id,
            status: "ACTIVE",
        },
    });

    console.log(`👤 Admin user ensured: ${user.email} (Org: ${internalOrg.name})`);
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
