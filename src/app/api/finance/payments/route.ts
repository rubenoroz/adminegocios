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
            return NextResponse.json({ error: "VALIDATION_ERROR", message: result.error.issues[0].message }, { status: 400 });
        }

        const { feeId, amount, method } = result.data;
        const businessId = session.user.businessId;

        if (amount <= 0) {
            return NextResponse.json({ error: "INVALID_AMOUNT", message: "El monto del pago debe ser mayor a 0" }, { status: 400 });
        }

        // 1. Calculate Commission (if applicable)
        let teacherCommission = 0;
        let teacherId: string | null = null;
        let reserveAmount = 0;
        let schoolAmount = amount;

        console.log(`[PAYMENT_DEBUG] Processing feeId: ${feeId}, amount: ${amount}`);

        const feeData = await prisma.studentFee.findUnique({
            where: { id: feeId },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        // Commission Logic: Prefer the explicitly stored "expected" values on the Fee
        // This ensures that "Projected" matches "Paid".
        if (feeData) {
            // Check if we have an expected teacher linked
            if (feeData.expectedTeacherId) {
                teacherId = feeData.expectedTeacherId;

                // If we also have a projected amount, we use the IMPLIED percentage 
                // to calculate the commission for THIS partial/full payment.
                // Formula: (ExpectedCommission / TotalFeeAmount) * PaymentAmount
                if ((feeData.expectedCommission || 0) > 0 && feeData.amount > 0) {
                    const inferredRate = Number(feeData.expectedCommission) / Number(feeData.amount);
                    teacherCommission = amount * inferredRate;

                    console.log(`[PAYMENT_DEBUG] Using stored expectation. Inferred Rate: ${inferredRate}, Commission: ${teacherCommission}`);
                } else {
                    // Fallback: If no expected amount, try to fetch current teacher rate?
                    // Ideally expectedCommission should be set. If 0, maybe 0 is correct.
                    console.log(`[PAYMENT_DEBUG] Teacher found (${teacherId}) but expectedCommission is 0 or invalid.`);
                }
            } else {
                // FALLBACK: Try to find teacher via Schedule (Group) Enrollment ONLY if not set on Fee
                // (Retaining existing logic as backup for old records)
                if (feeData.studentId && feeData.courseId) {
                    const groupEnrollment = await prisma.scheduleEnrollment.findFirst({
                        where: {
                            studentId: feeData.studentId,
                            status: 'ACTIVE',
                            schedule: {
                                courseId: feeData.courseId
                            }
                        },
                        include: {
                            schedule: {
                                include: {
                                    teacher: {
                                        include: { employee: true }
                                    }
                                }
                            }
                        }
                    });

                    if (groupEnrollment?.schedule?.teacher?.employee) {
                        const emp = groupEnrollment.schedule.teacher.employee;
                        if (emp.paymentModel === 'COMMISSION' || emp.paymentModel === 'MIXED') {
                            teacherId = emp.id;
                            const pct = emp.commissionPercentage || 0;
                            if (pct > 0) {
                                teacherCommission = amount * (pct / 100);
                            }
                            console.log(`[PAYMENT_DEBUG] Found Group Teacher via fallback: ${emp.firstName}, Commission: ${teacherCommission}`);
                        }
                    }
                }
            }
        }

        schoolAmount = amount - teacherCommission;

        // Create the Payment Record
        const payment = await prisma.studentPayment.create({
            data: {
                studentFeeId: feeId,
                amount: amount,
                method, // CASH, CARD, TRANSFER
                date: new Date(),
                teacherId,
                teacherCommission,
                reserveAmount,
                schoolAmount
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
