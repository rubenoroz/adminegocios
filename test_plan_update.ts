
import { prisma } from "./src/lib/prisma";

async function main() {
    const businessId = 'cmjygf2aw0002pv9mhvgzlaqb'; // Acapella

    // 1. Get available plans
    const plans = await prisma.plan.findMany();
    console.log("Available Plans:", plans.map(p => ({ id: p.id, name: p.name })));

    if (plans.length === 0) {
        console.error("No plans found!");
        return;
    }

    const newPlanId = plans[0].id; // Use the first plan
    console.log(`Attempting to update business ${businessId} to plan ${newPlanId}`);

    try {
        const updated = await prisma.business.update({
            where: { id: businessId },
            data: { planId: newPlanId }
        });
        console.log("Success! New Plan ID:", updated.planId);
    } catch (error) {
        console.error("Update failed:", error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
