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
        const branchId = searchParams.get("branchId");

        // Get products with inventory
        const products = await prisma.product.findMany({
            where: businessId ? { businessId } : {},
            include: {
                inventory: branchId
                    ? { where: { branchId } }
                    : true,
                saleItems: {
                    where: {
                        sale: {
                            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                            status: "COMPLETED"
                        }
                    },
                    select: { quantity: true, sale: { select: { createdAt: true } } }
                }
            }
        });

        // Calculate statistics
        let totalProducts = products.length;
        let totalValue = 0;
        const lowStock: any[] = [];
        const noMovement: any[] = [];
        const topMoving: any[] = [];
        const categoryMap: Record<string, { count: number; value: number }> = {};

        products.forEach(product => {
            const inventoryQty = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
            const minStock = product.inventory[0]?.minStock || 5;
            const productValue = (product.cost || product.price) * inventoryQty;
            totalValue += productValue;

            // Category tracking
            const category = product.category || "Sin categoría";
            if (!categoryMap[category]) {
                categoryMap[category] = { count: 0, value: 0 };
            }
            categoryMap[category].count++;
            categoryMap[category].value += productValue;

            // Low stock
            if (inventoryQty <= minStock && inventoryQty > 0) {
                lowStock.push({
                    id: product.id,
                    name: product.name,
                    quantity: inventoryQty,
                    minStock
                });
            }

            // Sales tracking
            const totalSold = product.saleItems.reduce((sum, item) => sum + item.quantity, 0);
            const lastSale = product.saleItems.length > 0
                ? product.saleItems[product.saleItems.length - 1].sale.createdAt
                : null;

            if (totalSold === 0) {
                noMovement.push({
                    id: product.id,
                    name: product.name,
                    lastSale: lastSale?.toISOString() || null
                });
            } else {
                topMoving.push({
                    id: product.id,
                    name: product.name,
                    sold: totalSold
                });
            }
        });

        // Sort
        lowStock.sort((a, b) => a.quantity - b.quantity);
        topMoving.sort((a, b) => b.sold - a.sold);

        const categories = Object.entries(categoryMap)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.value - a.value);

        return NextResponse.json({
            totalProducts,
            totalValue,
            lowStock: lowStock.slice(0, 10),
            noMovement: noMovement.slice(0, 10),
            topMoving: topMoving.slice(0, 10),
            categories
        });
    } catch (error) {
        console.error("Error fetching inventory report:", error);
        return NextResponse.json({ error: "Error al obtener reporte de inventario" }, { status: 500 });
    }
}
