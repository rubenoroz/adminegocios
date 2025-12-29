import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const businessId = session.user.businessId!;

        // Get all fees for the business
        const allFees = await prisma.studentFee.findMany({
            where: {
                student: {
                    businessId,
                },
            },
            include: {
                payments: true,
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        matricula: true,
                    },
                },
            },
        });

        // Calculate statistics
        let totalExpected = 0;
        let totalCollected = 0;
        let totalPending = 0;
        let totalOverdue = 0;
        const studentDebts = new Map<string, { name: string; matricula: string; debt: number; overdueCount: number }>();

        const now = new Date();

        allFees.forEach((fee) => {
            const paid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
            const remaining = fee.amount - paid;

            totalExpected += fee.amount;
            totalCollected += paid;

            if (remaining > 0) {
                totalPending += remaining;

                const isOverdue = new Date(fee.dueDate) < now;
                if (isOverdue) {
                    totalOverdue += remaining;
                }

                // Track student debts
                const studentKey = fee.student.id;
                if (!studentDebts.has(studentKey)) {
                    studentDebts.set(studentKey, {
                        name: `${fee.student.firstName} ${fee.student.lastName}`,
                        matricula: fee.student.matricula || "N/A",
                        debt: 0,
                        overdueCount: 0,
                    });
                }

                const studentDebt = studentDebts.get(studentKey)!;
                studentDebt.debt += remaining;
                if (isOverdue) {
                    studentDebt.overdueCount += 1;
                }
            }
        });

        // Get total students count
        const totalStudents = await prisma.student.count({
            where: { businessId },
        });

        // Get active scholarships count
        const activeScholarships = await prisma.scholarship.count({
            where: {
                active: true,
                student: {
                    businessId,
                },
            },
        });

        // Convert debtors map to array and sort by debt amount
        const debtors = Array.from(studentDebts.entries())
            .map(([id, data]) => ({
                id,
                name: data.name,
                matricula: data.matricula,
                totalDebt: data.debt,
                overdueCount: data.overdueCount,
            }))
            .sort((a, b) => b.totalDebt - a.totalDebt)
            .slice(0, 10); // Top 10 debtors

        return NextResponse.json({
            totalExpected,
            totalCollected,
            totalPending,
            totalOverdue,
            studentsWithDebt: studentDebts.size,
            totalStudents,
            activeScholarships,
            debtors,
        });
    } catch (error) {
        console.error("[FINANCE_STATS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
