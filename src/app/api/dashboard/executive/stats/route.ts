import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, subMonths, startOfWeek, endOfWeek, format, eachMonthOfInterval, startOfYear, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // Restrict to OWNER
        if (user.role !== "OWNER" && user.role !== "SUPERADMIN") {
            // Returning 403, but handling gracefully in frontend if we want to just hide widgets?
            // User requested "only available for owner".
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const businessId = user.businessId;
        const now = new Date();
        const sixMonthsAgo = subMonths(now, 6);

        // 1. Payment Status (Snapshot)
        const paymentStatus = await prisma.studentFee.groupBy({
            by: ['status'],
            where: {
                student: { businessId },
                // We might want to filter by recent fees or all open fees?
                // For "Vencidos" it matters if they are old.
            },
            _count: { _all: true }
        });

        const paymentsChart = [
            { name: "Pagados", value: 0, color: "#10b981" },
            { name: "Pendientes", value: 0, color: "#f59e0b" },
            { name: "Vencidos", value: 0, color: "#ef4444" }
        ];

        paymentStatus.forEach(stat => {
            if (stat.status === 'PAID') paymentsChart[0].value = stat._count._all;
            else if (stat.status === 'PENDING' || stat.status === 'PARTIAL') paymentsChart[1].value += stat._count._all;
            else if (stat.status === 'OVERDUE') paymentsChart[2].value = stat._count._all;
        });

        // 2. Course Distribution (Top 5 Active Courses by Enrollment)
        const courseEnrollments = await prisma.course.findMany({
            where: { businessId, status: "ACTIVE" },
            select: {
                name: true,
                _count: {
                    select: { enrollments: { where: { status: "ACTIVE" } } }
                }
            },
            orderBy: {
                enrollments: { _count: 'desc' }
            },
            take: 5
        });

        const courseDistribution = courseEnrollments.map(c => ({
            name: c.name,
            value: c._count.enrollments
        }));

        // 3. Enrollment Growth (Last 6 Months)
        // This assumes we have an enrollmentDate on Student. Schema says: enrollmentDate DateTime @default(now())

        const enrollmentGrowth: any[] = [];
        const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });

        for (const monthStart of months) {
            const monthEnd = endOfMonth(monthStart);
            const count = await prisma.student.count({
                where: {
                    businessId,
                    enrollmentDate: { lte: monthEnd },
                    // We count active students at that point in time roughly by enrollment date
                    // assuming they didn't leave (or we ignore leave date for simplified growth view)
                    // or we check 'status' but status is current.
                    // For accurate historical count we'd need a history table.
                    // Simplified approach: Cumulative enrollments up to that date.
                    status: { not: "ARCHIVED" }
                }
            });
            enrollmentGrowth.push({
                month: format(monthStart, 'MMM', { locale: es }),
                alumnos: count
            });
        }

        // 4. Weekly Attendance (Current Week)
        const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                course: { businessId },
                date: { gte: weekStart, lte: weekEnd }
            },
            select: {
                date: true,
                status: true
            }
        });

        // Group by day -> calculate % Present
        const daysTemplate = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
        const weeklyAttendance = daysTemplate.map((dayName, idx) => {
            // Find records for this day (index 0 = Monday)
            // date-fns getDay: 0=Sunday, 1=Monday.
            // Adjust to match loop index (0=Mon, 6=Sun)
            const targetDay = (idx + 1) % 7;

            const dayRecords = attendanceRecords.filter(r => r.date.getDay() === targetDay);
            const total = dayRecords.length;
            const present = dayRecords.filter(r => r.status === 'PRESENT').length;

            return {
                day: dayName,
                asistencia: total > 0 ? Math.round((present / total) * 100) : 0
            };
        });

        // 5. Revenue vs Expenses (Last 6 Months)
        // Using Transaction model
        const revenueData: any[] = [];

        for (const monthStart of months) {
            const monthEnd = endOfMonth(monthStart);
            const transactions = await prisma.transaction.groupBy({
                by: ['type'],
                where: {
                    businessId,
                    date: { gte: monthStart, lte: monthEnd }
                },
                _sum: { amount: true }
            });

            const income = transactions.find(t => t.type === 'INCOME')?._sum.amount || 0;
            const expense = transactions.find(t => t.type === 'EXPENSE')?._sum.amount || 0;

            revenueData.push({
                month: format(monthStart, 'MMM', { locale: es }),
                ingresos: income,
                gastos: expense
            });
        }

        // 6. Teacher Performance (Avg Grade per Teacher)
        // Group by Course -> Teacher
        // This is heavy query, might optimize later.
        const teachers = await prisma.user.findMany({
            where: {
                businessId,
                role: "TEACHER"
            },
            select: {
                id: true,
                name: true,
                courses: {
                    select: {
                        grades: {
                            select: { value: true, maxValue: true }
                        }
                    }
                }
            },
            take: 5
        });

        const teacherPerformance = teachers.map(t => {
            let totalScore = 0;
            let totalEvaluations = 0;

            t.courses.forEach(c => {
                c.grades.forEach(g => {
                    // Normalize to 100
                    const normalized = (g.value / g.maxValue) * 100;
                    totalScore += normalized;
                    totalEvaluations++;
                });
            });

            return {
                subject: t.name?.split(' ')[0] || "Prof.", // Use first name for chart brevity
                score: totalEvaluations > 0 ? Math.round(totalScore / totalEvaluations) : 0
            };
        }).filter(t => t.score > 0); // Only active teachers

        // Metrics Summary
        const totalStudents = enrollmentGrowth[enrollmentGrowth.length - 1].alumnos;
        const totalCourses = courseEnrollments.length; // Active ones from query above (limited to 5? no, query limit was 5)
        // Need total count
        const realTotalCourses = await prisma.course.count({ where: { businessId, status: "ACTIVE" } });
        const currentMonthRevenue = revenueData[revenueData.length - 1].ingresos;

        // Calculate Avg Attendance
        const avgAttendance = Math.round(
            weeklyAttendance.reduce((acc, curr) => acc + curr.asistencia, 0) / 7
        ); // Simple avg of daily avgs

        return NextResponse.json({
            paymentStatus: paymentsChart,
            courseDistribution,
            enrollmentData: enrollmentGrowth,
            attendanceData: weeklyAttendance,
            revenueData,
            teacherPerformance,
            metrics: {
                students: totalStudents,
                courses: realTotalCourses,
                revenue: currentMonthRevenue,
                attendance: avgAttendance
            }
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
