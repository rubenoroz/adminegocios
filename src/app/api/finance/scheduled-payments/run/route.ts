import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays, addWeeks, addMonths, addYears, setDate } from "date-fns";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { businessId } = await req.json();

        if (!businessId) {
            return new NextResponse("Missing businessId", { status: 400 });
        }

        const now = new Date();
        let processedCount = 0;
        let errorCount = 0;

        // Find all active scheduled payments that are due
        const duePayments = await prisma.scheduledPayment.findMany({
            where: {
                businessId,
                active: true,
                nextRunDate: { lte: now },
                OR: [
                    { endDate: null },
                    { endDate: { gte: now } }
                ]
            },
            include: {
                student: true,
                employee: true,
                feeTemplate: true
            }
        });

        for (const payment of duePayments) {
            try {
                if (payment.type === "STUDENT_FEE" && payment.student && payment.feeTemplate) {
                    // Generate student fee
                    let finalAmount = payment.feeTemplate.amount;
                    let discountApplied = 0;

                    // Check for active scholarships
                    const scholarships = await prisma.scholarship.findMany({
                        where: {
                            studentId: payment.studentId!,
                            active: true
                        }
                    });

                    if (scholarships.length > 0) {
                        const scholarship = scholarships[0];
                        if (scholarship.percentage) {
                            discountApplied = (payment.feeTemplate.amount * scholarship.percentage) / 100;
                            finalAmount -= discountApplied;
                        } else if (scholarship.amount) {
                            discountApplied = scholarship.amount;
                            finalAmount -= discountApplied;
                        }
                    }

                    if (finalAmount < 0) finalAmount = 0;

                    await prisma.studentFee.create({
                        data: {
                            title: `${payment.feeTemplate.name} - ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
                            amount: finalAmount,
                            originalAmount: payment.feeTemplate.amount,
                            discountApplied,
                            dueDate: payment.nextRunDate,
                            studentId: payment.studentId!,
                            templateId: payment.feeTemplateId!,
                            status: "PENDING"
                        }
                    });

                    processedCount++;
                } else if (payment.type === "EMPLOYEE_SALARY" && payment.employee) {
                    // Record employee payment
                    const expense = await prisma.expense.create({
                        data: {
                            description: `Salary payment - ${payment.employee.firstName} ${payment.employee.lastName}`,
                            amount: payment.employee.salary || 0,
                            category: "SALARY",
                            businessId: payment.businessId
                        }
                    });

                    await prisma.transaction.create({
                        data: {
                            type: "EXPENSE",
                            amount: payment.employee.salary || 0,
                            description: expense.description,
                            businessId: payment.businessId,
                            expenseId: expense.id
                        }
                    });

                    await prisma.employee.update({
                        where: { id: payment.employeeId! },
                        data: { lastPaymentDate: now }
                    });

                    processedCount++;
                }

                // Calculate next run date
                const nextRunDate = calculateNextRunDate(
                    payment.nextRunDate,
                    payment.recurrence,
                    payment.dayOfMonth,
                    payment.dayOfWeek
                );

                // Update scheduled payment
                await prisma.scheduledPayment.update({
                    where: { id: payment.id },
                    data: {
                        lastRun: now,
                        nextRunDate,
                        // Deactivate if past end date
                        active: payment.endDate && nextRunDate > payment.endDate ? false : true
                    }
                });
            } catch (error) {
                console.error(`Error processing scheduled payment ${payment.id}:`, error);
                errorCount++;
            }
        }

        return NextResponse.json({
            success: true,
            processedCount,
            errorCount,
            totalDue: duePayments.length
        });
    } catch (error) {
        console.error("[SCHEDULED_PAYMENTS_RUN]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

function calculateNextRunDate(
    lastRun: Date,
    recurrence: string,
    dayOfMonth?: number | null,
    dayOfWeek?: number | null
): Date {
    switch (recurrence) {
        case 'DAILY':
            return addDays(lastRun, 1);
        case 'WEEKLY':
            return addWeeks(lastRun, 1);
        case 'BIWEEKLY':
            return addWeeks(lastRun, 2);
        case 'MONTHLY':
            const nextMonth = addMonths(lastRun, 1);
            return dayOfMonth ? setDate(nextMonth, dayOfMonth) : nextMonth;
        case 'YEARLY':
            return addYears(lastRun, 1);
        default:
            return addMonths(lastRun, 1);
    }
}
