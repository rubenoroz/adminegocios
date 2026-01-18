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
                },
                template: true
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
                console.log(`[COMMISSION_DEBUG] Fallback: Searching ALL active enrollments for Student ${feeData.studentId} Course ${feeData.courseId}`);

                const groupEnrollments = await prisma.scheduleEnrollment.findMany({
                    where: {
                        studentId: feeData.studentId,
                        schedule: {
                            courseId: feeData.courseId
                        },
                        status: 'ACTIVE'
                    },
                    include: {
                        schedule: {
                            include: {
                                teacher: {
                                    include: {
                                        employee: true
                                    }
                                }
                            }
                        }
                    }
                });

                console.log(`[COMMISSION_DEBUG] Found ${groupEnrollments.length} active enrollments.`);

                let foundValidTeacher = false;

                for (const enrollment of groupEnrollments) {
                    if (enrollment?.schedule?.teacher?.employee) {
                        const emp = enrollment.schedule.teacher.employee;
                        console.log(`[COMMISSION_DEBUG] Checking Teacher ${emp.firstName} (Schedule ${enrollment.scheduleId}). Model: ${emp.paymentModel}`);

                        if (emp.paymentModel === 'COMMISSION' || emp.paymentModel === 'MIXED') {
                            teacherId = emp.id;
                            const commissionPct = emp.commissionPercentage || 0;

                            // Recalculate based on current payment amount
                            teacherCommission = amount * (commissionPct / 100);
                            console.log(`[COMMISSION_DEBUG] Logic Success: Calculated Commission: ${teacherCommission} (${commissionPct}%)`);
                            foundValidTeacher = true;
                            break; // Stop at first valid teacher
                        }
                    }
                }

                if (!foundValidTeacher) {
                    console.log(`[COMMISSION_DEBUG] Fallback Failed: No valid teacher found in any of the ${groupEnrollments.length} enrollments.`);
                }
            }
        }


        console.log(`[PAYMENT_FINAL] Creating Payment. Teacher: ${teacherId}, Commission: ${teacherCommission}`);

        // NEW: Enrollment Fee Commission Guard
        // Check if this is an enrollment fee and if commissions are enabled for it
        if (teacherCommission > 0) {
            const business = await prisma.business.findUnique({
                where: { id: businessId },
                select: { commissionOnInscription: true }
            });

            // Identify as Enrollment if linked to REGISTRATION template OR title contains "Inscripción"/"Enrollment"
            const normalizedTitle = feeData?.title?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';
            const isEnrollment =
                feeData?.template?.category === 'REGISTRATION' ||
                normalizedTitle.includes('inscripci') ||
                normalizedTitle.includes('enrollment') ||
                normalizedTitle.includes('matricula');

            if (isEnrollment && !business?.commissionOnInscription) {
                console.log(`[PAYMENT_DEBUG] Commission blocked: Fee identified as Enrollment and commissionOnInscription is false.`);
                teacherCommission = 0;
                // We also clear teacherId to prevent it from cluttering the teacher's list if it's 0-value
                // unless we want to track "sales" without commission. For now, let's keep it clean.
                // teacherId = null; // Optional: Decide if we want to unlink the teacher entirely. 
                // Given the user's feedback ("se van al maestro"), unlinking is safer visually.
                teacherId = null;
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
