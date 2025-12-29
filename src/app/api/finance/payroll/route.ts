import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays, addWeeks, addMonths, differenceInDays, differenceInWeeks, differenceInMonths } from "date-fns";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const businessId = searchParams.get("businessId");

        if (!businessId) {
            return new NextResponse("Missing businessId", { status: 400 });
        }

        const employees = await prisma.employee.findMany({
            where: { businessId },
            orderBy: { lastName: "asc" }
        });

        const now = new Date();
        const payrollData = employees.map(employee => {
            let isDue = false;
            let nextPaymentDate = null;

            if (employee.lastPaymentDate && employee.paymentFrequency) {
                const lastPayment = new Date(employee.lastPaymentDate);

                switch (employee.paymentFrequency) {
                    case "WEEKLY":
                        const weeksDiff = differenceInWeeks(now, lastPayment);
                        isDue = weeksDiff >= 1;
                        nextPaymentDate = addWeeks(lastPayment, 1);
                        break;
                    case "BIWEEKLY":
                        const biweeksDiff = differenceInWeeks(now, lastPayment);
                        isDue = biweeksDiff >= 2;
                        nextPaymentDate = addWeeks(lastPayment, 2);
                        break;
                    case "MONTHLY":
                        const monthsDiff = differenceInMonths(now, lastPayment);
                        isDue = monthsDiff >= 1;
                        nextPaymentDate = addMonths(lastPayment, 1);
                        break;
                }
            } else {
                // Never paid before, consider due
                isDue = true;
            }

            return {
                ...employee,
                isDue,
                nextPaymentDate
            };
        });

        return NextResponse.json(payrollData);
    } catch (error) {
        console.error("[PAYROLL_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { employeeId, amount, description } = await req.json();

        if (!employeeId || !amount) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const employee = await prisma.employee.findUnique({
            where: { id: employeeId }
        });

        if (!employee) {
            return new NextResponse("Employee not found", { status: 404 });
        }

        // 1. Create Expense record
        const expense = await prisma.expense.create({
            data: {
                description: description || `Salary payment - ${employee.firstName} ${employee.lastName}`,
                amount: parseFloat(amount),
                category: "SALARY",
                businessId: employee.businessId
            }
        });

        // 2. Create Transaction
        await prisma.transaction.create({
            data: {
                type: "EXPENSE",
                amount: parseFloat(amount),
                description: expense.description,
                businessId: employee.businessId,
                expenseId: expense.id
            }
        });

        // 3. Update employee's lastPaymentDate
        await prisma.employee.update({
            where: { id: employeeId },
            data: { lastPaymentDate: new Date() }
        });

        return NextResponse.json({ success: true, expense });
    } catch (error) {
        console.error("[PAYROLL_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
