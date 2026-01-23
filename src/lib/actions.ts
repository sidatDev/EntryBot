"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PDFDocument } from "pdf-lib";
import { hash } from "bcryptjs";
import { uploadToS3, deleteFromS3, getFileBufferFromS3, getPresignedUrl } from "./s3";
import { hasCredits, deductCredits } from "@/lib/billing";
import { shouldFlagForQA } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/* -------------------------------------------------------------------------- */
/*                                AUTH ACTIONS                                */
/* -------------------------------------------------------------------------- */

export async function registerUser(name: string, email: string, passwordHash: string) {
    if (!name || !email || !passwordHash) {
        return { success: false, error: "Missing required fields" };
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return { success: false, error: "User already exists with this email" };
    }

    try {
        const hashedPassword = await hash(passwordHash, 10);

        // Create new user with CLIENT role
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash: hashedPassword,
                role: "CLIENT", // Force CLIENT role for self-signup
                status: "ACTIVE",
            },
        });

        return { success: true, userId: newUser.id };
    } catch (error) {
        console.error("REGISTRATION ERROR:", error);
        return { success: false, error: "Failed to create account" };
    }
}

export async function uploadDocument(formData: FormData) {
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    const category = (formData.get("category") as string) || "GENERAL";

    console.log("UPLOAD STARTED:", file?.name, userId);

    if (!file || !userId) {
        console.error("UPLOAD ERROR: Missing file or userId");
        throw new Error("Missing file or userId");
    }

    // Basic validation
    if (file.size > 10 * 1024 * 1024) throw new Error("File size limit is 10MB");
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) throw new Error("Invalid file type");

    // BILLING: Check if user's organization has credits
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true, role: true }
    });
    if (!user) throw new Error("User not found");

    if (user.organizationId && user.role !== "ADMIN") {
        // We block upload if 0 credits. Alternatively, we could block only at "Processing" stage.
        // Decision: Block at Upload to prevent storage spam from free/expired accounts.
        // Admins are exempt from credit checks.
        const canUpload = await hasCredits(user.organizationId);
        if (!canUpload) {
            throw new Error("Insufficient credits. Please upgrade your plan.");
        }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const publicUrl = await uploadToS3(buffer, file.name, file.type);

    // Create DB Record
    await prisma.document.create({
        data: {
            name: file.name,
            url: publicUrl,
            size: file.size,
            type: file.type === "application/pdf" ? "PDF" : "IMAGE",
            uploaderId: userId,
            status: "UPLOADED",
            category: category,
            source: "UPLOAD",
            organizationId: user.organizationId
        }
    });

    revalidatePath("/documents");
}

/* -------------------------------------------------------------------------- */
/*                            DOCUMENT OPERATIONS                             */
/* -------------------------------------------------------------------------- */

export async function deleteDocument(id: string) {
    // Determine if we should soft delete or hard delete. For now, let's just Soft Delete by default
    // or we can implement Recycle Bin logic. 
    // Requirement says "Recycle Bin", so "delete" means move to bin.
    await softDeleteDocument(id);
}

// See softDeleteDocument below

export async function processDocument(formData: FormData) {
    // This is essentially "Save Invoice" but triggered from a different context? 
    // Usually the InvoiceForm handles the saving via saveInvoice action.
    // This might be for background processing or automated extraction start.
    // For now, assume this is unused or legacy placeholder.
}

export async function mergeDocuments(documentIds: string[], userId: string) {
    if (documentIds.length < 2) throw new Error("Need at least 2 documents to merge");

    const documents = await prisma.document.findMany({
        where: {
            id: { in: documentIds },
            uploaderId: userId,
            type: "PDF",
            status: { not: "DELETED" }
        }
    });

    if (documents.length !== documentIds.length) throw new Error("Some documents not found or not PDFs");

    const mergedPdf = await PDFDocument.create();

    for (const doc of documents) {
        // Fetch from S3 instead of local FS
        const pdfBytes = await getFileBufferFromS3(doc.url);
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const pdfBytes = await mergedPdf.save();
    const buffer = Buffer.from(pdfBytes);

    // Upload merged file to S3
    const publicUrl = await uploadToS3(buffer, "Merged Document.pdf", "application/pdf");

    // Create new document record
    await prisma.document.create({
        data: {
            name: "Merged Document.pdf",
            url: publicUrl,
            size: pdfBytes.length,
            type: "PDF",
            uploaderId: userId,
            status: "UPLOADED",
            category: documents[0].category,
            source: "MERGE_OPERATION"
        }
    });

    revalidatePath("/documents");
}

export async function splitDocument(documentId: string) {
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc || doc.type !== "PDF") throw new Error("Document not found or not PDF");

    const pdfBytes = await getFileBufferFromS3(doc.url);
    const pdf = await PDFDocument.load(pdfBytes);
    const numPages = pdf.getPageCount();

    if (numPages <= 1) throw new Error("Document has only 1 page");

    for (let i = 0; i < numPages; i++) {
        const subPdf = await PDFDocument.create();
        const [page] = await subPdf.copyPages(pdf, [i]);
        subPdf.addPage(page);
        const subBytes = await subPdf.save();
        const buffer = Buffer.from(subBytes);

        const fileName = `${doc.name} - Page ${i + 1}`;
        const publicUrl = await uploadToS3(buffer, `${fileName}.pdf`, "application/pdf");

        await prisma.document.create({
            data: {
                name: fileName,
                url: publicUrl,
                size: subBytes.length,
                type: "PDF",
                uploaderId: doc.uploaderId,
                status: "UPLOADED",
                category: doc.category,
                source: "SPLIT_OPERATION"
            }
        });
    }

    revalidatePath("/documents");
}

export async function getDocumentMetadata(documentId: string) {
    const session = await getServerSession(authOptions);
    const userFn = session?.user;

    const doc = await prisma.document.findUnique({
        where: { id: documentId },
        select: {
            id: true,
            name: true,
            status: true,
            category: true,
            type: true,
            createdAt: true,
            url: true, // Need URL for double check
            uploaderId: true, // Need for check
            assignedToId: true,
            user: {
                select: { name: true }
            },
            bankStatement: true,
            identityCard: true // Allow fetching relation
        }
    });

    if (!doc) return null;

    // ISOLATION CHECK
    if (userFn && userFn.role !== "ADMIN" && userFn.role !== "MANAGER") {
        const canAccess =
            doc.uploaderId === userFn.id ||
            (userFn.role === "ENTRY_OPERATOR" && (doc.assignedToId === userFn.id || doc.assignedToId === null)); // Operator assigned or unassigned (preview)

        if (!canAccess) {
            console.error(`Unauthorized access attempt by ${userFn.email} on doc ${documentId}`);
            return null;
        }
    }

    // Generate signed URL
    const signedUrl = await getPresignedUrl(doc.url);

    return { ...doc, url: signedUrl };
}

// --- DOCUMENTS ---

export async function getDocuments(category?: string, status?: string, assignedToId?: string, unassigned?: boolean) {
    const session = await getServerSession(authOptions);
    const userFn = session?.user;

    const where: any = {
        deletedAt: null,
    };

    // ISOLATION: 
    if (userFn?.role === "ENTRY_OPERATOR") {
        // OPERATOR VIEW: See Unassigned (Pool) + Assigned to Me (Queue) + (Maybe my uploads if any)
        // We use OR logic here. Since Prisma doesn't support complex OR at top level easily without full condition,
        // we can conditionally build the filter.
        // Actually, we can use OR.
        where.OR = [
            { assignedToId: null },
            { assignedToId: userFn.id }
        ];
        // If specific status/category query conflicts, Prisma handles AND automatically with explicit fields.
        // But wait, if they pass `unassigned=true` (assignedToId: null), it fits.
        // If they pass `assignedToId=me`, it fits.
        // If they pass NOTHING (Dashboard/List), they get Pool + Queue.
    } else if (userFn && userFn.role !== "ADMIN" && userFn.role !== "MANAGER") {
        // CLIENT/EMPLOYEE: Restrict to own documents
        where.uploaderId = userFn.id;
    }

    // Filter by category if provided

    if (category === "SALES_INVOICE") {
        where.category = "SALES_INVOICE";
    } else if (category === "PURCHASE_INVOICE") {
        where.category = "PURCHASE_INVOICE";
    }

    // Filter by status if provided
    if (status) {
        where.status = status;
    }

    // Filter by assignee
    if (assignedToId) {
        where.assignedToId = assignedToId;
    } else if (unassigned) {
        where.assignedToId = null;
    }

    return await prisma.document.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            url: true,
            type: true,
            size: true,
            status: true,
            approvalStatus: true,
            rejectionReason: true,
            category: true,
            source: true,
            createdAt: true,
            updatedAt: true,
            uploaderId: true,
            assignedToId: true,
            organizationId: true,
            invoices: {
                take: 1,
                orderBy: { createdAt: "desc" }
            },
            bankStatement: true,
            identityCard: true,
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

    // Delete file from S3
    await deleteFromS3(doc.url);

    // Delete all related records first to avoid foreign key constraint violations
    await prisma.invoice.deleteMany({ where: { documentId: id } });
    await prisma.bankStatement.deleteMany({ where: { documentId: id } });
    await prisma.identityCard.deleteMany({ where: { documentId: id } });

    // Now safe to delete the document
    await prisma.document.delete({ where: { id } });

    revalidatePath("/recycle-bin");
}

/* -------------------------------------------------------------------------- */
/*                           BATCH DELETE FUNCTIONS                           */
/* -------------------------------------------------------------------------- */

// Batch soft delete for better performance when deleting multiple documents
export async function batchSoftDeleteDocuments(ids: string[]) {
    for (const id of ids) {
        await prisma.document.update({
            where: { id },
            data: {
                status: "DELETED",
                deletedAt: new Date()
            }
        });
    }
    // Only revalidate once after all deletions
    revalidatePath("/documents");
    revalidatePath("/dashboard");
}

// Batch permanent delete for better performance when deleting multiple documents
export async function batchPermanentDeleteDocuments(ids: string[]) {
    for (const id of ids) {
        const doc = await prisma.document.findUnique({ where: { id } });
        if (!doc) continue;

        // Delete file from S3
        await deleteFromS3(doc.url);

        // Delete all related records
        await prisma.invoice.deleteMany({ where: { documentId: id } });
        await prisma.bankStatement.deleteMany({ where: { documentId: id } });
        await prisma.identityCard.deleteMany({ where: { documentId: id } });

        // Delete the document
        await prisma.document.delete({ where: { id } });
    }
    // Only revalidate once after all deletions
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
    vatRate?: number;
    notes?: string;
    currency?: string;
    // New Fields
    invoiceCurrency?: string;
    baseSubTotal?: number;
    baseTaxTotal?: number;
    baseVatRate?: number;

    lineItems: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }>;
}) {
    // Check if invoice already exists for this document (One-to-One logic for "Entry" flow)
    const existingInvoice = await prisma.invoice.findFirst({
        where: { documentId: data.documentId },
        orderBy: { createdAt: "desc" }
    });

    let invoice;

    const commonData = {
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

        // New & Updated Mappings
        exchangeRate: data.exchangeRate,
        vatRate: data.vatRate,
        currency: data.currency || "USD",

        invoiceCurrency: data.invoiceCurrency || "USD",
        baseSubTotal: data.baseSubTotal,
        baseTaxTotal: data.baseTaxTotal,
        baseVatRate: data.baseVatRate,
        baseCurrencyAmount: data.baseCurrencyAmount,

        notes: data.notes,
        status: "SAVED",
    };

    if (existingInvoice) {
        // UPDATE EXISTING
        invoice = await prisma.invoice.update({
            where: { id: existingInvoice.id },
            data: {
                ...commonData,
                items: {
                    deleteMany: {}, // Remove all existing items
                    create: data.lineItems, // Re-create new state
                },
            },
        });
    } else {
        // CREATE NEW
        invoice = await prisma.invoice.create({
            data: {
                ...commonData,
                documentId: data.documentId,
                items: {
                    create: data.lineItems,
                },
            },
        });
    }

    // BILLING: Deduct Credit (Only if creating new? Or updates too? Assuming per Document processing)
    // Generally, "Processing" consumes credit. "Saving" is user editing.
    // If we only charge exactly ONCE per document, check if we already deducted.

    // We only deduct if doc was NOT already processed/completed.
    const doc = await prisma.document.findUnique({ where: { id: data.documentId }, select: { organizationId: true, status: true } });

    // Only deduct credit if status is UPLOADED or PENDING (first time save)
    // If status is "SAVED", "COMPLETED", "QA_REVIEW" etc we assume credit already used.
    if (doc?.organizationId && (doc.status === "UPLOADED" || doc.status === "PENDING")) {
        try {
            await deductCredits(doc.organizationId, 1);
        } catch (e) {
            console.error("Billing error:", e);
        }
    }

    // QA SAMPLING: 10% chance (Only on first completion?)
    // If we are updating, we keep previous status unless it was just uploaded
    let nextStatus = doc?.status;
    if (doc?.status === "UPLOADED" || doc?.status === "PENDING" || doc?.status === "PROCESSING") {
        const isQA = shouldFlagForQA(10);
        nextStatus = isQA ? "QA_REVIEW" : "COMPLETED";
    } else {
        // If already Completed/Saved, we stick to COMPLETED or SAVED unless review forces otherwise
        // Use COMPLETED as default "Done" state for updates
        nextStatus = "COMPLETED";
    }

    // Update document status
    await prisma.document.update({
        where: { id: data.documentId },
        data: {
            status: nextStatus
        },
    });

    revalidatePath("/documents");
    revalidatePath("/dashboard");
    revalidatePath(`/documents/${data.documentId}/process`);

    return invoice;
}

export async function getLatestInvoiceByDocument(documentId: string) {
    const invoice = await prisma.invoice.findFirst({
        where: { documentId: documentId },
        orderBy: { createdAt: "desc" },
        include: {
            items: true
        }
    });

    if (!invoice) return null;

    // Transform relation 'items' to 'lineItems' format if needed or pass as is
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

export async function updateApprovalStatus(id: string, status: string, reason?: string) {
    await prisma.document.update({
        where: { id },
        data: {
            approvalStatus: status,
            rejectionReason: status === "DENIED" ? reason : null
        },
    });

    revalidatePath("/documents");
    revalidatePath("/dashboard");
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

export async function assignDocumentToMe(documentId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    await prisma.document.update({
        where: { id: documentId },
        data: {
            assignedToId: session.user.id,
            status: "PROCESSING" // Automatically lock/start processing behavior?
        }
    });
    revalidatePath("/documents");
}

export async function bulkApproveDocuments(documentIds: string[]) {
    await prisma.document.updateMany({
        where: { id: { in: documentIds } },
        data: { approvalStatus: "APPROVED" }
    });
    revalidatePath("/documents");
}

export async function bulkUpdateDocuments(documentIds: string[], data: { category?: string, paymentMethod?: string }) {
    if (data.category) {
        await prisma.document.updateMany({
            where: { id: { in: documentIds } },
            data: { category: data.category }
        });
    }

    if (data.paymentMethod) {
        // Payment Method is on Invoice model, so we need to find invoices linked to these docs
        const documents = await prisma.document.findMany({
            where: { id: { in: documentIds } },
            include: { invoices: { select: { id: true } } }
        });

        const invoiceIds = documents.flatMap(d => d.invoices.map(i => i.id));

        if (invoiceIds.length > 0) {
            await prisma.invoice.updateMany({
                where: { id: { in: invoiceIds } },
                data: { paymentMethod: data.paymentMethod }
            });
        }
    }
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

export async function exportInvoicesToCSV(documentIds?: string[]) {
    const where: any = {
        status: { not: "DELETED" }
    };

    if (documentIds && documentIds.length > 0) {
        where.id = { in: documentIds };
    }

    const documents = await prisma.document.findMany({
        where,
        include: {
            invoices: {
                include: { items: true },
                take: 1,
                orderBy: { createdAt: "desc" }
            }
        },
        orderBy: { createdAt: "desc" },
    });

    // Create CSV header
    const headers = [
        "Document Name",
        "Document Type",
        "Category",
        "Upload Date",
        "Invoice Number",
        "Type",
        "Date",
        "Supplier/Customer",
        "Subtotal",
        "Tax",
        "Total",
        "Currency",
        "Status",
        "Line Items",
    ];

    // Create CSV rows
    const rows = documents.map((doc) => {
        const inv = doc.invoices?.[0]; // Get the latest invoice if exists

        // Fields from Invoice (or "-")
        const invNumber = inv?.invoiceNumber || "-";
        const type = inv?.type || "-";
        const date = inv?.date ? inv.date.toLocaleDateString() : "-";
        const party = inv ? (inv.type === "PURCHASE" ? inv.supplierName : inv.customerName) : "-";
        const subTotal = inv?.subTotal?.toFixed(2) || "-";
        const taxTotal = inv?.taxTotal?.toFixed(2) || "-";
        const total = inv?.totalAmount?.toFixed(2) || "-";
        const currency = inv?.currency || "-";
        const status = doc.status; // Use Document status as it's the master status

        const lineItems = inv?.items
            ? inv.items.map((item) => `${item.description} (${item.quantity} x ${item.unitPrice})`).join("; ")
            : "-";

        return [
            doc.name,
            doc.type,
            doc.category,
            doc.createdAt.toLocaleDateString(),
            invNumber,
            type,
            date,
            party || "-",
            subTotal,
            taxTotal,
            total,
            currency,
            status,
            lineItems,
        ];
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    return csvContent;
}

export async function getDashboardStats() {
    const session = await getServerSession(authOptions);
    const userFn = session?.user;

    const where: any = { status: { not: "DELETED" } };

    // ISOLATION
    if (userFn && userFn.role !== "ADMIN" && userFn.role !== "MANAGER") {
        where.uploaderId = userFn.id;
    }

    const totalDocs = await prisma.document.count({ where });
    const processing = await prisma.document.count({ where: { ...where, status: "PROCESSING" } });
    const completed = await prisma.document.count({ where: { ...where, status: "COMPLETED" } });
    const uploaded = await prisma.document.count({ where: { ...where, status: "UPLOADED" } });

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
            ...where,
            status: "PROCESSING",
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
            processing: processingInvoices,
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
    const session = await getServerSession(authOptions);
    const userFn = session?.user;

    const whereClause: any = {
        category: { in: ["STATEMENT", "BANK_STATEMENT", "CARD_STATEMENT"] }, // Flexible check
        status: { not: "DELETED" }
    };

    // ISOLATION
    if (userFn?.role === "ENTRY_OPERATOR") {
        whereClause.OR = [
            { assignedToId: null },
            { assignedToId: userFn.id }
        ];
    } else if (userFn && userFn.role !== "ADMIN" && userFn.role !== "MANAGER") {
        whereClause.uploaderId = userFn.id;
    }

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
            accountTitle: data.accountInfo,
            accountNumber: data.last4Digits,
            fromDate: data.startDate ? new Date(data.startDate) : undefined,
            toDate: data.endDate ? new Date(data.endDate) : undefined,
        },
        update: {
            accountTitle: data.accountInfo,
            accountNumber: data.last4Digits,
            fromDate: data.startDate ? new Date(data.startDate) : undefined,
            toDate: data.endDate ? new Date(data.endDate) : undefined,
        }
    });
    revalidatePath("/bank-statements");
}

/* OTHER DOCUMENTS & TAGGING ACTIONS */

export async function getOtherDocuments() {
    const session = await getServerSession(authOptions);
    const userFn = session?.user;

    const where: any = {
        category: "OTHER",
        status: { not: "DELETED" }
    };

    // ISOLATION
    if (userFn && userFn.role !== "ADMIN" && userFn.role !== "MANAGER") {
        where.uploaderId = userFn.id;
    }

    return await prisma.document.findMany({
        where,
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
    const session = await getServerSession(authOptions);
    const userFn = session?.user;

    const whereClause: any = {
        // We want ALL statuses, including DELETED and UPLOADED, so no default filter
    };

    // ISOLATION
    if (userFn && userFn.role !== "ADMIN" && userFn.role !== "MANAGER") {
        whereClause.uploaderId = userFn.id;
    }

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
            },
            organization: {
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
    organizationId?: string; // Optional organization assignment
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
            passwordHash: hashedPassword,
            role: genericRole,
            status: data.status || "ACTIVE",
            // Use connect syntax to avoid 'Unknown argument' scalar errors if client is stale
            ...(data.customRoleId ? { customRole: { connect: { id: data.customRoleId } } } : {}),
            ...(data.organizationId ? { organization: { connect: { id: data.organizationId } } } : {})
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
    organizationId?: string;
    status?: string;
    password?: string;
}) {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.status) updateData.status = data.status;
    if (data.organizationId !== undefined) updateData.organizationId = data.organizationId;
    if (data.organizationId !== undefined) updateData.organizationId = data.organizationId;
    if (data.password) updateData.passwordHash = await hash(data.password, 12);

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

// --- BANK STATEMENTS ---

export async function saveBankStatement(data: {
    documentId: string;
    accountTitle?: string;
    accountNumber?: string;
    iban?: string;
    currency?: string;
    address?: string;
    fromDate?: string;
    toDate?: string;
    openingBalance?: number;
    closingBalance?: number;
    transactions: {
        bookingDate?: string;
        description?: string;
        credit?: number;
        debit?: number;
        availableBalance?: number;
    }[];
}) {
    // 1. Delete existing if exists (simple way to update/overwrite)
    // Or upsert? define unique constraint on documentId
    // The schema says documentId @unique

    // Check if exists
    const existing = await prisma.bankStatement.findUnique({
        where: { documentId: data.documentId }
    });

    const statementData = {
        accountTitle: data.accountTitle,
        accountNumber: data.accountNumber,
        iban: data.iban,
        currency: data.currency || "USD",
        address: data.address,
        fromDate: data.fromDate ? new Date(data.fromDate) : null,
        toDate: data.toDate ? new Date(data.toDate) : null,
        openingBalance: data.openingBalance,
        closingBalance: data.closingBalance,
        transactions: {
            create: data.transactions.map(t => ({
                bookingDate: t.bookingDate ? new Date(t.bookingDate) : null,
                description: t.description,
                credit: t.credit,
                debit: t.debit,
                availableBalance: t.availableBalance
            }))
        }
    };

    if (existing) {
        // Update: Delete all transactions and recreate (simplest for full form save)
        await prisma.bankTransaction.deleteMany({
            where: { bankStatementId: existing.id }
        });

        await prisma.bankStatement.update({
            where: { id: existing.id },
            data: statementData
        });
    } else {
        await prisma.bankStatement.create({
            data: {
                documentId: data.documentId,
                ...statementData
            }
        });
    }

    // Update document status
    await prisma.document.update({
        where: { id: data.documentId },
        data: { status: "COMPLETED" }
    });

    revalidatePath(`/documents/${data.documentId}/process`);
    revalidatePath("/documents");
}

export async function getUsersByRole(role: string) {
    const session = await getServerSession(authOptions);

    // Basic authorization
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
        return [];
    }

    // Map the string role to the Enum if needed, or rely on Prisma to match string
    // Prisma UserRole is an enum. passing string might work if it matches.
    // However, role comes in as string. Open to "ENTRY_OPERATOR".

    // Use 'as any' for role if strict typing issues, or assume valid input.
    // Ideally use: where: { role: role as UserRole }

    const users = await prisma.user.findMany({
        where: {
            role: role as any
        },
        include: {
            assignedDocs: {
                where: { status: "PROCESSING" },
                select: { id: true, name: true, status: true }
            }
        },
        orderBy: { name: 'asc' }
    });

    return users;
}

/* -------------------------------------------------------------------------- */
/*                            EXPENSE REPORTS                                 */
/* -------------------------------------------------------------------------- */

export async function getExpenseReport(
    organizationId: string,
    viewType: "monthly" | "annual" = "annual",
    year?: number,
    month?: number
) {
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;

    // Build date filter based on view type
    let startDate: Date;
    let endDate: Date;

    if (viewType === "monthly") {
        // Get specific month
        startDate = new Date(currentYear, currentMonth - 1, 1);
        endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    } else {
        // Get full year
        startDate = new Date(currentYear, 0, 1);
        endDate = new Date(currentYear, 11, 31, 23, 59, 59);
    }

    // Fetch purchase invoices for the organization
    const invoices = await prisma.invoice.findMany({
        where: {
            document: {
                organizationId: organizationId,
                category: "PURCHASE_INVOICE",
                status: "COMPLETED",
                approvalStatus: "APPROVED",
            },
            date: {
                gte: startDate,
                lte: endDate,
            },
        },
        select: {
            id: true,
            date: true,
            supplierName: true,
            baseCurrencyAmount: true,
            invoiceNumber: true,
            totalAmount: true,
            currency: true,
            createdAt: true,
        },
        orderBy: {
            date: "asc",
        },
    });

    // Calculate totals
    const totalExpenses = invoices.reduce((sum, inv) => sum + (inv.baseCurrencyAmount || 0), 0);

    // Group by month for annual view
    const monthlyBreakdown: { [key: string]: { total: number; count: number; invoices: any[] } } = {};

    if (viewType === "annual") {
        for (let m = 0; m < 12; m++) {
            const monthKey = new Date(currentYear, m, 1).toISOString().slice(0, 7); // YYYY-MM
            monthlyBreakdown[monthKey] = { total: 0, count: 0, invoices: [] };
        }
    }

    invoices.forEach((inv) => {
        const dateToUse = inv.date || inv.createdAt;
        const monthKey = dateToUse.toISOString().slice(0, 7);
        if (!monthlyBreakdown[monthKey]) {
            monthlyBreakdown[monthKey] = { total: 0, count: 0, invoices: [] };
        }
        monthlyBreakdown[monthKey].total += inv.baseCurrencyAmount || 0;
        monthlyBreakdown[monthKey].count += 1;
        monthlyBreakdown[monthKey].invoices.push(inv);
    });

    // Group by supplier
    const supplierBreakdown: { [key: string]: { total: number; count: number } } = {};
    invoices.forEach((inv) => {
        const supplier = inv.supplierName || "Unknown";
        if (!supplierBreakdown[supplier]) {
            supplierBreakdown[supplier] = { total: 0, count: 0 };
        }
        supplierBreakdown[supplier].total += inv.baseCurrencyAmount || 0;
        supplierBreakdown[supplier].count += 1;
    });

    // Sort suppliers by total
    const topSuppliers = Object.entries(supplierBreakdown)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

    return {
        viewType,
        period: viewType === "monthly"
            ? `${new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
            : `${currentYear}`,
        totalExpenses,
        invoiceCount: invoices.length,
        averageInvoice: invoices.length > 0 ? totalExpenses / invoices.length : 0,
        monthlyBreakdown: Object.entries(monthlyBreakdown).map(([month, data]) => ({
            month,
            total: data.total,
            count: data.count,
        })),
        topSuppliers,
        invoices: viewType === "monthly" ? invoices : [], // Include full invoice list for monthly view
    };
}
