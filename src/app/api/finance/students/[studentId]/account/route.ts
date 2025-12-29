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

        const student = await prisma.student.findUnique({
            where: { id: studentId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                matricula: true,
                scholarships: true,
                fees: {
                    orderBy: { dueDate: 'desc' },
                    take: 50,
                    include: {
                        template: true,
                        payments: true
                    }
                }
            }
        });

        if (!student) {
            return new NextResponse("Student not found", { status: 404 });
        }

        // Calculate totals
        let totalCharges = 0;
        let totalPaid = 0;
        let totalPending = 0;

        student.fees.forEach((fee) => {
            totalCharges += fee.amount;
            const feePaid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
            totalPaid += feePaid;

            if (fee.status !== "PAID") {
                totalPending += fee.amount - feePaid;
            }
        });

        return NextResponse.json({
            student: {
                id: student.id,
                name: `${student.lastName}, ${student.firstName}`,
                matricula: student.matricula,
            },
            scholarships: student.scholarships,
            fees: student.fees,
            summary: {
                totalCharges,
                totalPaid,
                totalPending,
                balance: totalCharges - totalPaid,
            },
        });
    } catch (error) {
        console.error("[STUDENT_ACCOUNT_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
