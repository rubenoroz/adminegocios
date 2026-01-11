import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, subMonths, subDays } from "date-fns";

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

        // Restrict to OWNER (as requested: "those sections only available for owner")
        if (user.role !== "OWNER" && user.role !== "SUPERADMIN") {
            // Return 403 Forbidden
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 1. Total Sales (Current Month)
        const startOfCurrentMonth = startOfMonth(new Date());
        const currentMonthSales = await prisma.sale.aggregate({
            where: {
                branch: { businessId: user.businessId },
                status: "COMPLETED",
                createdAt: { gte: startOfCurrentMonth }
            },
            _sum: { total: true }
        });
        const totalSales = currentMonthSales._sum.total || 0;

        // 2. Total Products
        const totalProducts = await prisma.product.count({
            where: { businessId: user.businessId }
        });

        // 3. Low Stock Alerts (Stock < 10)
        const lowStockProducts = await prisma.product.findMany({
            where: {
                businessId: user.businessId,
                inventory: {
                    some: { quantity: { lt: 10 } }
                }
            },
            include: {
                inventory: true
            },
            take: 5
        });

        // 4. Recent Sales
        const recentSales = await prisma.sale.findMany({
            where: {
                branch: { businessId: user.businessId },
                status: "COMPLETED"
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { customer: true }
        });

        // 5. Students Count
        const totalStudents = await prisma.student.count({
            where: {
                businessId: user.businessId
            }
        });

        // 6. Active Courses Count
        const activeCourses = await prisma.course.count({
            where: {
                businessId: user.businessId,
                status: "ACTIVE"
            }
        });

        // 7. Attendance Average (Last 7 days)
        const sevenDaysAgo = subDays(new Date(), 7);
        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                date: { gte: sevenDaysAgo },
                course: { businessId: user.businessId }
            },
            select: { status: true }
        });

        let attendanceAvg = 0;
        if (attendanceRecords.length > 0) {
            const presentCount = attendanceRecords.filter(r => r.status === "PRESENT").length;
            attendanceAvg = (presentCount / attendanceRecords.length) * 100;
        }

        return NextResponse.json({
            totalSales,
            totalProducts,
            lowStockProducts,
            recentSales,
            totalStudents,
            activeCourses,
            attendanceAvg: Math.round(attendanceAvg * 10) / 10 // Round to 1 decimal
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
