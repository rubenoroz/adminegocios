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

        const { searchParams } = new URL(req.url);
        const businessId = searchParams.get("businessId");
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

        if (!businessId) {
            return new NextResponse("Business ID required", { status: 400 });
        }

        // Fetch students with their fees, schedules, and enrollments
        const students = await prisma.student.findMany({
            where: { businessId },
            include: {
                fees: {
                    where: {
                        dueDate: {
                            gte: new Date(year, 0, 1), // Jan 1st
                            lte: new Date(year, 11, 31) // Dec 31st
                        }
                    }
                },
                enrollments: {
                    where: { status: "ACTIVE" },
                    include: {
                        course: {
                            include: {
                                schedules: true
                            }
                        }
                    }
                }
            },
            orderBy: { lastName: "asc" }
        });

        // Process data for the matrix
        const matrix = students.map(student => {
            // Get primary schedule (first active course)
            let scheduleInfo = "Sin horario";
            let courseName = "Sin curso";

            if (student.enrollments.length > 0) {
                const enrollment = student.enrollments[0];
                courseName = enrollment.course.name;

                if (enrollment.course.schedules.length > 0) {
                    // Format: "Lun 16:00-17:00"
                    scheduleInfo = enrollment.course.schedules
                        .map(s => {
                            const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
                            return `${days[s.dayOfWeek]} ${s.startTime}-${s.endTime}`;
                        })
                        .join(", ");
                }
            }

            // Map fees to months (0-11)
            const monthlyStatus = Array(12).fill({ status: "NONE", amount: 0, paid: 0 });

            student.fees.forEach(fee => {
                const month = new Date(fee.dueDate).getMonth();

                // If multiple fees in a month, sum them up or take the most critical status
                const current = monthlyStatus[month];
                let newStatus = current.status;

                if (fee.status === "OVERDUE") newStatus = "OVERDUE";
                else if (fee.status === "PENDING" && newStatus !== "OVERDUE") newStatus = "PENDING";
                else if (fee.status === "PAID" && newStatus === "NONE") newStatus = "PAID";
                else if (fee.status === "PARTIAL" && newStatus !== "OVERDUE") newStatus = "PARTIAL";

                monthlyStatus[month] = {
                    status: newStatus,
                    amount: current.amount + fee.amount,
                    paid: current.paid + (fee.status === "PAID" ? fee.amount : 0) // Simplified paid amount logic
                };
            });

            return {
                id: student.id,
                name: `${student.firstName} ${student.lastName}`,
                phone: student.phone || "",
                course: courseName,
                schedule: scheduleInfo,
                months: monthlyStatus
            };
        });

        return NextResponse.json(matrix);
    } catch (error) {
        console.error("[STUDENT_MATRIX]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
