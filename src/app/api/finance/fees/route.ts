import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "UNAUTHORIZED", message: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get("studentId");
        const status = searchParams.get("status");

        const where: any = {};
        if (studentId) where.studentId = studentId;
        if (status) where.status = status;

        const fees = await prisma.studentFee.findMany({
            where,
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        matricula: true
                    }
                },
                payments: true
            },
            orderBy: { dueDate: 'asc' }
        });

        // Computed status for display
        const feesWithComputedStatus = fees.map(fee => {
            let status = fee.status;
            const paid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
            const isOverdue = new Date(fee.dueDate) < new Date() && paid < fee.amount;

            if (status !== 'PAID' && isOverdue) {
                status = 'OVERDUE';
            }
            return { ...fee, status };
        });

        return NextResponse.json(feesWithComputedStatus);
    } catch (error) {
        console.error("[FEES_GET]", error);
        return NextResponse.json({ error: "INTERNAL_ERROR", message: "Error al obtener cuotas" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "UNAUTHORIZED", message: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const { studentIds, title, amount, dueDate, templateId } = body;

        if (!studentIds || !Array.isArray(studentIds) || !title || !amount || !dueDate) {
            return NextResponse.json({ error: "MISSING_FIELDS", message: "Faltan campos requeridos" }, { status: 400 });
        }

        if (parseFloat(amount) < 0) {
            return NextResponse.json({ error: "INVALID_AMOUNT", message: "El monto no puede ser negativo" }, { status: 400 });
        }

        const fees = await Promise.all(
            studentIds.map((studentId: string) =>
                prisma.studentFee.create({
                    data: {
                        studentId,
                        title,
                        amount: parseFloat(amount),
                        originalAmount: parseFloat(amount),
                        dueDate: new Date(dueDate),
                        templateId,
                        status: "PENDING"
                    }
                })
            )
        );

        return NextResponse.json({ success: true, count: fees.length });
    } catch (error) {
        console.error("[FEES_POST]", error);
        return NextResponse.json({ error: "INTERNAL_ERROR", message: "Error al asignar cuotas" }, { status: 500 });
    }
}
