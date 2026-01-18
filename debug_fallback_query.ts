
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugFallback() {
    const studentId = 'cmk40em5u001dxyv7wjt1wek5';
    const courseId = 'cmka2wrqe0004fe3l6uzyg2qr';

    try {
        console.log("--- DEBUG FALLBACK QUERY ---");

        const groupEnrollment = await prisma.scheduleEnrollment.findFirst({
            where: {
                studentId: studentId,
                schedule: {
                    courseId: courseId
                },
                status: 'ACTIVE'
            },
            include: {
                schedule: {
                    include: {
                        teacher: {
                            include: {
                                employee: true
                            }
                        }
                    }
                }
            }
        });

        console.log("Enrollment Found?", !!groupEnrollment);
        if (groupEnrollment) {
            console.log("Schedule ID:", groupEnrollment.schedule.id);
            console.log("Teacher User Found?", !!groupEnrollment.schedule.teacher);
            if (groupEnrollment.schedule.teacher) {
                console.log("Teacher Name:", groupEnrollment.schedule.teacher.name);
                console.log("Employee Found?", !!groupEnrollment.schedule.teacher.employee);
                if (groupEnrollment.schedule.teacher.employee) {
                    const emp = groupEnrollment.schedule.teacher.employee;
                    console.log("Payment Model:", emp.paymentModel);
                    console.log("Commission %:", emp.commissionPercentage);
                }
            }
        } else {
            console.log("NO ENROLLMENT FOUND.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

debugFallback();
