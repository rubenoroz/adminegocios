import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Retrieve business settings
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.businessId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const business = await prisma.business.findUnique({
            where: { id: session.user.businessId },
            select: {
                id: true,
                name: true,
                type: true,
                enableParentsModule: true,
                defaultPaymentDay: true,
                paymentGraceDays: true,
                expenseReservePercentage: true,
                benefitsReservePercentage: true,
                enrollmentFee: true,
                enrollmentFeeMode: true,
            }
        });

        if (!business) {
            return new NextResponse("Business not found", { status: 404 });
        }

        return NextResponse.json(business);
    } catch (error) {
        console.error("[BUSINESS_SETTINGS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

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
