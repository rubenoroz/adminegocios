import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const businessId = searchParams.get("businessId");

        if (!businessId) {
            return new NextResponse("Business ID required", { status: 400 });
        }

        // 1. Finance KPIs
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyIncome = await prisma.studentFee.aggregate({
            where: {
                student: { businessId },
                status: "PAID",
                updatedAt: { gte: startOfMonth }
            },
            _sum: { amount: true }
        });

        const pendingIncome = await prisma.studentFee.aggregate({
            where: {
                student: { businessId },
                status: { in: ["PENDING", "OVERDUE"] }
            },
            _sum: { amount: true }
        });

        // 2. Student KPIs
        const totalStudents = await prisma.student.count({
            where: { businessId }
        });

        // 3. Attendance KPIs (Last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                date: { gte: sevenDaysAgo },
                course: { businessId }
            },
            select: { status: true }
        });

        const attendanceStats = attendanceRecords.reduce((acc: any, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, {});

        // 4. Scholarship KPIs
        const scholarshipStudents = await prisma.student.count({
            where: {
                businessId,
                scholarships: {
                    some: { active: true }
                }
            }
        });

        const scholarshipCost = await prisma.studentFee.aggregate({
            where: {
                student: { businessId },
                status: "PAID",
                updatedAt: { gte: startOfMonth }
            },
            _sum: { discountApplied: true }
        });

        // 4. Chart Data: Income vs Expenses (Mocked expenses for now as we don't have Expense model fully populated maybe?)
        // Actually we have Payroll. Let's calculate estimated payroll for this month.
        // For simplicity, we'll return last 6 months income.

        // 4. Chart Data: Income vs Expenses
        const monthsParam = parseInt(searchParams.get("months") || "4");
        const offsetParam = parseInt(searchParams.get("offset") || "0");

        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() - offsetParam);
        endDate.setDate(1); // Start of the "end" month
        endDate.setMonth(endDate.getMonth() + 1); // Go to next month to include the full "end" month
        endDate.setDate(0); // Last day of the "end" month

        const startDate = new Date(endDate);
        startDate.setDate(1); // First day of the "end" month
        startDate.setMonth(startDate.getMonth() - monthsParam + 1); // Go back N months
        startDate.setDate(1); // Ensure first day

        const incomeHistory = await prisma.studentFee.findMany({
            where: {
                student: { businessId },
                status: "PAID",
                updatedAt: { gte: startDate, lte: endDate }
            },
            select: {
                amount: true,
                updatedAt: true
            }
        });

        // Group by month
        const monthlyData = new Map();
        incomeHistory.forEach(fee => {
            const month = fee.updatedAt.toLocaleString('default', { month: 'short' });
            monthlyData.set(month, (monthlyData.get(month) || 0) + fee.amount);
        });

        const chartData = Array.from(monthlyData.entries()).map(([name, income]) => ({
            name,
            income,
            expenses: income * 0.4 // Mock expenses as 40% of income for now
        }));

        return NextResponse.json({
            finance: {
                monthlyIncome: monthlyIncome._sum.amount || 0,
                pendingIncome: pendingIncome._sum.amount || 0,
            },
            students: {
                total: totalStudents,
                newThisMonth: 0 // TODO: Add createdAt check
            },
            attendance: attendanceStats,
            scholarships: {
                count: scholarshipStudents,
                cost: scholarshipCost._sum.discountApplied || 0
            },
            chartData
        });

    } catch (error) {
        console.error("[DASHBOARD_KPI]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
