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

        console.log(`[PAYMENT_DEBUG] Fee Data found:`, {
            hasCourse: !!feeData?.course,
            courseId: feeData?.course?.id,
            hasTeacher: !!feeData?.course?.teacher,
            teacherName: feeData?.course?.teacher?.name,
            hasEmployee: !!feeData?.course?.teacher?.employee
        });

        // Helper to get Commission % and ID
        const getTeacherCommissionData = (teacherUser: any): { id: string, pct: number, reservePct: number } | null => {
            if (!teacherUser?.employee) return null;
            const emp = teacherUser.employee;
            if (emp.paymentModel === 'COMMISSION' || emp.paymentModel === 'MIXED') {
                return {
                    id: emp.id,
                    pct: emp.commissionPercentage || 0,
                    reservePct: emp.reservePercentage || 0
                };
            }
            return null;
        };

        let commissionData = null;

        // 1. Try to find teacher via Schedule (Group) Enrollment
        if (feeData?.studentId && feeData?.courseId) {
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

            if (groupEnrollment?.schedule?.teacher) {
                console.log(`[PAYMENT_DEBUG] Found Group Teacher: ${groupEnrollment.schedule.teacher.name}`);
                commissionData = getTeacherCommissionData(groupEnrollment.schedule.teacher);
            }
        }

        // 2. Fallback to Course Main Teacher if no group teacher found
        if (!commissionData && feeData?.course?.teacher) {
            console.log(`[PAYMENT_DEBUG] Using Course Main Teacher: ${feeData.course.teacher.name}`);
            commissionData = getTeacherCommissionData(feeData.course.teacher);
        }

        if (commissionData) {
            teacherId = commissionData.id;
            console.log(`[PAYMENT_DEBUG] Teacher ID for commission: ${teacherId}, %: ${commissionData.pct}`);

            if (commissionData.pct > 0) {
                teacherCommission = amount * (commissionData.pct / 100);
                console.log(`[PAYMENT_DEBUG] Commission calculated: ${teacherCommission}`);
            }

            if (commissionData.reservePct > 0 && teacherCommission > 0) {
                reserveAmount = teacherCommission * (commissionData.reservePct / 100);
                console.log(`[PAYMENT_DEBUG] Reserve calculated: ${reserveAmount}`);
            }
        } else {
            console.log(`[PAYMENT_DEBUG] No commissionable teacher found via Group or Course`);
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
