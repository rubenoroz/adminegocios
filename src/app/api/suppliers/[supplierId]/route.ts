import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ supplierId: string }> };

export async function GET(req: Request, { params }: RouteParams) {
    const { supplierId } = await params;
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

        const supplier = await prisma.supplier.findFirst({
            where: {
                id: supplierId,
                businessId: user.businessId
            },
            include: {
                products: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        cost: true,
                        sku: true,
                        category: true
                    },
                    orderBy: { name: 'asc' }
                },
                orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: {
                        items: {
                            include: {
                                product: {
                                    select: { name: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!supplier) {
            return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
        }

        return NextResponse.json(supplier);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: RouteParams) {
    const { supplierId } = await params;
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

        await prisma.supplier.delete({
            where: { id: supplierId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: RouteParams) {
    const { supplierId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, contactName, phone, email, address, category } = body;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const supplier = await prisma.supplier.update({
            where: { id: supplierId },
            data: {
                ...(name && { name }),
                ...(contactName !== undefined && { contactName }),
                ...(phone !== undefined && { phone }),
                ...(email !== undefined && { email }),
                ...(address !== undefined && { address }),
                ...(category !== undefined && { category })
            }
        });

        return NextResponse.json(supplier);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
