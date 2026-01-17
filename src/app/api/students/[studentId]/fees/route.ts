import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ studentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { studentId } = await params;

        const fees = await prisma.studentFee.findMany({
            where: {
                studentId: studentId,
            },
            include: {
                payments: true,
                template: true,
                course: {
                    include: {
                        teacher: true  // Include the teacher of the course
                    }
                }
            },
            orderBy: {
                dueDate: "desc",
            },
        });

        return NextResponse.json(fees);
    } catch (error) {
        console.error("[STUDENT_FEES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ studentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { studentId } = await params;
        const body = await req.json();
        const { feeId, amount, method, teacherId, teacherCommission, reserveAmount, schoolAmount } = body;

        if (!feeId || !amount || !method) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const paymentAmount = parseFloat(amount);
        let finalTeacherId = teacherId || null;
        let finalCommission: number | null = teacherCommission ? parseFloat(teacherCommission) : null;

        // AUTOMATIC COMMISSION CALCULATION
        // We attempt auto-calculation if no teacher is provided.
        // The logic inside will determine if we SHOULD skip based on configuration (e.g. Inscriptions).
        if (!finalTeacherId && !finalCommission) {
            try {
                // 1. Get Course ID and Template from Fee to check type
                const feeRecord = await prisma.studentFee.findUnique({
                    where: { id: feeId },
                    select: {
                        courseId: true,
                        template: true, // To check if it's INSCRIPTION
                        expectedTeacherId: true,
                        expectedCommission: true
                    }
                });

                // 2. Priority check: Use projected values if available
                if (feeRecord?.expectedTeacherId && feeRecord?.expectedCommission) {
                    finalTeacherId = feeRecord.expectedTeacherId;
                    finalCommission = feeRecord.expectedCommission;
                    console.log(`[PAYMENT] Using projected commission: Teacher=${finalTeacherId}, Amount=${finalCommission}`);
                }
                // 3. Fallback: Auto-calculate if no projection exists
                else if (feeRecord?.courseId) {
                    // 2. Find Student's Schedule for this course
                    const enrollment = await prisma.scheduleEnrollment.findFirst({
                        where: {
                            studentId: studentId,
                            schedule: {
                                courseId: feeRecord.courseId
                            }
                        },
                        include: {
                            schedule: {
                                include: {
                                    teacher: {
                                        include: {
                                            employee: true // Need employee ID for StudentPayment
                                        }
                                    },
                                    business: true // Need to check commissionOnInscription
                                }
                            }
                        }
                    });

                    // 3. Check Global Config for Inscription
                    const businessConfig = enrollment?.schedule?.business;

                    // Safe access to template properties to avoid type errors
                    const templateName = (feeRecord.template as any)?.name || (feeRecord.template as any)?.title || '';
                    const templateType = (feeRecord.template as any)?.type || (feeRecord.template as any)?.category || '';

                    const isInscription = templateType === 'INSCRIPTION' || templateName.toLowerCase().includes('inscri');

                    // Force boolean check
                    const allowInscriptionCommission = (businessConfig as any)?.commissionOnInscription === true;

                    const shouldCalculate = !isInscription || (isInscription && allowInscriptionCommission);

                    if (shouldCalculate) {
                        // 4. If teacher found, calculate commission
                        const teacherUser = enrollment?.schedule?.teacher;
                        if (teacherUser?.employee && teacherUser.paymentModel === 'COMMISSION' && teacherUser.commissionPercentage) {
                            finalTeacherId = teacherUser.employee.id;
                            finalCommission = (paymentAmount * teacherUser.commissionPercentage) / 100;
                            console.log(`[AUTO-COMMISSION] Teacher: ${teacherUser.name}, Rate: ${teacherUser.commissionPercentage}%, Amount: ${finalCommission}`);
                        }
                    } else {
                        console.log(`[AUTO-COMMISSION] Skipped. Is Inscription: ${isInscription}, Config Allowed: ${allowInscriptionCommission}`);
                    }
                }
            } catch (err) {
                console.error("Error calculating auto-commission:", err);
            }
        }

        // 1. Create the payment record with commission data
        const payment = await prisma.studentPayment.create({
            data: {
                studentFeeId: feeId,
                amount: paymentAmount,
                method,
                // Link to teacher for commission tracking
                teacherId: finalTeacherId,
                // Commission tracking
                teacherCommission: finalCommission,
                reserveAmount: reserveAmount ? parseFloat(reserveAmount) : null,
                schoolAmount: schoolAmount ? parseFloat(schoolAmount) : null,
                // Invoicing
                customerId: body.customerId || undefined,
                requiresInvoice: body.requiresInvoice || false,
            },
        });

        // 2. Update the fee status
        const fee = await prisma.studentFee.findUnique({
            where: { id: feeId },
            include: { payments: true },
        });

        if (fee) {
            const totalPaid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
            let newStatus = "PENDING";
            if (totalPaid >= fee.amount) {
                newStatus = "PAID";
            } else if (totalPaid > 0) {
                newStatus = "PARTIAL";
            }

            await prisma.studentFee.update({
                where: { id: feeId },
                data: { status: newStatus },
            });
        }

        // 3. Create a Transaction for accounting
        const student = await prisma.student.findUnique({
            where: { id: studentId },
        });

        if (student) {
            const transaction = await prisma.transaction.create({
                data: {
                    type: "INCOME",
                    amount: paymentAmount,
                    description: `Payment for ${fee?.title || "Fee"} - Student: ${student.firstName} ${student.lastName}`,
                    businessId: student.businessId,
                },
            });

            // Link transaction to payment
            await prisma.studentPayment.update({
                where: { id: payment.id },
                data: { transactionId: transaction.id }
            });
        }

        return NextResponse.json(payment);
    } catch (error) {
        console.error("[STUDENT_PAYMENT_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
