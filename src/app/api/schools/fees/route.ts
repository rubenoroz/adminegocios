import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, category, amount, recurrence } = body;

        if (!name || !amount) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const feeTemplate = await prisma.schoolFeeTemplate.create({
            data: {
                name,
                category: category || "OTHER",
                amount: parseFloat(amount),
                recurrence: recurrence || "MONTHLY",
                businessId: session.user.businessId!,
            },
        });

        return NextResponse.json(feeTemplate);
    } catch (error) {
        console.error("[FEE_TEMPLATES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const feeTemplates = await prisma.schoolFeeTemplate.findMany({
            where: {
                businessId: session.user.businessId!,
            },
            orderBy: {
                name: "asc",
            },
        });

        return NextResponse.json(feeTemplates);
    } catch (error) {
        console.error("[FEE_TEMPLATES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
