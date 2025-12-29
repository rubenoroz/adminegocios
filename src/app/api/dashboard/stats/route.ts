import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, subMonths } from "date-fns";

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
            include: { customer: true } // Assuming we have customer relation, if not optional
        });

        return NextResponse.json({
            totalSales,
            totalProducts,
            lowStockProducts,
            recentSales
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
