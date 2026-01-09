import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const feeId = params.id;
        console.log("[DELETE_FEE] Attempting to delete fee:", feeId);

        const session = await getServerSession(authOptions);
        if (!session?.user?.businessId) {
            console.log("[DELETE_FEE] Unauthorized - No businessId");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify fee exists and belongs to business
        const fee = await prisma.studentFee.findUnique({
            where: { id: feeId },
            include: {
                student: true,
                payments: true
            }
        });

        if (!fee) {
            return NextResponse.json({ error: "Cobro no encontrado" }, { status: 404 });
        }

        if (fee.student.businessId !== session.user.businessId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (fee.payments.length > 0) {
            return NextResponse.json({
                error: "No se puede eliminar un cobro que ya tiene pagos registrados."
            }, { status: 400 });
        }

        await prisma.studentFee.delete({
            where: { id: feeId }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error deleting fee:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
