import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const { name, capacity, building, branchId } = body;

        const classroom = await prisma.classroom.update({
            where: {
                id,
                businessId: session.user.businessId!,
            },
            data: {
                name,
                capacity: capacity ? parseInt(capacity) : null,
                building: building || null,
                branchId: branchId || null,
            },
            include: {
                branch: true,
            },
        });

        return NextResponse.json(classroom);
    } catch (error) {
        console.error("[CLASSROOM_PUT]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        await prisma.classroom.delete({
            where: {
                id,
                businessId: session.user.businessId!,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[CLASSROOM_DELETE]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
