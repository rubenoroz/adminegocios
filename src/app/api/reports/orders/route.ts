import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const businessId = session.user.businessId;
        const { searchParams } = new URL(req.url);
        const period = searchParams.get("period") || "month";
        const branchId = searchParams.get("branchId");

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case "week":
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case "year":
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case "month":
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }

        const orderFilter: any = {
            createdAt: { gte: startDate }
        };

        if (branchId) {
            orderFilter.branchId = branchId;
        } else if (businessId) {
            orderFilter.businessId = businessId;
        }

        // Fetch orders
        const orders = await prisma.order.findMany({
            where: orderFilter,
            include: {
                table: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: "asc" }
        });

        const completedOrders = orders.filter(o =>
            o.status === "COMPLETED" || o.status === "PAID" || o.status === "SERVED"
        );
        const cancelledOrders = orders.filter(o => o.status === "CANCELLED");

        const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);

        // Orders by hour (0-23)
        const ordersByHour: number[] = new Array(24).fill(0);
        orders.forEach(order => {
            const hour = order.createdAt.getHours();
            ordersByHour[hour]++;
        });

        // Orders by type
        const typeCount: Record<string, { count: number; revenue: number }> = {};
        orders.forEach(order => {
            if (!typeCount[order.type]) {
                typeCount[order.type] = { count: 0, revenue: 0 };
            }
            typeCount[order.type].count++;
            if (completedOrders.includes(order)) {
                typeCount[order.type].revenue += order.total;
            }
        });

        // Table efficiency
        const tableStats: Record<string, { name: string; orders: number; revenue: number }> = {};
        completedOrders.forEach(order => {
            if (order.table) {
                if (!tableStats[order.table.id]) {
                    tableStats[order.table.id] = { name: order.table.name, orders: 0, revenue: 0 };
                }
                tableStats[order.table.id].orders++;
                tableStats[order.table.id].revenue += order.total;
            }
        });

        // Calculate avg prep time (mock for now - would need timestamps)
        const avgPrepTime = 15; // minutes (placeholder)

        return NextResponse.json({
            period,
            totalOrders: orders.length,
            completedOrders: completedOrders.length,
            cancelledOrders: cancelledOrders.length,
            avgPrepTime,
            totalRevenue,
            avgTicket: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
            ordersByHour: ordersByHour.map((count, hour) => ({ hour, count })),
            ordersByType: Object.entries(typeCount).map(([type, data]) => ({ type, ...data })),
            tableEfficiency: Object.entries(tableStats)
                .map(([tableId, data]) => ({ tableId, ...data }))
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 10)
        });
    } catch (error) {
        console.error("Error fetching orders report:", error);
        return NextResponse.json({ error: "Error al obtener reporte de órdenes" }, { status: 500 });
    }
}
