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

        const whereClause: any = { businessId: user.businessId };
        if (status) {
            whereClause.status = status;
        } else {
            // Default to active orders
            whereClause.status = { not: 'COMPLETED' };
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
                branch: true
            },
            orderBy: { createdAt: 'asc' }
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
        const { tableId, items, branchId } = body; // items: [{ productId, quantity, notes }]

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

        // Create Order
        const order = await prisma.order.create({
            data: {
                tableId,
                businessId: user.businessId,
                branchId: branchId || null,
                status: "PENDING",
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        notes: item.notes
                    }))
                }
            },
            include: {
                items: true
            }
        });

        // Update Table status
        if (tableId) {
            await prisma.table.update({
                where: { id: tableId },
                data: { status: "OCCUPIED" }
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

        const order = await prisma.order.update({
            where: { id: orderId },
            data: { status }
        });

        // If completed, free the table
        if (status === 'COMPLETED' && order.tableId) {
            await prisma.table.update({
                where: { id: order.tableId },
                data: { status: "AVAILABLE" }
            });
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
