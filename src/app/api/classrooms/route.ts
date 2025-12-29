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
        const classrooms = await prisma.classroom.findMany({
            where: {
                businessId: session.user.businessId!,
            },
            orderBy: {
                name: "asc",
            },
        });

        return NextResponse.json(classrooms);
    } catch (error) {
        console.error("[CLASSROOMS_GET]", error);
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
        const { name, capacity, building } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        const classroom = await prisma.classroom.create({
            data: {
                name,
                capacity: capacity ? parseInt(capacity) : null,
                building: building || null,
                businessId: session.user.businessId!,
            },
        });

        return NextResponse.json(classroom);
    } catch (error) {
        console.error("[CLASSROOMS_POST]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
