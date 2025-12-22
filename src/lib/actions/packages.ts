"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPackages() {
    return await prisma.package.findMany({
        orderBy: { price: 'asc' }
    });
}

export async function createPackage(data: {
    name: string;
    price: number;
    monthlyCredits: number;
    description?: string;
}) {
    await prisma.package.create({
        data
    });
    revalidatePath("/super-admin/packages");
}

export async function updatePackage(id: string, data: {
    name?: string;
    price?: number;
    monthlyCredits?: number;
    description?: string;
}) {
    await prisma.package.update({
        where: { id },
        data
    });
    revalidatePath("/super-admin/packages");
}

export async function deletePackage(id: string) {
    // Check usage
    const count = await prisma.subscription.count({ where: { packageId: id } });
    if (count > 0) throw new Error("Cannot delete package in use");

    await prisma.package.delete({ where: { id } });
    revalidatePath("/super-admin/packages");
}
