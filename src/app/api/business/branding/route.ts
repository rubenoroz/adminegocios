import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.businessId) {
            return NextResponse.json(
                { error: "No autenticado o sin negocio" },
                { status: 401 }
            );
        }

        const business = await prisma.business.findUnique({
            where: { id: session.user.businessId },
            select: {
                logoUrl: true,
                logoOrientation: true,
                primaryColor: true,
                sidebarColor: true,
                logoHeight: true,
            },
        });

        if (!business) {
            return NextResponse.json(
                { error: "Negocio no encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json(business);
    } catch (error) {
        console.error("Error fetching branding:", error);
        return NextResponse.json(
            { error: "Error al obtener configuración de marca" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.businessId) {
            return NextResponse.json(
                { error: "No autenticado o sin negocio" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { primaryColor, sidebarColor, logoHeight } = body;

        // Validar formato hex
        const hexRegex = /^#[0-9A-F]{6}$/i;
        if (primaryColor && !hexRegex.test(primaryColor)) {
            return NextResponse.json(
                { error: "Color primario inválido. Use formato #RRGGBB" },
                { status: 400 }
            );
        }

        if (sidebarColor && !hexRegex.test(sidebarColor)) {
            return NextResponse.json(
                { error: "Color de sidebar inválido. Use formato #RRGGBB" },
                { status: 400 }
            );
        }

        const updateData: any = {};
        if (primaryColor) updateData.primaryColor = primaryColor;
        if (sidebarColor) updateData.sidebarColor = sidebarColor;
        if (logoHeight) updateData.logoHeight = logoHeight;

        const business = await prisma.business.update({
            where: { id: session.user.businessId },
            data: updateData,
            select: {
                primaryColor: true,
                sidebarColor: true,
                logoHeight: true,
            },
        });

        return NextResponse.json({
            success: true,
            branding: business,
        });
    } catch (error) {
        console.error("Error updating branding:", error);
        return NextResponse.json(
            { error: "Error al actualizar configuración de marca" },
            { status: 500 }
        );
    }
}
