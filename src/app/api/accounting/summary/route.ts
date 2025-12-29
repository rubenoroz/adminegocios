import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // Get total sales (Income)
        const sales = await prisma.sale.aggregate({
            where: {
                branch: { businessId: user.businessId },
                status: "COMPLETED"
            },
            _sum: { total: true }
        });

        // Get total expenses
        const expenses = await prisma.expense.aggregate({
            where: { businessId: user.businessId },
            _sum: { amount: true }
        });

        const totalIncome = sales._sum.total || 0;
        const totalExpenses = expenses._sum.amount || 0;
        const netProfit = totalIncome - totalExpenses;

        // Get recent transactions
        const transactions = await prisma.transaction.findMany({
            where: { businessId: user.businessId },
            orderBy: { date: 'desc' },
            take: 10
        });

        return NextResponse.json({
            totalIncome,
            totalExpenses,
            netProfit,
            transactions
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
