import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Only OWNER can delete users
        if (session.user.role !== "OWNER") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const { id } = await params;

        // Don't allow deleting yourself
        if (id === session.user.id) {
            return NextResponse.json(
                { message: "No puedes eliminar tu propio usuario" },
                { status: 400 }
            );
        }

        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[USER_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
