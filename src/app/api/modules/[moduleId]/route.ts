import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ moduleId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { moduleId } = await params;

        const module = await prisma.courseModule.delete({
            where: { id: moduleId }
        });

        return NextResponse.json(module);
    } catch (error) {
        console.error("[MODULE_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
