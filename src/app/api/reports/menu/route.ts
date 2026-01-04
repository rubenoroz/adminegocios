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

        // Get all menu products
        const productFilter: any = businessId ? { businessId } : {};
        const products = await prisma.product.findMany({
            where: productFilter,
            select: { id: true, name: true, category: true, price: true }
        });

        // Get order items for the period
        const orderItemFilter: any = {
            order: {
                createdAt: { gte: startDate },
                status: { in: ["COMPLETED", "PAID", "SERVED"] }
            }
        };
        if (branchId) {
            orderItemFilter.order.branchId = branchId;
        } else if (businessId) {
            orderItemFilter.order.businessId = businessId;
        }

        const orderItems = await prisma.orderItem.findMany({
            where: orderItemFilter,
            include: {
                product: { select: { id: true, name: true, category: true, price: true } }
            }
        });

        // Calculate product performance
        const productStats: Record<string, {
            id: string;
            name: string;
            quantity: number;
            revenue: number;
            category: string;
        }> = {};

        orderItems.forEach(item => {
            const productId = item.productId;
            if (!productStats[productId]) {
                productStats[productId] = {
                    id: productId,
                    name: item.product.name,
                    quantity: 0,
                    revenue: 0,
                    category: item.product.category || "Sin categoría"
                };
            }
            productStats[productId].quantity += item.quantity;
            productStats[productId].revenue += (item.price || item.product.price) * item.quantity;
        });

        const sortedByRevenue = Object.values(productStats).sort((a, b) => b.revenue - a.revenue);
        const topSelling = sortedByRevenue.slice(0, 10);
        const lowPerformers = sortedByRevenue.slice(-10).reverse();

        // Revenue by category
        const categoryStats: Record<string, { revenue: number; count: number }> = {};
        Object.values(productStats).forEach(product => {
            if (!categoryStats[product.category]) {
                categoryStats[product.category] = { revenue: 0, count: 0 };
            }
            categoryStats[product.category].revenue += product.revenue;
            categoryStats[product.category].count += product.quantity;
        });

        const revenueByCategory = Object.entries(categoryStats)
            .map(([category, data]) => ({ category, ...data }))
            .sort((a, b) => b.revenue - a.revenue);

        // Average item price
        const avgItemPrice = products.length > 0
            ? products.reduce((sum, p) => sum + p.price, 0) / products.length
            : 0;

        return NextResponse.json({
            period,
            topSelling,
            lowPerformers,
            revenueByCategory,
            avgItemPrice,
            totalMenuItems: products.length
        });
    } catch (error) {
        console.error("Error fetching menu report:", error);
        return NextResponse.json({ error: "Error al obtener reporte del menú" }, { status: 500 });
    }
}
