import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/services - List all services for the business
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

        const services = await prisma.service.findMany({
            where: { businessId: user.businessId },
            include: {
                _count: {
                    select: { appointments: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(services);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// POST /api/services - Create a new service
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, description, duration, price, color } = body;

        if (!name || price === undefined) {
            return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const service = await prisma.service.create({
            data: {
                name,
                description,
                duration: duration || 30,
                price: parseFloat(price),
                color: color || "#3B82F6",
                businessId: user.businessId
            }
        });

        return NextResponse.json(service);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
