
import { prisma } from "../src/lib/prisma";

async function main() {
    console.log("Starting reverse sync (Users -> Employees)...");

    try {
        // 1. Get all Users with role TEACHER
        const teachers = await prisma.user.findMany({
            where: { role: "TEACHER" }
        });

        console.log(`Found ${teachers.length} users with role TEACHER.`);

        let createdCount = 0;

        for (const user of teachers) {
            if (!user.email) continue;

            // 2. Check if Employee exists with this email
            const existingEmployee = await prisma.employee.findFirst({
                where: { email: user.email }
            });

            if (!existingEmployee) {
                console.log(`Creating employee for user: ${user.name} (${user.email})`);

                // Split name
                const parts = (user.name || "Unknown User").split(" ");
                const firstName = parts[0];
                const lastName = parts.slice(1).join(" ") || "Teacher";

                await prisma.employee.create({
                    data: {
                        firstName,
                        lastName,
                        email: user.email,
                        role: "TEACHER",
                        businessId: user.businessId!,
                        branchId: user.branchId,
                        salary: 0, // Default
                        paymentFrequency: "MONTHLY"
                    }
                });
                createdCount++;
            } else {
                console.log(`Employee already exists for: ${user.email}`);
            }
        }

        console.log(`Sync complete. Created ${createdCount} new employees.`);

    } catch (error) {
        console.error("Error syncing employees:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
