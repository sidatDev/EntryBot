/**
 * Clear all documents, orders, and related data from the database
 * WARNING: This will delete ALL documents and cannot be undone!
 */

import { PrismaClient } from '../generated/client';
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearAllDocuments() {
    try {
        console.log('⚠️  WARNING: This will delete ALL documents, orders, and related data!');
        console.log('Starting cleanup in 3 seconds...\n');

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Delete in order of dependencies (child tables first)

        console.log('🗑️  Deleting invoice line items...');
        const lineItems = await prisma.lineItem.deleteMany({});
        console.log(`   Deleted ${lineItems.count} line items`);

        console.log('🗑️  Deleting invoices...');
        const invoices = await prisma.invoice.deleteMany({});
        console.log(`   Deleted ${invoices.count} invoices`);

        console.log('🗑️  Deleting bank statements...');
        const statements = await prisma.bankStatement.deleteMany({});
        console.log(`   Deleted ${statements.count} bank statements`);

        console.log('🗑️  Deleting identity cards...');
        const idCards = await prisma.identityCard.deleteMany({});
        console.log(`   Deleted ${idCards.count} identity cards`);

        console.log('🗑️  Deleting activity logs...');
        const activities = await prisma.documentActivity.deleteMany({});
        console.log(`   Deleted ${activities.count} activity logs`);

        console.log('🗑️  Deleting orders...');
        const orders = await prisma.order.deleteMany({});
        console.log(`   Deleted ${orders.count} orders`);

        console.log('🗑️  Deleting documents...');
        const documents = await prisma.document.deleteMany({});
        console.log(`   Deleted ${documents.count} documents`);

        console.log('\n✅ Database cleanup complete!');
        console.log('\nNote: Files in S3 storage were NOT deleted. You may want to clean those manually if needed.');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

clearAllDocuments();
