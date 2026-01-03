import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = {
    params: Promise<{ id: string }>;
};

// GET /api/services/[id] - Get service details
export async function GET(req: Request, { params }: RouteParams) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const service = await prisma.service.findUnique({
            where: { id },
            include: {
                appointments: {
                    take: 10,
                    orderBy: { startTime: 'desc' },
                    include: {
                        customer: { select: { name: true } },
                        employee: { select: { firstName: true, lastName: true } }
                    }
                }
            }
        });

        if (!service) {
            return NextResponse.json({ error: "Service not found" }, { status: 404 });
        }

        return NextResponse.json(service);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// PATCH /api/services/[id] - Update a service
export async function PATCH(req: Request, { params }: RouteParams) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, description, duration, price, color, isActive } = body;

        const service = await prisma.service.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(duration && { duration }),
                ...(price !== undefined && { price: parseFloat(price) }),
                ...(color && { color }),
                ...(isActive !== undefined && { isActive })
            }
        });

        return NextResponse.json(service);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// DELETE /api/services/[id] - Delete a service
export async function DELETE(req: Request, { params }: RouteParams) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await prisma.service.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
