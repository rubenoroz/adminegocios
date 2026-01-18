
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugJorgeCommission() {
    const studentId = 'cmjyi5nzy000lj4o0t4ln7mr2'; // Jorge Rúben
    const feeId = 'cmkilh84b0006easb5uyvov6n'; // Algebra 1 Fee
    const courseId = 'cmka2wrqe0004fe3l6uzyg2qr'; // Algebra 1 Course

    try {
        console.log("--- DEBUG START ---");

        // 1. Fetch Fee Data as API does
        const feeData = await prisma.studentFee.findUnique({
            where: { id: feeId },
            include: {
                course: { select: { id: true, name: true } },
                template: true
            }
        });
        console.log("Fee Data:", JSON.stringify(feeData, null, 2));

        if (!feeData) return;

        // 2. Simulate Fallback Query
        if (feeData.studentId && feeData.courseId) {
            console.log(`Checking Enrollment for Student ${feeData.studentId} and Course ${feeData.courseId}`);

            const groupEnrollment = await prisma.scheduleEnrollment.findFirst({
                where: {
                    studentId: feeData.studentId,
                    schedule: { courseId: feeData.courseId }, // Link via Schedule
                    status: 'ACTIVE'
                },
                include: {
                    schedule: {
                        include: {
                            teacher: {
                                include: { employee: true }
                            }
                        }
                    }
                }
            });
            console.log("Enrollment Found:", JSON.stringify(groupEnrollment, null, 2));

            if (groupEnrollment?.schedule?.teacher?.employee) {
                const emp = groupEnrollment.schedule.teacher.employee;
                console.log(`Teacher Found: ${emp.firstName} ${emp.lastName}`);
                console.log(`Payment Model: ${emp.paymentModel}`);
                console.log(`Commission Pct: ${emp.commissionPercentage}`);
            } else {
                console.log("No Teacher/Employee found in Enrollment.");
            }
        } else {
            console.log("Fee missing studentId or courseId.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

debugJorgeCommission();
