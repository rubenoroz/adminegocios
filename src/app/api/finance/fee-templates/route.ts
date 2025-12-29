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

        const templates = await prisma.schoolFeeTemplate.findMany({
            where: {
                businessId: session.user.businessId,
            },
            orderBy: {
                category: "asc",
            },
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
        if (!session?.user?.email || !session.user.businessId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, category, amount, recurrence, dayDue, lateFee } = body;

        if (!name || !category || !amount || !recurrence) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const template = await prisma.schoolFeeTemplate.create({
            data: {
                name,
                category,
                amount: parseFloat(amount),
                recurrence,
                dayDue: dayDue ? parseInt(dayDue) : null,
                lateFee: lateFee ? parseFloat(lateFee) : null,
                businessId: session.user.businessId,
            },
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error("[FEE_TEMPLATES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
