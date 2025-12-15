"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, readFile, unlink } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";
import { PDFDocument } from "pdf-lib";
import { hash } from "bcryptjs";

export async function uploadDocument(formData: FormData) {
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    const category = (formData.get("category") as string) || "GENERAL";

    if (!file || !userId) {
        throw new Error("Missing file or user ID");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadDir = join(process.cwd(), "public", "uploads");
    try {
        await mkdir(uploadDir, { recursive: true });
    } catch (e) {
        // Ignore if exists
    }

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = join(uploadDir, fileName);
    const publicUrl = `/uploads/${fileName}`;

    await writeFile(filePath, buffer);

    await prisma.document.create({
        data: {
            name: file.name,
            url: publicUrl,
            size: file.size,
            type: file.type.includes("pdf") ? "PDF" : "IMG",
            userId: userId,
            status: "UPLOADED",
            category: category,
        },
    });

    revalidatePath("/documents");
    revalidatePath("/dashboard");
    revalidatePath("/history");
}

export async function mergeDocuments(documentIds: string[], userId: string) {
    if (documentIds.length < 2) throw new Error("Need at least 2 documents to merge");

    const documents = await prisma.document.findMany({
        where: {
            id: { in: documentIds },
            userId: userId,
            type: "PDF",
            status: { not: "DELETED" }
        }
    });

    if (documents.length !== documentIds.length) throw new Error("Some documents not found or not PDFs");

    const mergedPdf = await PDFDocument.create();

    for (const doc of documents) {
        // Resolve absolute path
        const relativePath = doc.url.startsWith("/") ? doc.url.slice(1) : doc.url;
        const filePath = join(process.cwd(), "public", relativePath);

        const pdfBytes = await readFile(filePath);
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const pdfBytes = await mergedPdf.save();

    // Save new file
    const uploadDir = join(process.cwd(), "public", "uploads");
    const fileName = `merged-${Date.now()}.pdf`;
    const filePath = join(uploadDir, fileName);
    const publicUrl = `/uploads/${fileName}`;

    await writeFile(filePath, pdfBytes);

    // Create new document record
    await prisma.document.create({
        data: {
            name: "Merged Document.pdf",
            url: publicUrl,
            size: pdfBytes.length,
            type: "PDF",
            userId: userId,
            status: "UPLOADED",
            category: documents[0].category // Inherit category from first
        }
    });

    revalidatePath("/documents");
}

export async function splitDocument(documentId: string) {
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc || doc.type !== "PDF") throw new Error("Document not found or not PDF");

    const relativePath = doc.url.startsWith("/") ? doc.url.slice(1) : doc.url;
    const filePath = join(process.cwd(), "public", relativePath);

    const pdfBytes = await readFile(filePath);
    const pdf = await PDFDocument.load(pdfBytes);
    const numPages = pdf.getPageCount();

    if (numPages <= 1) throw new Error("Document has only 1 page");

    const uploadDir = join(process.cwd(), "public", "uploads");

    for (let i = 0; i < numPages; i++) {
        const subPdf = await PDFDocument.create();
        const [page] = await subPdf.copyPages(pdf, [i]);
        subPdf.addPage(page);
        const subBytes = await subPdf.save();

        const fileName = `split-${doc.name}-${i + 1}-${Date.now()}.pdf`;
        const subFilePath = join(uploadDir, fileName);
        await writeFile(subFilePath, subBytes);

        await prisma.document.create({
            data: {
                name: `${doc.name} - Page ${i + 1}`,
                url: `/uploads/${fileName}`,
                size: subBytes.length,
                type: "PDF",
                userId: doc.userId,
                status: "UPLOADED",
                category: doc.category
            }
        });
    }

    revalidatePath("/documents");
}

export async function getDocuments(category?: string, status?: string) {
    const whereClause: any = {
        status: { not: "DELETED" }
    };
    if (category && category !== "ALL") {
        whereClause.category = category;
    }
    if (status && status !== "ALL") {
        whereClause.status = status;
    }

    return await prisma.document.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { invoices: true },
            },
            invoices: {
                take: 1,
                orderBy: { createdAt: "desc" }
            }
        },
    });
}

export async function getDeletedDocuments() {
    return await prisma.document.findMany({
        where: { status: "DELETED" },
        orderBy: { updatedAt: "desc" }, // Most recently deleted first
        include: {
            invoices: {
                take: 1,
                orderBy: { createdAt: "desc" }
            }
        }
    });
}

// Soft delete
export async function softDeleteDocument(id: string) {
    await prisma.document.update({
        where: { id },
        data: {
            status: "DELETED",
            deletedAt: new Date()
        },
    });
    revalidatePath("/documents");
    revalidatePath("/dashboard");
    revalidatePath("/recycle-bin");
}

// Restore from recycle bin
export async function restoreDocument(id: string) {
    await prisma.document.update({
        where: { id },
        data: {
            status: "UPLOADED", // Or previous status if we tracked it, but UPLOADED is safe
            deletedAt: null
        },
    });
    revalidatePath("/documents");
    revalidatePath("/dashboard");
    revalidatePath("/recycle-bin");
}

// Permanent delete
export async function permanentDeleteDocument(id: string) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) return;

    // Delete file from disk
    const relativePath = doc.url.startsWith("/") ? doc.url.slice(1) : doc.url;
    const filePath = join(process.cwd(), "public", relativePath);
    try {
        await unlink(filePath);
    } catch (e) {
        console.error("Failed to delete file:", e);
    }

    // Delete invoices first to avoid relation errors (if not cascaded)
    await prisma.invoice.deleteMany({ where: { documentId: id } });
    await prisma.document.delete({ where: { id } });

    revalidatePath("/recycle-bin");
}

export async function saveInvoice(data: {
    documentId: string;
    type: string;
    invoiceNumber: string;
    date: string;
    dueDate?: string;
    supplierName?: string;
    customerName?: string;
    subTotal: number;
    taxTotal: number;
    totalAmount: number;
    paymentMethod?: string;
    baseCurrencyAmount?: number;
    exchangeRate?: number;
    notes?: string;
    lineItems: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }>;
}) {
    const invoice = await prisma.invoice.create({
        data: {
            documentId: data.documentId,
            type: data.type,
            invoiceNumber: data.invoiceNumber,
            date: new Date(data.date),
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            supplierName: data.supplierName,
            customerName: data.customerName,
            subTotal: data.subTotal,
            taxTotal: data.taxTotal,
            totalAmount: data.totalAmount,
            paymentMethod: data.paymentMethod,
            baseCurrencyAmount: data.baseCurrencyAmount,
            exchangeRate: data.exchangeRate,
            status: "SAVED",
            items: {
                create: data.lineItems,
            },
        },
    });

    // Update document status to PROCESSING
    await prisma.document.update({
        where: { id: data.documentId },
        data: { status: "PROCESSING" },
    });

    revalidatePath("/documents");
    revalidatePath("/dashboard");
    revalidatePath(`/documents/${data.documentId}/process`);

    return invoice;
}

export async function updateDocumentStatus(id: string, status: string) {
    await prisma.document.update({
        where: { id },
        data: { status },
    });

    revalidatePath("/documents");
    revalidatePath("/dashboard");
    revalidatePath(`/documents/${id}/process`);
}

export async function updateDocumentCategory(id: string, category: string) {
    await prisma.document.update({
        where: { id },
        data: { category },
    });
    revalidatePath("/documents");
}

export async function updateInvoicePaymentMethod(invoiceId: string, paymentMethod: string) {
    await prisma.invoice.update({
        where: { id: invoiceId },
        data: { paymentMethod },
    });
    revalidatePath("/documents");
}

export async function getInvoicesByDocument(documentId: string) {
    return await prisma.invoice.findMany({
        where: { documentId },
        include: {
            items: true,
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function exportInvoicesToCSV() {
    const invoices = await prisma.invoice.findMany({
        include: {
            items: true,
            document: true,
        },
        orderBy: { createdAt: "desc" },
    });

    // Create CSV header
    const headers = [
        "Invoice Number",
        "Type",
        "Date",
        "Supplier/Customer",
        "Subtotal",
        "Tax",
        "Total",
        "Currency",
        "Status",
        "Document",
        "Line Items",
    ];

    // Create CSV rows
    const rows = invoices.map((inv) => {
        const party = inv.type === "PURCHASE" ? inv.supplierName : inv.customerName;
        const lineItems = inv.items
            .map((item) => `${item.description} (${item.quantity} x $${item.unitPrice})`)
            .join("; ");

        return [
            inv.invoiceNumber || "",
            inv.type,
            inv.date?.toLocaleDateString() || "",
            party || "",
            inv.subTotal?.toFixed(2) || "0.00",
            inv.taxTotal?.toFixed(2) || "0.00",
            inv.totalAmount?.toFixed(2) || "0.00",
            inv.currency,
            inv.status,
            inv.document.name,
            lineItems,
        ];
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    return csvContent;
}

export async function getDashboardStats() {
    const totalDocs = await prisma.document.count({ where: { status: { not: "DELETED" } } });
    const processing = await prisma.document.count({ where: { status: "PROCESSING" } });
    const completed = await prisma.document.count({ where: { status: "COMPLETED" } });
    const uploaded = await prisma.document.count({ where: { status: "UPLOADED" } });

    // Mock data for graphs and other widgets until real data is available
    const expenses = [
        { month: 'Jan', amount: 4000 },
        { month: 'Feb', amount: 3000 },
        { month: 'Mar', amount: 2000 },
        { month: 'Apr', amount: 2780 },
        { month: 'May', amount: 1890 },
        { month: 'Jun', amount: 2390 },
        { month: 'Jul', amount: 3490 },
    ];

    const processingInvoices = await prisma.document.count({
        where: {
            status: "PROCESSING",
            // In future, filter by document type if we distinguish Invoice vs Bank Statement at Upload
        }
    });

    return {
        documents: {
            total: totalDocs,
            processing: processing,
            completed: completed,
            uploaded: uploaded,
        },
        invoicesReceipts: {
            processing: processingInvoices, // Using same for now
            ready: completed
        },
        bankStatements: {
            processing: 0, // Mock
            ready: 0
        },
        expenses: expenses
    };
}

export async function getBankStatements(status?: string) {
    const whereClause: any = {
        category: { in: ["STATEMENT", "BANK_STATEMENT", "CARD_STATEMENT"] }, // Flexible check
        status: { not: "DELETED" }
    };
    if (status && status !== "ALL") {
        whereClause.status = status; // This status is on the Document model for high level
    }

    return await prisma.document.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        include: {
            bankStatement: true
        }
    });
}

export async function updateBankStatementMetadata(documentId: string, data: {
    displayName?: string;
    accountInfo?: string;
    last4Digits?: string;
    startDate?: string;
    endDate?: string;
}) {
    // Upsert the bank statement record
    await prisma.bankStatement.upsert({
        where: { documentId },
        create: {
            documentId,
            displayName: data.displayName,
            accountInfo: data.accountInfo,
            last4Digits: data.last4Digits,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            endDate: data.endDate ? new Date(data.endDate) : undefined,
        },
        update: {
            displayName: data.displayName,
            accountInfo: data.accountInfo,
            last4Digits: data.last4Digits,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            endDate: data.endDate ? new Date(data.endDate) : undefined,
        }
    });
    revalidatePath("/bank-statements");
}

/* OTHER DOCUMENTS & TAGGING ACTIONS */

export async function getOtherDocuments() {
    return await prisma.document.findMany({
        where: {
            category: "OTHER",
            status: { not: "DELETED" }
        },
        orderBy: { createdAt: "desc" },
        include: {
            tags: true
        }
    });
}

export async function addTag(documentId: string, tagName: string) {
    // Ensure tag exists or create it
    const tag = await prisma.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName }
    });

    // Connect tag to document
    await prisma.document.update({
        where: { id: documentId },
        data: {
            tags: {
                connect: { id: tag.id }
            }
        }
    });

    revalidatePath("/other-documents");
}

export async function removeTag(documentId: string, tagId: string) {
    await prisma.document.update({
        where: { id: documentId },
        data: {
            tags: {
                disconnect: { id: tagId }
            }
        }
    });
    revalidatePath("/other-documents");
}

export async function updateDocumentDetails(documentId: string, data: { status?: string, notes?: string, type?: string }) {
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    // If type is updated, we might be changing category? 
    // The requirement says "Document Type Selector ... Must consist of defined types".
    // If user changes type to "Invoice", it might technically cease to be an "Other Document".
    // For now, let's assume it updates the `category` field if it maps to one, or just keeps it as is.
    if (data.type) {
        // Map display type to internal category if needed
        if (data.type === "Invoice & Receipt") updateData.category = "GENERAL"; // or whatever default
        else if (data.type === "Bank Statement") updateData.category = "STATEMENT";
        // else keep 'OTHER' or specific sub-type
    }

    await prisma.document.update({
        where: { id: documentId },
        data: updateData
    });
    revalidatePath("/other-documents");
}

export async function searchTags(query: string) {
    if (!query) return [];
    return await prisma.tag.findMany({
        where: {
            name: { contains: query }
        },
        take: 10
    });
}

export async function getUploadHistory(page: number = 1, limit: number = 25, search?: string) {
    const whereClause: any = {
        // We want ALL statuses, including DELETED and UPLOADED, so no default filter
    };

    if (search) {
        whereClause.name = { contains: search };
    }

    const [documents, total] = await Promise.all([
        prisma.document.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        }),
        prisma.document.count({ where: whereClause })
    ]);

    return {
        documents,
        pagination: {
            total,
            pages: Math.ceil(total / limit),
            current: page,
            limit
        }
    };
}

/* -------------------------------------------------------------------------- */
/*                          USER & ROLE MANAGEMENT                            */
/* -------------------------------------------------------------------------- */

// --- USERS ---

export async function getUsers(search?: string) {
    const where: any = {};
    if (search) {
        where.OR = [
            { name: { contains: search } },
            { email: { contains: search } }
        ];
    }

    return await prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
            customRole: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
    });
}

export async function createUser(data: {
    name: string;
    email: string;
    password: string;
    role: string;          // "ADMIN", "CLIENT", or "CUSTOM"
    customRoleId?: string; // If role is "CUSTOM"
    status?: string;       // "ACTIVE" or "INACTIVE"
    sendWelcomeEmail?: boolean;
}) {
    // Check if email exists
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
        throw new Error("Email already exists");
    }

    // Hash password
    const hashedPassword = await hash(data.password, 12);

    // Determines generic role field
    let genericRole = "SUBMITTER"; // Default
    if (data.role === "ADMIN") genericRole = "ADMIN";
    // For now, let's stick to existing schema values: SUBMITTER, APPROVER, ADMIN.

    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: genericRole,
            customRoleId: data.customRoleId || null,
            status: data.status || "ACTIVE",
            integrationStatus: "NONE"
        }
    });

    revalidatePath("/users");
    return user;
}

export async function updateUser(userId: string, data: {
    name?: string;
    email?: string;
    role?: string;
    customRoleId?: string;
    status?: string;
    password?: string;
}) {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.status) updateData.status = data.status;
    if (data.password) updateData.password = await hash(data.password, 12);

    if (data.role) {
        if (data.role === "ADMIN") {
            updateData.role = "ADMIN";
            updateData.customRoleId = null;
        } else if (data.role === "CLIENT") {
            updateData.role = "SUBMITTER";
            updateData.customRoleId = null;
        } else {
            // Custom role
            updateData.role = "SUBMITTER"; // Base access
            if (data.customRoleId) updateData.customRoleId = data.customRoleId;
        }
    }

    await prisma.user.update({
        where: { id: userId },
        data: updateData
    });
    revalidatePath("/users");
}

export async function toggleUserStatus(userId: string, status: string) {
    await prisma.user.update({
        where: { id: userId },
        data: { status }
    });
    revalidatePath("/users");
}

// --- ROLES ---

export async function getRoles() {
    return await prisma.role.findMany({
        orderBy: { name: "asc" }
    });
}

export async function createRole(name: string, permissions: string[]) {
    // Verify unique name
    const existing = await prisma.role.findUnique({ where: { name } });
    if (existing) throw new Error("Role name already exists");

    await prisma.role.create({
        data: {
            name,
            permissions: JSON.stringify(permissions) // Store Key[] as JSON
        }
    });
    revalidatePath("/roles");
}

export async function updateRole(roleId: string, permissions: string[]) {
    await prisma.role.update({
        where: { id: roleId },
        data: {
            permissions: JSON.stringify(permissions)
        }
    });
    revalidatePath("/roles");
}

export async function deleteRole(roleId: string) {
    // Check usage
    const usage = await prisma.user.count({ where: { customRoleId: roleId } });
    if (usage > 0) throw new Error("Cannot delete role assigned to users");

    await prisma.role.delete({ where: { id: roleId } });
    revalidatePath("/roles");
}
