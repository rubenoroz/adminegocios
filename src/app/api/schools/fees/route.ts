import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, description, amount } = body;

        if (!name || !amount) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const feeType = await prisma.schoolFeeType.create({
            data: {
                name,
                description,
                amount: parseFloat(amount),
                businessId: session.user.businessId!,
            },
        });

        return NextResponse.json(feeType);
    } catch (error) {
        console.error("[FEE_TYPES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const feeTypes = await prisma.schoolFeeType.findMany({
            where: {
                businessId: session.user.businessId!,
            },
            orderBy: {
                name: "asc",
            },
        });

        return NextResponse.json(feeTypes);
    } catch (error) {
        console.error("[FEE_TYPES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
