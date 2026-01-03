import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/services/reports - Get detailed service statistics
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

        const { searchParams } = new URL(req.url);
        const period = searchParams.get("period") || "month"; // week, month, year

        // Calculate date range
        const now = new Date();
        let startDate = new Date();

        switch (period) {
            case "week":
                startDate.setDate(now.getDate() - 7);
                break;
            case "month":
                startDate.setMonth(now.getMonth() - 1);
                break;
            case "year":
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }

        // Get all appointments in the period
        const appointments = await prisma.appointment.findMany({
            where: {
                service: { businessId: user.businessId },
                startTime: { gte: startDate }
            },
            include: {
                service: { select: { id: true, name: true, price: true, color: true } },
                employee: { select: { id: true, firstName: true, lastName: true } }
            }
        });

        // Calculate stats
        const totalAppointments = appointments.length;
        const completedAppointments = appointments.filter(a => a.status === "COMPLETED");
        const cancelledAppointments = appointments.filter(a => a.status === "CANCELLED" || a.status === "NO_SHOW");
        const totalRevenue = completedAppointments.reduce((sum, a) => sum + a.service.price, 0);

        // Average per day
        const daysInPeriod = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const avgPerDay = totalAppointments / daysInPeriod;

        // Services breakdown
        const serviceStats: Record<string, { name: string; count: number; completed: number; revenue: number; color: string }> = {};
        appointments.forEach(apt => {
            const sId = apt.service.id;
            if (!serviceStats[sId]) {
                serviceStats[sId] = { name: apt.service.name, count: 0, completed: 0, revenue: 0, color: apt.service.color || "#3B82F6" };
            }
            serviceStats[sId].count++;
            if (apt.status === "COMPLETED") {
                serviceStats[sId].completed++;
                serviceStats[sId].revenue += apt.service.price;
            }
        });

        // Employee breakdown
        const employeeStats: Record<string, { name: string; count: number; completed: number; revenue: number }> = {};
        appointments.forEach(apt => {
            if (apt.employee) {
                const eId = apt.employee.id;
                if (!employeeStats[eId]) {
                    employeeStats[eId] = { name: `${apt.employee.firstName} ${apt.employee.lastName}`, count: 0, completed: 0, revenue: 0 };
                }
                employeeStats[eId].count++;
                if (apt.status === "COMPLETED") {
                    employeeStats[eId].completed++;
                    employeeStats[eId].revenue += apt.service.price;
                }
            }
        });

        // Daily breakdown
        const dailyStats: Record<string, { date: string; count: number; revenue: number }> = {};
        appointments.forEach(apt => {
            const dateStr = new Date(apt.startTime).toISOString().split('T')[0];
            if (!dailyStats[dateStr]) {
                dailyStats[dateStr] = { date: dateStr, count: 0, revenue: 0 };
            }
            dailyStats[dateStr].count++;
            if (apt.status === "COMPLETED") {
                dailyStats[dateStr].revenue += apt.service.price;
            }
        });

        return NextResponse.json({
            period,
            summary: {
                totalAppointments,
                completedAppointments: completedAppointments.length,
                cancelledAppointments: cancelledAppointments.length,
                completionRate: totalAppointments > 0 ? Math.round((completedAppointments.length / totalAppointments) * 100) : 0,
                totalRevenue,
                avgPerDay: Math.round(avgPerDay * 10) / 10
            },
            byService: Object.values(serviceStats).sort((a, b) => b.revenue - a.revenue),
            byEmployee: Object.values(employeeStats).sort((a, b) => b.revenue - a.revenue),
            daily: Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date))
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
