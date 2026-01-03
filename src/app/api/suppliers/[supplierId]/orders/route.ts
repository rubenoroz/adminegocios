import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ supplierId: string }> };

// Get orders for a supplier
export async function GET(req: Request, { params }: RouteParams) {
    const { supplierId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const orders = await prisma.supplierOrder.findMany({
            where: { supplierId },
            include: {
                items: {
                    include: {
                        product: {
                            select: { name: true, sku: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// Create order for supplier
export async function POST(req: Request, { params }: RouteParams) {
    const { supplierId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { items, notes } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // Get branch for the order
        const branchId = user.branchId || (await prisma.branch.findFirst({
            where: { businessId: user.businessId }
        }))?.id;

        if (!branchId) {
            return NextResponse.json({ error: "Branch not found" }, { status: 404 });
        }

        // Calculate total
        const total = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);

        // Generate order number
        const orderCount = await prisma.supplierOrder.count({
            where: { supplierId }
        });
        const orderNumber = `ORD-${supplierId.slice(0, 4).toUpperCase()}-${(orderCount + 1).toString().padStart(4, '0')}`;

        // Create order with items
        const order = await prisma.supplierOrder.create({
            data: {
                orderNumber,
                notes,
                total,
                supplierId,
                branchId,
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        total: item.quantity * item.unitPrice
                    }))
                }
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: { name: true }
                        }
                    }
                }
            }
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
