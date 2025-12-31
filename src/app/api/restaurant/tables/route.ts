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

        // Get branchId from query params
        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get("branchId");

        const tables = await prisma.table.findMany({
            where: {
                businessId: user.businessId,
                ...(branchId ? { branchId } : {})
            },
            orderBy: { name: 'asc' },
            include: {
                orders: {
                    where: { status: { not: 'COMPLETED' } },
                    take: 1,
                    include: {
                        items: {
                            include: { product: true }
                        },
                        payments: true
                    }
                },
                branch: true
            }
        });

        return NextResponse.json(tables);
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
        const { name, capacity, x, y, branchId } = body;

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

        const table = await prisma.table.create({
            data: {
                name,
                capacity: parseInt(capacity),
                x: parseInt(x || 0),
                y: parseInt(y || 0),
                businessId: user.businessId,
                branchId: branchId || null
            }
        });

        return NextResponse.json(table);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// Actualizar mesa (estado, PAX, etc.)
export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { tableId, status, currentPax, currentOrderId, name, capacity } = body;

        if (!tableId) {
            return NextResponse.json({ error: "tableId is required" }, { status: 400 });
        }

        // Validar que el status sea válido si se proporciona
        const validStatuses = ['AVAILABLE', 'OCCUPIED', 'WAITING_FOOD', 'SERVING', 'PAYING', 'DIRTY', 'RESERVED'];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const updateData: any = {};
        if (status !== undefined) updateData.status = status;
        if (currentPax !== undefined) updateData.currentPax = currentPax;
        if (currentOrderId !== undefined) updateData.currentOrderId = currentOrderId;
        if (name !== undefined) updateData.name = name;
        if (capacity !== undefined) updateData.capacity = parseInt(capacity);

        // Si se libera la mesa, limpiar PAX y orden
        if (status === 'AVAILABLE') {
            updateData.currentPax = null;
            updateData.currentOrderId = null;
        }

        const table = await prisma.table.update({
            where: { id: tableId },
            data: updateData,
            include: {
                orders: {
                    where: { status: { not: 'COMPLETED' } },
                    take: 1
                }
            }
        });

        return NextResponse.json(table);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// Eliminar mesas (individual o múltiples)
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { ids } = body; // Array de IDs para eliminar

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "ids array is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // Eliminar solo mesas del negocio del usuario
        await prisma.table.deleteMany({
            where: {
                id: { in: ids },
                businessId: user.businessId
            }
        });

        return NextResponse.json({ success: true, deleted: ids.length });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
