// @ts-nocheck
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
    console.log("Starting teacher sync...");

    try {
        // 1. Get all employees with role TEACHER
        const employees = await prisma.employee.findMany({
            where: { role: "TEACHER" }
        });

        console.log(`Found ${employees.length} employees with role TEACHER.`);

        let createdCount = 0;

        for (const emp of employees) {
            // 2. Check if user exists with this email
            const existingUser = await prisma.user.findUnique({
                where: { email: emp.email }
            });

            if (!existingUser) {
                console.log(`Creating user for employee: ${emp.firstName} ${emp.lastName} (${emp.email})`);

                const hashedPassword = await bcrypt.hash("password123", 10);

                await prisma.user.create({
                    data: {
                        name: `${emp.firstName} ${emp.lastName}`,
                        email: emp.email,
                        password: hashedPassword,
                        role: "TEACHER",
                        business: { connect: { id: emp.businessId } },
                        // branch: emp.branchId ? { connect: { id: emp.branchId } } : undefined,
                        status: "ACTIVE"
                    }
                });
                createdCount++;
            } else {
                console.log(`User already exists for: ${emp.email}`);
                // Optional: Update role if needed?
                if (existingUser.role !== "TEACHER" && existingUser.role !== "OWNER" && existingUser.role !== "ADMIN") {
                    await prisma.user.update({
                        where: { id: existingUser.id },
                        data: { role: "TEACHER" }
                    });
                    console.log(`Updated role to TEACHER for: ${emp.email}`);
                }
            }
        }

        console.log(`Sync complete. Created ${createdCount} new users.`);

    } catch (error) {
        console.error("Error syncing teachers:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
