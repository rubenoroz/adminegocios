import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

        const suppliers = await prisma.supplier.findMany({
            where: { businessId: user.businessId },
            include: {
                _count: {
                    select: {
                        products: true,
                        orders: true
                    }
                },
                orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { createdAt: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        // Transform to include order count and last order date
        const suppliersWithStats = suppliers.map(s => ({
            ...s,
            totalProducts: s._count.products,
            totalOrders: s._count.orders,
            lastOrder: s.orders[0]?.createdAt?.toISOString().split('T')[0] || null
        }));

        return NextResponse.json(suppliersWithStats);
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
        const { name, contactName, phone, email, address, category } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const supplier = await prisma.supplier.create({
            data: {
                name,
                contactName,
                phone,
                email,
                address,
                category,
                businessId: user.businessId
            }
        });

        return NextResponse.json(supplier);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
