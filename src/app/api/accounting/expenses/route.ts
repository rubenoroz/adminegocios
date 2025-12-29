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

        const expenses = await prisma.expense.findMany({
            where: { businessId: user.businessId },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json(expenses);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { description, amount, category } = body;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // Create Expense
        const expense = await prisma.expense.create({
            data: {
                description,
                amount: parseFloat(amount),
                category,
                businessId: user.businessId
            }
        });

        // Create Transaction record
        await prisma.transaction.create({
            data: {
                type: "EXPENSE",
                amount: parseFloat(amount),
                description: `Gasto: ${description}`,
                businessId: user.businessId,
                expenseId: expense.id
            }
        });

        return NextResponse.json(expense);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
