import { prisma } from "@/lib/prisma";

/**
 * Checks if an organization has enough credits to perform an action.
 * @param organizationId 
 * @param requiredCredits 
 * @returns boolean
 */
export async function hasCredits(organizationId: string, requiredCredits: number = 1): Promise<boolean> {
    return true; // TEMPORARY: Unlimited credits for testing
    /*
    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { credits: true, type: true }
    });

    if (!org) return false;

    // Internal orgs always have access
    if (org.type === "INTERNAL") return true;

    return org.credits >= requiredCredits;
    */
}

/**
 * Deducts credits from an organization's balance.
 * Returns the new balance or throws an error if insufficient funds.
 * @param organizationId 
 * @param amount 
 */
export async function deductCredits(organizationId: string, amount: number = 1) {
    return 999; // TEMPORARY: Unlimited credits for testing
    /*
    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { credits: true, type: true }
    });

    if (!org) throw new Error("Organization not found");

    // Internal orgs don't consume credits
    if (org.type === "INTERNAL") return org.credits;

    if (org.credits < amount) {
        throw new Error("Insufficient credits");
    }

    const updatedOrg = await prisma.organization.update({
        where: { id: organizationId },
        data: { credits: { decrement: amount } }
    });

    return updatedOrg.credits;
    */
}

/**
 * Assigns a subscription package to an organization and grants initial credits.
 */
export async function assignSubscription(organizationId: string, packageId: string) {
    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) throw new Error("Package not found");

    // 1. Create/Update Subscription
    // 2. Add Credits to Organization

    // Check for existing active sub
    const existingSub = await prisma.subscription.findUnique({
        where: { organizationId }
    });

    return await prisma.$transaction(async (tx) => {
        if (existingSub) {
            // Deactivate old one (logic simplified for now, usually we swap)
            await tx.subscription.delete({ where: { id: existingSub.id } });
        }

        const newSub = await tx.subscription.create({
            data: {
                organizationId,
                packageId,
                status: "ACTIVE",
                remainingCredits: pkg.monthlyCredits,
                // End date = 30 days from now
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });

        // Add credits to the Organization itself for main balance
        // We chose to store credits on Organization model for easy checking, 
        // but Subscription also tracks 'remainingCredits' for that specific cycle.
        // For simplicity in Phase 2, we sync Organization.credits += pkg.monthlyCredits

        await tx.organization.update({
            where: { id: organizationId },
            data: { credits: { increment: pkg.monthlyCredits } }
        });

        return newSub;
    });
}
