import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// PATCH - Reorder modules
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { courseId } = await params;
        const { orderedIds } = await request.json();

        if (!orderedIds || !Array.isArray(orderedIds)) {
            return NextResponse.json(
                { error: "orderedIds array is required" },
                { status: 400 }
            );
        }

        // Update each module's order position
        const updatePromises = orderedIds.map((id: string, index: number) =>
            prisma.courseModule.update({
                where: { id },
                data: { order: index },
            })
        );

        await Promise.all(updatePromises);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error reordering modules:", error);
        return NextResponse.json(
            { error: "Failed to reorder modules" },
            { status: 500 }
        );
    }
}
