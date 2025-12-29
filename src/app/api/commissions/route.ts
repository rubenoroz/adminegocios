import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Get commission summary by teacher
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const employeeId = searchParams.get("employeeId");

        // Build date filter
        const dateFilter: any = {};
        if (startDate) {
            dateFilter.gte = new Date(startDate);
        }
        if (endDate) {
            dateFilter.lte = new Date(endDate);
        }

        // Get all payments with teacher commissions (not settled)
        const payments = await prisma.studentPayment.findMany({
            where: {
                teacherId: employeeId || { not: null },
                teacherCommission: { not: null },
                isSettled: false,
                studentFee: {
                    student: {
                        businessId: user.businessId
                    }
                },
                ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
            },
            include: {
                teacher: true,
                studentFee: {
                    include: {
                        student: true
                    }
                }
            },
            orderBy: {
                date: "desc"
            }
        });

        // Debug log
        console.log("[COMMISSIONS_GET] Found payments:", payments.length);
        console.log("[COMMISSIONS_GET] Sample payment:", payments[0] ? {
            id: payments[0].id,
            teacherId: payments[0].teacherId,
            teacherCommission: payments[0].teacherCommission,
            isSettled: payments[0].isSettled
        } : "No payments found");

        // Group by teacher
        const teacherSummary: Record<string, {
            teacher: any;
            totalCommission: number;
            totalReserve: number;
            totalSchool: number;
            paymentCount: number;
            payments: any[];
        }> = {};

        for (const payment of payments) {
            if (!payment.teacherId || !payment.teacher) continue;

            if (!teacherSummary[payment.teacherId]) {
                teacherSummary[payment.teacherId] = {
                    teacher: payment.teacher,
                    totalCommission: 0,
                    totalReserve: 0,
                    totalSchool: 0,
                    paymentCount: 0,
                    payments: []
                };
            }

            teacherSummary[payment.teacherId].totalCommission += payment.teacherCommission || 0;
            teacherSummary[payment.teacherId].totalReserve += payment.reserveAmount || 0;
            teacherSummary[payment.teacherId].totalSchool += payment.schoolAmount || 0;
            teacherSummary[payment.teacherId].paymentCount += 1;
            teacherSummary[payment.teacherId].payments.push({
                id: payment.id,
                amount: payment.amount,
                teacherCommission: payment.teacherCommission,
                reserveAmount: payment.reserveAmount,
                date: payment.date,
                studentName: `${payment.studentFee.student.firstName} ${payment.studentFee.student.lastName}`,
                concept: payment.studentFee.title
            });
        }

        // Get settlement history
        const settlements = await prisma.commissionSettlement.findMany({
            where: {
                businessId: user.businessId,
                ...(employeeId && { employeeId })
            },
            include: {
                employee: true,
                _count: {
                    select: { payments: true }
                }
            },
            orderBy: {
                date: "desc"
            },
            take: 20
        });

        return NextResponse.json({
            summary: Object.values(teacherSummary),
            settlements: settlements.map(s => ({
                id: s.id,
                amount: s.amount,
                date: s.date,
                method: s.method,
                note: s.note,
                teacherName: `${s.employee.firstName} ${s.employee.lastName}`,
                paymentCount: s._count.payments
            }))
        });
    } catch (error) {
        console.error("[COMMISSIONS_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// POST: Create a settlement (pay teacher)
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const body = await req.json();
        const { employeeId, method, note, paymentIds } = body;

        if (!employeeId || !method || !paymentIds || paymentIds.length === 0) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Calculate total from selected payments
        const payments = await prisma.studentPayment.findMany({
            where: {
                id: { in: paymentIds },
                teacherId: employeeId,
                isSettled: false
            }
        });

        if (payments.length === 0) {
            return NextResponse.json({ error: "No valid payments found" }, { status: 400 });
        }

        const totalAmount = payments.reduce((sum, p) => sum + (p.teacherCommission || 0), 0);

        // Create settlement
        const settlement = await prisma.commissionSettlement.create({
            data: {
                amount: totalAmount,
                method,
                note,
                employeeId,
                businessId: user.businessId
            }
        });

        // Mark payments as settled
        await prisma.studentPayment.updateMany({
            where: {
                id: { in: paymentIds }
            },
            data: {
                isSettled: true,
                settlementId: settlement.id
            }
        });

        return NextResponse.json({
            success: true,
            settlement: {
                id: settlement.id,
                amount: totalAmount,
                paymentCount: payments.length
            }
        });
    } catch (error) {
        console.error("[COMMISSIONS_POST]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
