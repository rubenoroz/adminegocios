
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "SUPERADMIN") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id } = await params;

        const business = await prisma.business.findUnique({
            where: { id },
            include: {
                plan: true,
                branches: true,
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            }
        });

        if (!business) {
            return new NextResponse("Business not found", { status: 404 });
        }

        // Get counts
        const coursesCount = await prisma.course.count({ where: { businessId: id } });
        const teachersCount = await prisma.employee.count({
            where: {
                businessId: id,
                role: "TEACHER"
            }
        });
        const studentsCount = await prisma.student.count({ where: { businessId: id } });

        return NextResponse.json({
            ...business,
            coursesCount,
            teachersCount,
            studentsCount
        });
    } catch (error) {
        console.error("[GET_BUSINESS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

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
