import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const plans = await prisma.plan.findMany({
            where: { isActive: true },
            orderBy: { price: "asc" },
            select: {
                id: true,
                name: true,
                price: true,
                interval: true,
                description: true,
                features: true,
            }
        });

        return NextResponse.json(plans);
    } catch (error) {
        console.error("Error fetching public plans:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
