import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Calculate attendance statistics
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const businessId = searchParams.get("businessId") || session.user.businessId;
        const courseId = searchParams.get("courseId");
        const period = searchParams.get("period") || "month"; // "week", "month", "year"

        if (!businessId) {
            return NextResponse.json({ error: "businessId is required" }, { status: 400 });
        }

        // Calculate date range based on period
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case "week":
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case "year":
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case "month":
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }

        // Build query filter - use 'Attendance' model (not AttendanceRecord)
        const whereClause: any = {
            course: { businessId },
            date: { gte: startDate, lte: now }
        };

        if (courseId) {
            whereClause.courseId = courseId;
        }

        // Get all attendance records using correct model name
        const attendanceRecords = await prisma.attendance.findMany({
            where: whereClause,
            select: {
                status: true,
                studentId: true,
                courseId: true,
                date: true
            }
        });

        const totalRecords = attendanceRecords.length;

        if (totalRecords === 0) {
            return NextResponse.json({
                totalAttendanceRate: null,
                courseAttendanceRate: null,
                studentsAtRisk: 0,
                perfectCourses: 0,
                totalRecords: 0
            });
        }

        // Calculate overall attendance rate
        const presentRecords = attendanceRecords.filter(r =>
            r.status === "PRESENT" || r.status === "LATE"
        ).length;
        const totalAttendanceRate = Math.round((presentRecords / totalRecords) * 100);

        // Calculate course-specific attendance if courseId provided
        let courseAttendanceRate = null;
        if (courseId) {
            const courseRecords = attendanceRecords.filter(r => r.courseId === courseId);
            if (courseRecords.length > 0) {
                const coursePresent = courseRecords.filter(r =>
                    r.status === "PRESENT" || r.status === "LATE"
                ).length;
                courseAttendanceRate = Math.round((coursePresent / courseRecords.length) * 100);
            }
        }

        // Calculate students at risk (more than 20% absence rate)
        const studentAttendance: Record<string, { present: number; total: number }> = {};
        attendanceRecords.forEach(r => {
            if (!studentAttendance[r.studentId]) {
                studentAttendance[r.studentId] = { present: 0, total: 0 };
            }
            studentAttendance[r.studentId].total++;
            if (r.status === "PRESENT" || r.status === "LATE") {
                studentAttendance[r.studentId].present++;
            }
        });

        const studentsAtRisk = Object.values(studentAttendance).filter(s => {
            const attendanceRate = s.present / s.total;
            return attendanceRate < 0.8; // Less than 80% attendance
        }).length;

        // Calculate courses with perfect attendance this week
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);

        const weekRecords = attendanceRecords.filter(r => r.date >= weekAgo);
        const courseRecordsMap: Record<string, { present: number; total: number }> = {};

        weekRecords.forEach(r => {
            if (!courseRecordsMap[r.courseId]) {
                courseRecordsMap[r.courseId] = { present: 0, total: 0 };
            }
            courseRecordsMap[r.courseId].total++;
            if (r.status === "PRESENT") {
                courseRecordsMap[r.courseId].present++;
            }
        });

        const perfectCourses = Object.values(courseRecordsMap).filter(c =>
            c.total > 0 && c.present === c.total
        ).length;

        return NextResponse.json({
            totalAttendanceRate,
            courseAttendanceRate,
            studentsAtRisk,
            perfectCourses,
            totalRecords,
            period
        });
    } catch (error) {
        console.error("[ATTENDANCE_STATS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
