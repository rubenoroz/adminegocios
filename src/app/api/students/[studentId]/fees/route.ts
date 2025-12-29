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

        // 1. Create the payment record with commission data
        const payment = await prisma.studentPayment.create({
            data: {
                studentFeeId: feeId,
                amount: paymentAmount,
                method,
                // Commission tracking
                teacherId: teacherId || null,
                teacherCommission: teacherCommission ? parseFloat(teacherCommission) : null,
                reserveAmount: reserveAmount ? parseFloat(reserveAmount) : null,
                schoolAmount: schoolAmount ? parseFloat(schoolAmount) : null,
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
