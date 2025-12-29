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

        const products = await prisma.product.findMany({
            where: {
                businessId: user.businessId
            },
            include: {
                inventory: branchId ? {
                    where: { branchId }
                } : true
            }
        });

        return NextResponse.json(products);
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
        const { name, price, sku, category } = body;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const product = await prisma.product.create({
            data: {
                name,
                price: parseFloat(price),
                sku,
                category,
                businessId: user.businessId,
                inventory: {
                    create: {
                        branchId: user.branchId || (await prisma.branch.findFirst({ where: { businessId: user.businessId } }))?.id || "",
                        quantity: 0
                    }
                }
            }
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
