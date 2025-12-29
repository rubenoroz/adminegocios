import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.businessId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { expenseReservePercentage, benefitsReservePercentage } = body;

        const business = await prisma.business.update({
            where: { id: session.user.businessId },
            data: {
                expenseReservePercentage: parseFloat(expenseReservePercentage),
                benefitsReservePercentage: parseFloat(benefitsReservePercentage)
            }
        });

        return NextResponse.json(business);
    } catch (error) {
        console.error("[BUSINESS_SETTINGS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
