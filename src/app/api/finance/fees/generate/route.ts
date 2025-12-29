import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addMonths, startOfMonth, endOfMonth, isSameMonth } from "date-fns";

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

        // 1. Get active templates
        const templates = await prisma.schoolFeeTemplate.findMany({
            where: { businessId },
        });

        // 2. Get active students
        const students = await prisma.student.findMany({
            where: { businessId },
            include: {
                scholarships: {
                    where: { active: true }
                }
            }
        });

        let generatedCount = 0;
        const targetDate = new Date(); // Generate for current month/time

        for (const template of templates) {
            // Only handling MONTHLY for now as per requirement context
            if (template.recurrence === "MONTHLY") {
                const dueDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), template.dayDue || 5);

                for (const student of students) {
                    // Check if fee already exists for this month/template
                    const existingFee = await prisma.studentFee.findFirst({
                        where: {
                            studentId: student.id,
                            templateId: template.id,
                            dueDate: {
                                gte: startOfMonth(targetDate),
                                lte: endOfMonth(targetDate)
                            }
                        }
                    });

                    if (!existingFee) {
                        // Calculate amount with scholarship
                        let finalAmount = template.amount;
                        let discountApplied = 0;

                        // Apply scholarship if applicable (simple logic: take the best one)
                        if (student.scholarships.length > 0) {
                            const scholarship = student.scholarships[0]; // Taking the first one for simplicity
                            if (scholarship.percentage) {
                                discountApplied = (template.amount * scholarship.percentage) / 100;
                                finalAmount -= discountApplied;
                            } else if (scholarship.amount) {
                                discountApplied = scholarship.amount;
                                finalAmount -= discountApplied;
                            }
                        }

                        // Ensure non-negative
                        if (finalAmount < 0) finalAmount = 0;

                        await prisma.studentFee.create({
                            data: {
                                title: `${template.name} - ${targetDate.toLocaleString('default', { month: 'long' })}`,
                                amount: finalAmount,
                                originalAmount: template.amount,
                                discountApplied,
                                dueDate,
                                studentId: student.id,
                                templateId: template.id,
                                status: "PENDING"
                            }
                        });
                        generatedCount++;
                    }
                }
            }
        }

        return NextResponse.json({ success: true, generatedCount });
    } catch (error) {
        console.error("[FEES_GENERATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
