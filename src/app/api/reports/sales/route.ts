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
        let prevStartDate: Date;
        let prevEndDate: Date;

        switch (period) {
            case "week":
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                prevEndDate = new Date(startDate.getTime() - 1);
                prevStartDate = new Date(prevEndDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case "year":
                startDate = new Date(now.getFullYear(), 0, 1);
                prevEndDate = new Date(startDate.getTime() - 1);
                prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
                break;
            case "month":
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                prevEndDate = new Date(startDate.getTime() - 1);
                prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                break;
        }

        const saleFilter: any = {
            createdAt: { gte: startDate },
            status: "COMPLETED"
        };

        if (branchId) {
            saleFilter.branchId = branchId;
        } else if (businessId) {
            saleFilter.branch = { businessId };
        }

        const prevSaleFilter: any = {
            createdAt: { gte: prevStartDate, lte: prevEndDate },
            status: "COMPLETED"
        };
        if (branchId) {
            prevSaleFilter.branchId = branchId;
        } else if (businessId) {
            prevSaleFilter.branch = { businessId };
        }

        // Fetch current period sales
        const sales = await prisma.sale.findMany({
            where: saleFilter,
            include: {
                items: {
                    include: {
                        product: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: "asc" }
        });

        // Fetch previous period for comparison
        const prevSales = await prisma.sale.findMany({
            where: prevSaleFilter,
            select: { total: true }
        });

        const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
        const prevTotalSales = prevSales.reduce((sum, s) => sum + s.total, 0);

        // Sales by day
        const salesByDay: Record<string, number> = {};
        let currentDate = new Date(startDate);
        while (currentDate <= now) {
            salesByDay[currentDate.toISOString().split('T')[0]] = 0;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        sales.forEach(sale => {
            const dateKey = sale.createdAt.toISOString().split('T')[0];
            if (salesByDay[dateKey] !== undefined) {
                salesByDay[dateKey] += sale.total;
            }
        });

        // Top products
        const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
        sales.forEach(sale => {
            sale.items.forEach(item => {
                const name = item.product.name;
                if (!productSales[name]) {
                    productSales[name] = { name, quantity: 0, revenue: 0 };
                }
                productSales[name].quantity += item.quantity;
                productSales[name].revenue += item.price * item.quantity;
            });
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        return NextResponse.json({
            period,
            totalSales,
            salesCount: sales.length,
            avgTicket: sales.length > 0 ? totalSales / sales.length : 0,
            topProducts,
            salesByDay: Object.entries(salesByDay).map(([date, amount]) => ({ date, amount })),
            comparison: {
                value: prevTotalSales,
                percentage: prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0
            }
        });
    } catch (error) {
        console.error("Error fetching sales report:", error);
        return NextResponse.json({ error: "Error al obtener reporte de ventas" }, { status: 500 });
    }
}
