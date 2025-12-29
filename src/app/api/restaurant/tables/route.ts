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
                    take: 1
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
