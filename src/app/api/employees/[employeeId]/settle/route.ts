
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/employees/[employeeId]/settle
export async function POST(
    req: Request,
    { params }: { params: Promise<{ employeeId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { employeeId } = await params;
    if (!employeeId) {
        return NextResponse.json({ error: "Employee ID required" }, { status: 400 });
    }

    try {
        // 1. Get user business
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { businessId: true }
        });

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // 2. Find pending payments to settle
        const pendingPayments = await prisma.studentPayment.findMany({
            where: {
                teacherId: employeeId,
                teacherCommission: { gt: 0 },
                isSettled: false,
                // Ensure payment belongs to same business (via StudentFee -> Student -> Business)
                studentFee: {
                    student: {
                        businessId: user.businessId
                    }
                }
            }
        });

        if (pendingPayments.length === 0) {
            return NextResponse.json({ error: "No pending commissions to settle" }, { status: 400 });
        }

        // 3. Calculate total
        const totalAmount = pendingPayments.reduce((sum, p) => sum + (p.teacherCommission || 0), 0);

        // 4. Create Settlement Transaction
        const settlement = await prisma.$transaction(async (tx) => {
            // Create CommissionSettlement record
            const newSettlement = await tx.commissionSettlement.create({
                data: {
                    amount: totalAmount,
                    method: 'CASH', // Default or from body? Let's assume CASH for now or simplistic.
                    employeeId: employeeId,
                    businessId: user.businessId!,
                    date: new Date()
                }
            });

            // Update payments to mark as settled
            await tx.studentPayment.updateMany({
                where: {
                    id: { in: pendingPayments.map(p => p.id) }
                },
                data: {
                    isSettled: true,
                    settlementId: newSettlement.id
                }
            });

            // Create an EXPENSE record for the business automatically?
            // "Commission Payment" expense.
            await tx.expense.create({
                data: {
                    description: `Pago de comisiones (Liquidación)`,
                    amount: totalAmount,
                    category: 'SALARY',
                    businessId: user.businessId!,
                    date: new Date()
                }
            });

            return newSettlement;
        });

        return NextResponse.json({
            success: true,
            settlement,
            settledCount: pendingPayments.length
        });

    } catch (error) {
        console.error("Error settling commissions:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
