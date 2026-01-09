import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Preview what fees would be generated for a given month
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const month = parseInt(searchParams.get('month') || String(new Date().getMonth()));
        const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

        // Get all students enrolled in schedules (groups) with their courses
        const scheduleEnrollments = await prisma.scheduleEnrollment.findMany({
            where: {
                status: 'ACTIVE',
                schedule: {
                    businessId: session.user.businessId,
                    courseId: { not: null } // Only schedules linked to courses
                }
            },
            include: {
                student: true,
                schedule: {
                    include: {
                        course: true
                    }
                }
            }
        });

        // Also check traditional course enrollments for backward compatibility
        const courseEnrollments = await prisma.enrollment.findMany({
            where: {
                course: {
                    businessId: session.user.businessId
                },
                status: 'ACTIVE'
            },
            include: {
                student: true,
                course: true
            }
        });

        // Get existing fees for this month to avoid duplicates
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

        // Create a set of existing fee keys to check for duplicates
        const existingFeeKeys = new Set(
            existingFees.map(f => `${f.studentId}-${f.title}`)
        );

        // Calculate which fees would be created
        const feesToCreate: any[] = [];
        const processedKeys = new Set<string>(); // Avoid duplicate student-course combos
        let alreadyGenerated = 0;

        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        // Process schedule enrollments (groups)
        for (const enrollment of scheduleEnrollments) {
            const course = enrollment.schedule.course;
            if (!course) continue;

            const studentCourseKey = `${enrollment.studentId}-${course.id}`;
            if (processedKeys.has(studentCourseKey)) continue; // Skip if already processed this student-course combo
            processedKeys.add(studentCourseKey);

            const groupName = enrollment.schedule.groupName || enrollment.schedule.title || '';
            const feeTitle = groupName
                ? `Mensualidad ${monthNames[month]}: ${course.name} (${groupName})`
                : `Mensualidad ${monthNames[month]}: ${course.name}`;
            const feeKey = `${enrollment.studentId}-${feeTitle}`;

            if (existingFeeKeys.has(feeKey)) {
                alreadyGenerated++;
                continue;
            }

            feesToCreate.push({
                studentId: enrollment.studentId,
                studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
                courseName: course.name,
                groupName: groupName,
                amount: course.price || 0,
                title: feeTitle,
                courseId: course.id
            });
        }

        // Process traditional course enrollments
        for (const enrollment of courseEnrollments) {
            const studentCourseKey = `${enrollment.studentId}-${enrollment.course.id}`;
            if (processedKeys.has(studentCourseKey)) continue;
            processedKeys.add(studentCourseKey);

            const feeTitle = `Mensualidad ${monthNames[month]}: ${enrollment.course.name}`;
            const feeKey = `${enrollment.studentId}-${feeTitle}`;

            if (existingFeeKeys.has(feeKey)) {
                alreadyGenerated++;
                continue;
            }

            feesToCreate.push({
                studentId: enrollment.studentId,
                studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
                courseName: enrollment.course.name,
                amount: enrollment.course.price || 0,
                title: feeTitle,
                courseId: enrollment.course.id
            });
        }

        const totalAmount = feesToCreate.reduce((sum, f) => sum + f.amount, 0);
        const uniqueStudents = new Set(feesToCreate.map(f => f.studentId)).size;

        return NextResponse.json({
            totalStudents: uniqueStudents,
            feesToCreate: feesToCreate.length,
            alreadyGenerated,
            totalAmount,
            details: feesToCreate.slice(0, 10) // Preview first 10
        });

    } catch (error) {
        console.error("Error previewing fees:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
