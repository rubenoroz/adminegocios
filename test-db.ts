import { prisma } from "./src/lib/prisma";

async function main() {
    console.log("Testing database connection...");
    try {
        const count = await prisma.business.count();
        console.log(`Found ${count} businesses.`);

        const firstBusiness = await prisma.business.findFirst({
            select: {
                id: true,
                name: true,
                logoUrl: true,
                primaryColor: true
            }
        });
        console.log("First business:", firstBusiness);
    } catch (error) {
        console.error("Database error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
