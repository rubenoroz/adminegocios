import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Actually generate the fees
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { month, year } = await req.json();

        // Get business payment settings
        const business = await prisma.business.findUnique({
            where: { id: session.user.businessId },
            select: {
                defaultPaymentDay: true,
                paymentGraceDays: true
            }
        });

        const paymentDay = business?.defaultPaymentDay ?? 1;
        const graceDays = business?.paymentGraceDays ?? 5;
        const dueDateDay = Math.min(28, paymentDay + graceDays);

        // Calculate due date
        const dueDate = new Date(year, month, dueDateDay);

        // Get all students enrolled in schedules (groups) with their courses
        const scheduleEnrollments = await prisma.scheduleEnrollment.findMany({
            where: {
                status: 'ACTIVE',
                schedule: {
                    businessId: session.user.businessId,
                    courseId: { not: null }
                }
            },
            include: {
                student: true,
                schedule: {
                    include: {
                        course: true,
                        teacher: {
                            include: {
                                employee: true
                            }
                        }
                    }
                }
            }
        });

        // Also check traditional course enrollments
        const courseEnrollments = await prisma.enrollment.findMany({
            where: {
                course: {
                    businessId: session.user.businessId
                },
                status: 'ACTIVE'
            },
            include: {
                student: true,
                course: {
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

        // Get existing fees for this month
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);

        const existingFees = await prisma.studentFee.findMany({
            where: {
                student: {
                    businessId: session.user.businessId
                },
                createdAt: {
                    gte: monthStart,
                    lte: monthEnd
                },
                title: {
                    contains: `Mensualidad`
                }
            },
            select: {
                studentId: true,
                title: true
            }
        });

        const existingFeeKeys = new Set(
            existingFees.map(f => `${f.studentId}-${f.title}`)
        );

        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        // Create fees from schedule enrollments
        const feesToCreate: any[] = [];
        const processedKeys = new Set<string>();

        // Process schedule enrollments (groups)
        for (const enrollment of scheduleEnrollments) {
            const course = enrollment.schedule.course;
            if (!course) continue;

            const studentCourseKey = `${enrollment.studentId}-${course.id}`;
            if (processedKeys.has(studentCourseKey)) continue;
            processedKeys.add(studentCourseKey);

            const groupName = enrollment.schedule.groupName || enrollment.schedule.title || '';
            const feeTitle = groupName
                ? `Mensualidad ${monthNames[month]}: ${course.name} (${groupName})`
                : `Mensualidad ${monthNames[month]}: ${course.name}`;
            const feeKey = `${enrollment.studentId}-${feeTitle}`;

            if (existingFeeKeys.has(feeKey)) continue;

            let expectedTeacherId = null;
            let expectedCommission = null;

            // Calculate Expected Commission (Projected)
            const teacherUser = enrollment.schedule.teacher;
            if (teacherUser?.employee && teacherUser.paymentModel === 'COMMISSION' && teacherUser.commissionPercentage) {
                expectedTeacherId = teacherUser.employee.id;
                expectedCommission = ((course.price || 0) * teacherUser.commissionPercentage) / 100;
            }

            feesToCreate.push({
                studentId: enrollment.studentId,
                title: feeTitle,
                amount: course.price || 0,
                dueDate,
                status: 'PENDING',
                courseId: course.id,
                expectedTeacherId,
                expectedCommission
            });
        }

        // Process traditional course enrollments
        for (const enrollment of courseEnrollments) {
            const studentCourseKey = `${enrollment.studentId}-${enrollment.course.id}`;
            if (processedKeys.has(studentCourseKey)) continue;
            processedKeys.add(studentCourseKey);

            const feeTitle = `Mensualidad ${monthNames[month]}: ${enrollment.course.name}`;
            const feeKey = `${enrollment.studentId}-${feeTitle}`;

            if (existingFeeKeys.has(feeKey)) continue;

            let expectedTeacherId = null;
            let expectedCommission = null;

            // Calculate Expected Commission (Projected)
            const teacherUser = enrollment.course.teacher;
            if (teacherUser?.employee && teacherUser.paymentModel === 'COMMISSION' && teacherUser.commissionPercentage) {
                expectedTeacherId = teacherUser.employee.id;
                expectedCommission = ((enrollment.course.price || 0) * teacherUser.commissionPercentage) / 100;
            }

            feesToCreate.push({
                studentId: enrollment.studentId,
                title: feeTitle,
                amount: enrollment.course.price || 0,
                dueDate,
                status: 'PENDING',
                courseId: enrollment.course.id,
                expectedTeacherId,
                expectedCommission
            });
        }

        if (feesToCreate.length === 0) {
            return NextResponse.json({
                message: "No hay cobros nuevos que generar",
                created: 0
            });
        }

        // Batch create all fees
        await prisma.studentFee.createMany({
            data: feesToCreate
        });

        return NextResponse.json({
            message: "Cobros generados exitosamente",
            created: feesToCreate.length
        });

    } catch (error) {
        console.error("Error generating fees:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
