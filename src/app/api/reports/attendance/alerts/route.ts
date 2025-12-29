import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get("courseId");
        const daysLookback = parseInt(searchParams.get("days") || "30");

        const startDate = subDays(new Date(), daysLookback);

        // 1. Get all enrollments (optionally filtered by course)
        const enrollments = await prisma.enrollment.findMany({
            where: {
                status: "ACTIVE",
                ...(courseId ? { courseId } : {}),
            },
            include: {
                student: true,
                course: true,
            },
        });

        // 2. For each enrollment, count total classes and absences in the period
        const alerts = [];

        for (const enrollment of enrollments) {
            const attendanceRecords = await prisma.attendance.findMany({
                where: {
                    courseId: enrollment.courseId,
                    studentId: enrollment.studentId,
                    date: {
                        gte: startDate,
                    },
                },
            });

            const totalClasses = attendanceRecords.length;
            if (totalClasses === 0) continue;

            const absences = attendanceRecords.filter(
                (a) => a.status === "ABSENT"
            ).length;

            const absenceRate = (absences / totalClasses) * 100;

            // Threshold: Report if absence rate > 15% or more than 3 absences
            if (absenceRate >= 15 || absences >= 3) {
                alerts.push({
                    student: {
                        id: enrollment.student.id,
                        name: `${enrollment.student.lastName}, ${enrollment.student.firstName}`,
                        matricula: enrollment.student.matricula,
                        email: enrollment.student.email,
                    },
                    course: {
                        id: enrollment.course.id,
                        name: enrollment.course.name,
                    },
                    stats: {
                        totalClasses,
                        absences,
                        absenceRate: Math.round(absenceRate),
                    },
                    riskLevel: absenceRate >= 30 ? "HIGH" : "MODERATE",
                });
            }
        }

        // Sort by risk level (HIGH first) then absence rate
        alerts.sort((a, b) => {
            if (a.riskLevel === b.riskLevel) {
                return b.stats.absenceRate - a.stats.absenceRate;
            }
            return a.riskLevel === "HIGH" ? -1 : 1;
        });

        return NextResponse.json(alerts);
    } catch (error) {
        console.error("[ABSENTEEISM_ALERTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
