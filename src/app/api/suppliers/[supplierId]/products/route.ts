import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ supplierId: string }> };

// Get products for a supplier
export async function GET(req: Request, { params }: RouteParams) {
    const { supplierId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const products = await prisma.product.findMany({
            where: { supplierId },
            select: {
                id: true,
                name: true,
                price: true,
                cost: true,
                sku: true,
                category: true
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
