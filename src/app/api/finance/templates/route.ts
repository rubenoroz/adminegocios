import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const businessId = searchParams.get("businessId");

        if (!businessId) {
            return new NextResponse("Business ID required", { status: 400 });
        }

        const templates = await prisma.schoolFeeTemplate.findMany({
            where: { businessId },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(templates);
    } catch (error) {
        console.error("[FEE_TEMPLATES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, category, amount, recurrence, businessId } = body;

        if (!name || !amount || !businessId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const template = await prisma.schoolFeeTemplate.create({
            data: {
                name,
                category: category || "TUITION",
                amount: parseFloat(amount),
                recurrence: recurrence || "MONTHLY",
                businessId
            }
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error("[FEE_TEMPLATES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
