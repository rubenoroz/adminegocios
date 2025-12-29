import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const business = await prisma.business.findUnique({
            where: { id: session.user.businessId },
            select: { gradingConfig: true }
        });

        const config = business?.gradingConfig ? JSON.parse(business.gradingConfig) : null;

        // Default config if none exists
        const defaultConfig = {
            periods: [
                { key: "PARTIAL_1", label: "Parcial 1", short: "P1", weight: 0.2 },
                { key: "PARTIAL_2", label: "Parcial 2", short: "P2", weight: 0.2 },
                { key: "PARTIAL_3", label: "Parcial 3", short: "P3", weight: 0.2 },
                { key: "FINAL", label: "Examen Final", short: "Final", weight: 0.4 }
            ],
            passingGrade: 70
        };

        return NextResponse.json(config || defaultConfig);
    } catch (error) {
        console.error("Error fetching academic settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data = await req.json();

        // Basic validation
        if (!data.periods || !Array.isArray(data.periods)) {
            return NextResponse.json({ error: "Invalid format" }, { status: 400 });
        }

        await prisma.business.update({
            where: { id: session.user.businessId },
            data: {
                gradingConfig: JSON.stringify(data)
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating academic settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
