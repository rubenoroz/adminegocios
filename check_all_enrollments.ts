
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("🔍 Checking all enrollments...");

        const totalEnrollments = await prisma.enrollment.count();
        const totalScheduleEnrollments = await prisma.scheduleEnrollment.count();
        const totalStudents = await prisma.student.count();

        console.log(`Total Direct Course Enrollments: ${totalEnrollments}`);
        console.log(`Total Schedule (Group) Enrollments: ${totalScheduleEnrollments}`);
        console.log(`Total Students: ${totalStudents}`);

        // Check specifically for the Guitarra course (or any course with price)
        const courses = await prisma.course.findMany({
            where: { price: { gt: 0 } },
            include: {
                enrollments: true,
                schedules: {
                    include: {
                        enrollments: true
                    }
                }
            }
        });

        for (const c of courses) {
            console.log(`\nCourse: ${c.name} (Price: ${c.price})`);
            console.log(`  - Direct Enrollments: ${c.enrollments.length}`);

            let scheduleEnrollmentCount = 0;
            c.schedules.forEach(s => {
                scheduleEnrollmentCount += s.enrollments.length;
            });
            console.log(`  - Schedule (Group) Enrollments: ${scheduleEnrollmentCount}`);
        }

    } catch (error) {
        console.error("Error checking enrollments:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
