import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
        return NextResponse.json({ error: "Student ID required" }, { status: 400 });
    }

    try {
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                business: true,
                enrollments: {
                    include: {
                        course: true
                    }
                },
                attendance: {
                    include: {
                        course: true
                    }
                },
                grades: {
                    include: {
                        course: true
                    }
                }
            }
        });

        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        // Process data for report card
        const reportData = {
            student: {
                name: `${student.firstName} ${student.lastName}`,
                matricula: student.matricula,
                group: student.enrollments[0]?.course?.gradeLevel || "N/A"
            },
            school: {
                name: student.business.name,
                logo: student.business.logoUrl
            },
            courses: student.enrollments.map(enrollment => {
                const courseId = enrollment.courseId;
                const courseGrades = student.grades.filter(g => g.courseId === courseId);
                const courseAttendance = student.attendance.filter(a => a.courseId === courseId);

                const totalScore = courseGrades.reduce((acc, g) => acc + g.value, 0);
                const totalMax = courseGrades.reduce((acc, g) => acc + g.maxValue, 0);
                const average = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;

                const absences = courseAttendance.filter(a => a.status === 'ABSENT').length;

                return {
                    name: enrollment.course.name,
                    average: average.toFixed(1),
                    absences,
                    grades: courseGrades.map(g => ({ name: g.name, score: g.value, max: g.maxValue }))
                };
            })
        };

        return NextResponse.json(reportData);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
