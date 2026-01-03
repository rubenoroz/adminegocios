
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "SUPERADMIN") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const { planId, enabledModules, recalculate } = body;

        // Construct update data
        const updateData: any = {};

        if (planId) {
            updateData.planId = planId;
        }

        if (enabledModules) {
            updateData.enabledModules = enabledModules;
        }

        // If limits recalculation was requested (recalculate: true), 
        // typically logic would go here, but for now we just update the plan/modules
        // which drives the limits in the app logic.

        const updatedBusiness = await prisma.business.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updatedBusiness);
    } catch (error) {
        console.error("[UPDATE_BUSINESS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "SUPERADMIN") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id } = await params;

        // Transaction to ensure cleanup
        await prisma.$transaction(async (tx) => {
            // 1. Delete Users manually (no cascade on schema)
            await tx.user.deleteMany({
                where: { businessId: id }
            });

            // 2. Delete Business (Cascades to Branches, Products, Students, etc.)
            await tx.business.delete({
                where: { id }
            });
        });

        return new NextResponse("Business deleted successfully", { status: 200 });
    } catch (error) {
        console.error("[DELETE_BUSINESS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
