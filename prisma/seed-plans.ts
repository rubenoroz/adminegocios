import { prisma } from "../src/lib/prisma";

async function seedPlans() {
    console.log("🌱 Seeding plans...");

    // Crear planes
    const freePlan = await prisma.plan.upsert({
        where: { name: "Free" },
        update: {},
        create: {
            id: "free",
            name: "Free",
            price: 0,
            interval: "monthly",
            maxCourses: 2,
            maxTeachers: 2,
            maxStudents: 3,
            maxBranches: 1,
            maxInventoryItems: 10,
            isActive: true
        }
    });

    const basicPlan = await prisma.plan.upsert({
        where: { name: "Básico" },
        update: {},
        create: {
            id: "basic",
            name: "Básico",
            price: 499,
            interval: "monthly",
            maxCourses: 10,
            maxTeachers: 10,
            maxStudents: 100,
            maxBranches: 2,
            maxInventoryItems: 100,
            isActive: true
        }
    });

    const premiumPlan = await prisma.plan.upsert({
        where: { name: "Premium" },
        update: {},
        create: {
            id: "premium",
            name: "Premium",
            price: 999,
            interval: "monthly",
            maxCourses: null, // ilimitado
            maxTeachers: null,
            maxStudents: null,
            maxBranches: null,
            maxInventoryItems: null,
            isActive: true
        }
    });

    console.log("✅ Plans created:");
    console.log("  - Free:", freePlan.name);
    console.log("  - Básico:", basicPlan.name);
    console.log("  - Premium:", premiumPlan.name);
}

seedPlans()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
