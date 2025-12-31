import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
        const status = searchParams.get('status');
        const branchId = searchParams.get('branchId');
        const includeCompleted = searchParams.get('includeCompleted') === 'true';

        const whereClause: any = { businessId: user.businessId };
        if (status) {
            whereClause.status = status;
        } else if (!includeCompleted) {
            // Default to active orders
            whereClause.status = { notIn: ['COMPLETED', 'CANCELLED'] };
        }
        if (branchId) {
            whereClause.branchId = branchId;
        }

        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                table: true,
                items: {
                    include: { product: true }
                },
                payments: true,
                branch: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { tableId, items, branchId, type = 'DINE_IN', customerName } = body;
        // items: [{ productId, quantity, notes, guestName }]

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // Validate branch belongs to business if provided
        if (branchId) {
            const branch = await prisma.branch.findFirst({
                where: { id: branchId, businessId: user.businessId }
            });
            if (!branch) {
                return NextResponse.json({ error: "Invalid branch" }, { status: 400 });
            }
        }

        // Obtener precios de productos
        const productIds = items.map((item: any) => item.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } }
        });
        const priceMap = products.reduce((acc: any, p) => {
            acc[p.id] = p.price;
            return acc;
        }, {});

        // Calcular total
        let total = 0;
        const itemsWithPrice = items.map((item: any) => {
            const price = priceMap[item.productId] || 0;
            total += price * item.quantity;
            return {
                productId: item.productId,
                quantity: item.quantity,
                notes: item.notes || null,
                guestName: item.guestName || 'Sin asignar',
                price: price,
                status: 'PENDING'
            };
        });

        // Create Order
        const order = await prisma.order.create({
            data: {
                tableId,
                businessId: user.businessId,
                branchId: branchId || null,
                status: "PENDING",
                type: type,
                customerName: customerName || null,
                total: total,
                remainingAmount: total,
                items: {
                    create: itemsWithPrice
                }
            },
            include: {
                items: { include: { product: true } },
                payments: true
            }
        });

        // Update Table status and link order
        if (tableId) {
            await prisma.table.update({
                where: { id: tableId },
                data: {
                    status: "OCCUPIED",
                    currentOrderId: order.id
                }
            });
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { orderId, status } = body;

        const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        // Obtener la orden actual para verificar la mesa
        const currentOrder = await prisma.order.findUnique({
            where: { id: orderId },
            include: { table: true }
        });

        if (!currentOrder) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const order = await prisma.order.update({
            where: { id: orderId },
            data: { status },
            include: {
                items: { include: { product: true } },
                payments: true,
                table: true
            }
        });

        // Actualizar estado de la mesa según el estado de la orden
        if (order.tableId) {
            let tableStatus = 'OCCUPIED';

            if (status === 'PREPARING') {
                tableStatus = 'WAITING_FOOD';
            } else if (status === 'READY' || status === 'SERVED') {
                tableStatus = 'SERVING';
            } else if (status === 'COMPLETED' || status === 'CANCELLED') {
                tableStatus = 'DIRTY'; // Mesa por limpiar después de completar
            }

            await prisma.table.update({
                where: { id: order.tableId },
                data: {
                    status: tableStatus,
                    ...(status === 'COMPLETED' || status === 'CANCELLED' ? { currentOrderId: null, currentPax: null } : {})
                }
            });
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
