
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("🔍 Starting fee fix script...");

        // 1. Get all courses with a price < 0
        const courses = await prisma.course.findMany({
            where: {
                price: { gt: 0 }
            },
            include: {
                enrollments: {
                    include: {
                        student: true
                    }
                },
                schedules: {
                    include: {
                        enrollments: {
                            include: {
                                student: true
                            }
                        }
                    }
                }
            }
        });

        console.log(`Found ${courses.length} courses with price > 0.`);

        let feesCreated = 0;

        for (const course of courses) {
            if (!course.price) continue;

            // Collect all unique student IDs from both direct enrollments and schedule enrollments
            const studentMap = new Map();

            // 1. Direct Enrollments
            course.enrollments.forEach(e => {
                studentMap.set(e.studentId, e.student);
            });

            // 2. Schedule Enrollments
            course.schedules.forEach(schedule => {
                schedule.enrollments.forEach(se => {
                    studentMap.set(se.studentId, se.student);
                });
            });

            console.log(`Processing course: ${course.name} ($${course.price}) - ${studentMap.size} unique students`);

            for (const [studentId, student] of studentMap) {
                // Check if fee already exists for this student and course
                // We assume there should be at least one "PENDING" or "PAID" fee for this course
                const existingFee = await prisma.studentFee.findFirst({
                    where: {
                        studentId: studentId,
                        courseId: course.id
                    }
                });

                if (!existingFee) {
                    console.log(`  ➕ Generating fee for ${student.firstName} ${student.lastName}...`);

                    // Create the fee
                    await prisma.studentFee.create({
                        data: {
                            title: `Mensualidad: ${course.name}`,
                            amount: course.price,
                            originalAmount: course.price,
                            status: "PENDING",
                            dueDate: new Date(), // Due immediately
                            studentId: studentId,
                            courseId: course.id,

                            // Using default business logic (Prisma requires businessId?)
                            // Let's check schema. StudentFee usually inherits businessId via relation but Prisma might need it explicit?
                            // Checked schema: StudentFee doesn't have businessId column, it links via Student->Business.
                            // Wait, schema checked earlier: 
                            /*
                            model StudentFee {
                              ...
                              studentId   String
                              student     Student  @relation(...)
                              ...
                            }
                            */
                            // It does NOT have businessId directly. So creating it with studentId and courseId is enough.
                        }
                    });
                    feesCreated++;
                } else {
                    // console.log(`  ✅ Fee already exists for ${student.firstName}`);
                }
            }
        }

        console.log("-----------------------------------");
        console.log(`✅ Completed! Created ${feesCreated} missing fees.`);

    } catch (error) {
        console.error("❌ Error fixing fees:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
