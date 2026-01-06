import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.businessId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const businessId = searchParams.get("businessId") || session.user.businessId;

        // Get current month start and end
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Get all fees for this business (through students)
        const fees = await prisma.studentFee.findMany({
            where: {
                student: {
                    businessId: businessId
                }
            },
            include: {
                payments: true
            }
        });

        // Calculate stats
        let collected = 0;
        let pending = 0;
        let overdue = 0;
        let total = 0;

        fees.forEach(fee => {
            const paidAmount = fee.payments.reduce((sum, p) => sum + p.amount, 0);
            const remaining = fee.amount - paidAmount;

            total += fee.amount;

            // Collected this month
            fee.payments.forEach(payment => {
                if (payment.date >= monthStart && payment.date <= monthEnd) {
                    collected += payment.amount;
                }
            });

            // Pending (not fully paid and not overdue yet)
            if (remaining > 0 && fee.dueDate >= now) {
                pending += remaining;
            }

            // Overdue (not fully paid and past due date)
            if (remaining > 0 && fee.dueDate < now) {
                overdue += remaining;
            }
        });

        return NextResponse.json({
            collected: Math.round(collected * 100) / 100,
            pending: Math.round(pending * 100) / 100,
            overdue: Math.round(overdue * 100) / 100,
            total: Math.round(total * 100) / 100
        });

    } catch (error) {
        console.error("[FINANCE_STATS_GET]", error);
        return NextResponse.json({ collected: 0, pending: 0, overdue: 0, total: 0 });
    }
}
