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

        // Get all students with their scholarships and fees
        const students = await prisma.student.findMany({
            where: {
                businessId,
            },
            include: {
                scholarships: {
                    where: { active: true },
                },
                fees: {
                    include: {
                        payments: true,
                    },
                },
            },
            orderBy: {
                firstName: "asc",
            },
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
                hasScholarship: student.scholarships.length > 0,
                scholarshipCount: student.scholarships.length,
                totalDebt,
                overdueCount,
            };
        });

        return NextResponse.json(studentsWithBalance);
    } catch (error) {
        console.error("[STUDENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
