import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ scholarshipId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { scholarshipId } = await params;

        await prisma.scholarship.delete({
            where: { id: scholarshipId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[SCHOLARSHIP_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ scholarshipId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { scholarshipId } = await params;
        const body = await req.json();

        const scholarship = await prisma.scholarship.update({
            where: { id: scholarshipId },
            data: {
                ...body,
                percentage: body.percentage ? parseFloat(body.percentage) : undefined,
                amount: body.amount ? parseFloat(body.amount) : undefined,
            },
            include: {
                student: {
                    select: {
                        firstName: true,
                        lastName: true,
                        matricula: true,
                    },
                },
            },
        });

        return NextResponse.json(scholarship);
    } catch (error) {
        console.error("[SCHOLARSHIP_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
