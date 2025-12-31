import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalculateBusinessCounters } from "@/lib/plan-limits";

// GET /api/admin/businesses/[id] - Obtener detalles de un negocio
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (user?.role !== "SUPERADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const business = await prisma.business.findUnique({
            where: { id },
            include: {
                plan: true,
                branches: true,
                users: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true
                    }
                }
            }
        });

        if (!business) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        return NextResponse.json(business);
    } catch (error) {
        console.error("Error fetching business:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// PATCH /api/admin/businesses/[id] - Actualizar plan de un negocio
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (user?.role !== "SUPERADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { planId, recalculate } = body;

        if (!planId) {
            return NextResponse.json({ error: "planId is required" }, { status: 400 });
        }

        // Verificar que el plan existe
        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        if (!plan) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }

        // Actualizar plan del negocio
        const business = await prisma.business.update({
            where: { id },
            data: { planId },
            include: { plan: true }
        });

        // Si se solicita, recalcular contadores
        if (recalculate) {
            await recalculateBusinessCounters(id);
        }

        return NextResponse.json(business);
    } catch (error) {
        console.error("Error updating business:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
