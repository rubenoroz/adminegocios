import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Cancel a fee with reason
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ feeId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { feeId } = await params;
        const body = await request.json();
        const { reason, customReason } = body;

        if (!feeId) {
            return NextResponse.json({ error: "Fee ID is required" }, { status: 400 });
        }

        // Valid cancellation reasons
        const validReasons = ["GROUP_CLOSED", "COURSE_ENDED", "STUDENT_DROPPED", "DUPLICATE", "ERROR", "OTHER"];
        if (!reason || !validReasons.includes(reason)) {
            return NextResponse.json({
                error: "Invalid cancellation reason",
                validReasons
            }, { status: 400 });
        }

        // Check if fee exists and belongs to user's business
        const fee = await prisma.studentFee.findUnique({
            where: { id: feeId },
            include: {
                student: { select: { businessId: true } },
                payments: true
            }
        });

        if (!fee) {
            return NextResponse.json({ error: "Fee not found" }, { status: 404 });
        }

        // Check if fee belongs to user's business
        if (fee.student.businessId !== session.user.businessId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Check if fee is already cancelled or paid
        if (fee.status === "CANCELLED") {
            return NextResponse.json({ error: "Fee is already cancelled" }, { status: 400 });
        }

        if (fee.status === "PAID") {
            return NextResponse.json({
                error: "Cannot cancel a fully paid fee. Consider creating a refund instead."
            }, { status: 400 });
        }

        // If there are partial payments, warn about it
        const totalPaid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
        if (totalPaid > 0) {
            // Still allow cancellation but include warning in response
            console.log(`[FEE_CANCEL] Fee ${feeId} has ${totalPaid} in payments. Cancelling anyway.`);
        }

        // Cancel the fee
        const cancellationReasonText = reason === "OTHER" && customReason
            ? `OTHER: ${customReason}`
            : reason;

        const updatedFee = await prisma.studentFee.update({
            where: { id: feeId },
            data: {
                status: "CANCELLED",
                cancelledAt: new Date(),
                cancellationReason: cancellationReasonText
            }
        });

        return NextResponse.json({
            success: true,
            fee: updatedFee,
            message: totalPaid > 0
                ? `Cargo cancelado. Nota: Este cargo tenía ${totalPaid.toFixed(2)} pagados.`
                : "Cargo cancelado exitosamente"
        });

    } catch (error) {
        console.error("[FEE_CANCEL] Error:", error);
        return NextResponse.json({ error: "Failed to cancel fee" }, { status: 500 });
    }
}

// Get cancellation reasons for dropdown
export async function GET() {
    return NextResponse.json({
        reasons: [
            { value: "GROUP_CLOSED", label: "Grupo cerrado" },
            { value: "COURSE_ENDED", label: "Curso terminado" },
            { value: "STUDENT_DROPPED", label: "Alumno dado de baja" },
            { value: "DUPLICATE", label: "Cargo duplicado" },
            { value: "ERROR", label: "Error de captura" },
            { value: "OTHER", label: "Otro motivo" }
        ]
    });
}
