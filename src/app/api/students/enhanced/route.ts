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
        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get("branchId");

        const where: any = {
            businessId,
        };

        if (branchId) {
            where.OR = [
                { branches: { some: { id: branchId } } },
                { branches: { none: {} } }
            ];
        }

        // Get all students with their scholarships and fees
        const students = await prisma.student.findMany({
            where,
            include: {
                scholarships: {
                    where: { active: true },
                },
                fees: {
                    include: {
                        payments: true,
                    },
                },
                branches: true,
            },
            orderBy: [
                { lastName: "asc" },
                { firstName: "asc" },
            ],
        });

        // Calculate balance for each student
        const studentsWithBalance = students.map((student) => {
            let totalDebt = 0;
            let overdueCount = 0;
            const now = new Date();

            student.fees.forEach((fee) => {
                const paid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
                const remaining = fee.amount - paid;

                if (remaining > 0) {
                    totalDebt += remaining;
                    if (new Date(fee.dueDate) < now) {
                        overdueCount += 1;
                    }
                }
            });

            return {
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                matricula: student.matricula,
                email: student.email,
                phone: student.phone,
                status: student.status, // Include status for inactive visual indicator
                hasScholarship: student.scholarships.length > 0,
                scholarshipCount: student.scholarships.length,
                totalDebt,
                branches: student.branches,
                overdueCount,
            };
        });

        return NextResponse.json(studentsWithBalance);
    } catch (error) {
        console.error("[STUDENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
