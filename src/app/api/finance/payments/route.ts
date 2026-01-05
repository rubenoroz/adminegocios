import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const paymentSchema = z.object({
    feeId: z.string().min(1, "Fee ID required"),
    amount: z.union([z.string(), z.number()]).transform((val) => parseFloat(val.toString())),
    method: z.enum(["CASH", "CARD", "TRANSFER"]),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "UNAUTHORIZED", message: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();

        // ZOD VALIDATION
        const result = paymentSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: "VALIDATION_ERROR", message: result.error.errors[0].message }, { status: 400 });
        }

        const { feeId, amount, method } = result.data;
        const businessId = session.user.businessId;

        if (amount <= 0) {
            return NextResponse.json({ error: "INVALID_AMOUNT", message: "El monto del pago debe ser mayor a 0" }, { status: 400 });
        }

        // 1. Create the Payment Record
        const payment = await prisma.studentPayment.create({
            data: {
                studentFeeId: feeId,
                amount: amount,
                method, // CASH, CARD, TRANSFER
                date: new Date()
            }
        });

        // 2. Register as a Transaction (Income) for traceability
        await prisma.transaction.create({
            data: {
                type: "INCOME",
                amount: amount,
                description: `Pago de colegiatura/servicio`,
                businessId: businessId!, // Assert non-null as we checked session
                studentPayment: {
                    connect: { id: payment.id }
                }
            }
        });

        // 3. Update Fee Status
        const fee = await prisma.studentFee.findUnique({
            where: { id: feeId },
            include: { payments: true }
        });

        if (fee) {
            // Re-fetch to get all payments including the new one
            const updatedFee = await prisma.studentFee.findUnique({
                where: { id: feeId },
                include: { payments: true }
            });

            if (updatedFee) {
                const totalPaidNow = updatedFee.payments.reduce((sum, p) => sum + p.amount, 0);
                let newStatus = fee.status;

                if (totalPaidNow >= fee.amount) {
                    newStatus = "PAID";
                } else if (totalPaidNow > 0) {
                    newStatus = "PARTIAL";
                }

                if (newStatus !== fee.status) {
                    await prisma.studentFee.update({
                        where: { id: feeId },
                        data: { status: newStatus }
                    });
                }
            }
        }

        return NextResponse.json(payment);
    } catch (error) {
        console.error("[PAYMENTS_POST]", error);
        return NextResponse.json({ error: "INTERNAL_ERROR", message: "Error al registrar pago" }, { status: 500 });
    }
}
