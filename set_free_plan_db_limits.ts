
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const result = await prisma.plan.updateMany({
            where: { name: 'FREE' },
            data: {
                maxCourses: 1,
                maxStudents: 10,
                maxInventoryItems: 10,
                maxBranches: 1,
                maxTeachers: 0 // "Empleados: X" implies 0 additional employees/teachers
            }
        });
        console.log(`Updated ${result.count} plan(s) with new constraints.`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
