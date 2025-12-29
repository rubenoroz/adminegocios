import { prisma } from "../src/lib/prisma";

async function main() {
    try {
        console.log("Creating default business...");

        const business = await prisma.business.create({
            data: {
                name: "Escuela Demo",
                type: "SCHOOL",
                slug: "escuela-demo",
                // Add any other required fields based on schema
            }
        });

        console.log(`Created Business: ${business.name} (${business.id})`);

        // Also create a default admin user for this business if needed
        // But for now, just having the business allows seeding to work.

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
