import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List events
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const businessId = searchParams.get("businessId");
        const start = searchParams.get("start");
        const end = searchParams.get("end");

        if (!businessId) {
            return new NextResponse("Business ID required", { status: 400 });
        }

        const whereClause: any = { businessId };

        if (start && end) {
            whereClause.startDate = {
                gte: new Date(start),
                lte: new Date(end)
            };
        }

        const events = await prisma.schoolEvent.findMany({
            where: whereClause,
            orderBy: { startDate: "asc" }
        });

        return NextResponse.json(events);
    } catch (error) {
        console.error("[EVENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST - Create event
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { title, description, startDate, endDate, location, type, businessId } = body;

        if (!title || !startDate || !endDate || !businessId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const event = await prisma.schoolEvent.create({
            data: {
                title,
                description,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                location,
                type,
                businessId
            }
        });

        return NextResponse.json(event);
    } catch (error) {
        console.error("[EVENTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
