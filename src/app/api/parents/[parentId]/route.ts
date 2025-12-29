import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ parentId: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const { parentId } = await params;
        const parent = await prisma.parentAccount.findUnique({
            where: { id: parentId },
            include: { students: { include: { student: true } } }
        });

        if (!parent) return new NextResponse("Parent not found", { status: 404 });

        return NextResponse.json(parent);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ parentId: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const { parentId } = await params;
        const body = await req.json();
        const { status } = body; // ACTIVE, INACTIVE, ARCHIVED

        const parent = await prisma.parentAccount.update({
            where: { id: parentId },
            data: { status }
        });

        return NextResponse.json(parent);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ parentId: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const { parentId } = await params;

        // Soft delete (Archive)
        const parent = await prisma.parentAccount.update({
            where: { id: parentId },
            data: { status: "ARCHIVED" }
        });

        return NextResponse.json(parent);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}
