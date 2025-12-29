import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ templateId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { templateId } = await params;

        await prisma.schoolFeeTemplate.delete({
            where: { id: templateId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[FEE_TEMPLATE_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ templateId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { templateId } = await params;
        const body = await req.json();

        const template = await prisma.schoolFeeTemplate.update({
            where: { id: templateId },
            data: {
                ...body,
                amount: body.amount ? parseFloat(body.amount) : undefined,
                lateFee: body.lateFee ? parseFloat(body.lateFee) : undefined,
                dayDue: body.dayDue ? parseInt(body.dayDue) : undefined,
            },
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error("[FEE_TEMPLATE_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
