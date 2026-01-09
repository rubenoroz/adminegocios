
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Checking courses in database...");

        // Find all courses with minimal fields to identify business and status
        const courses = await prisma.course.findMany({
            select: {
                id: true,
                name: true,
                businessId: true,
                price: true,
                teacherId: true,
                status: true
            }
        });

        console.log(`Found ${courses.length} total courses in DB.`);

        if (courses.length > 0) {
            console.log("First 5 courses:");
            console.log(JSON.stringify(courses.slice(0, 5), null, 2));
        } else {
            console.log("No courses found at all.");
        }

        // Also check if there are any sessions to see the businessId context
        // This is harder without a specific user context, but let's list businesses
        const businesses = await prisma.business.findMany({
            select: { id: true, name: true }
        });
        console.log("Businesses:", businesses);

    } catch (error) {
        console.error("Error checking courses:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
