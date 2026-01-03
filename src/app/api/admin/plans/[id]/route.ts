import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user || session.user.role !== "SUPERADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const plan = await prisma.plan.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { businesses: true }
                }
            }
        });

        if (!plan) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }

        return NextResponse.json(plan);
    } catch (error) {
        console.error("Error fetching plan:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user || session.user.role !== "SUPERADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, price, interval, maxCourses, maxTeachers, maxStudents, maxBranches, maxInventoryItems, isActive, description, features } = body;

        const updatedPlan = await prisma.plan.update({
            where: { id },
            data: {
                name,
                price,
                interval,
                maxCourses,
                maxTeachers,
                maxStudents,
                maxBranches,
                maxInventoryItems,
                isActive,
                description,
                features
            }
        });

        return NextResponse.json(updatedPlan);
    } catch (error) {
        console.error("Error updating plan:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user || session.user.role !== "SUPERADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if any businesses are using this plan
        const businessCount = await prisma.business.count({
            where: { planId: id }
        });

        if (businessCount > 0) {
            return NextResponse.json(
                { error: `No se puede eliminar. ${businessCount} negocios están usando este plan.` },
                { status: 400 }
            );
        }

        await prisma.plan.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting plan:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
