import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get("courseId");
        const monthStr = searchParams.get("month"); // YYYY-MM

        if (!courseId || !monthStr) {
            return new NextResponse("Missing courseId or month", { status: 400 });
        }

        const date = new Date(monthStr + "-01");
        const start = startOfMonth(date);
        const end = endOfMonth(date);

        // Get all students in the course
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                enrollments: {
                    include: {
                        student: true,
                    },
                    orderBy: {
                        student: { lastName: "asc" },
                    },
                },
            },
        });

        if (!course) {
            return new NextResponse("Course not found", { status: 404 });
        }

        // Get attendance records for the month
        const attendance = await prisma.attendance.findMany({
            where: {
                courseId,
                date: {
                    gte: start,
                    lte: end,
                },
            },
        });

        // Generate days of the month
        const days = eachDayOfInterval({ start, end });

        // Structure data for the report
        const report = course.enrollments.map((enrollment) => {
            const studentAttendance: Record<string, string> = {};
            let present = 0;
            let absent = 0;
            let late = 0;
            let excused = 0;

            attendance.filter(a => a.studentId === enrollment.studentId).forEach(record => {
                const dayKey = format(record.date, "yyyy-MM-dd");
                studentAttendance[dayKey] = record.status;

                if (record.status === "PRESENT") present++;
                else if (record.status === "ABSENT") absent++;
                else if (record.status === "LATE") late++;
                else if (record.status === "EXCUSED") excused++;
            });

            return {
                student: {
                    id: enrollment.student.id,
                    name: `${enrollment.student.lastName}, ${enrollment.student.firstName}`,
                    matricula: enrollment.student.matricula,
                },
                attendance: studentAttendance,
                stats: { present, absent, late, excused },
            };
        });

        return NextResponse.json({
            courseName: course.name,
            days: days.map(d => format(d, "yyyy-MM-dd")),
            report,
        });

    } catch (error) {
        console.error("[ATTENDANCE_REPORT_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
