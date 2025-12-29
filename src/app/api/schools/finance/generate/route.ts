import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { templateId, studentIds, dueDate, title } = body;

        if (!templateId || !studentIds || !studentIds.length || !dueDate) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Get the template
        const template = await prisma.schoolFeeTemplate.findUnique({
            where: { id: templateId },
        });

        if (!template) {
            return new NextResponse("Template not found", { status: 404 });
        }

        // Get all active scholarships for the selected students
        const scholarships = await prisma.scholarship.findMany({
            where: {
                studentId: { in: studentIds },
                active: true,
            },
        });

        // Create a map of studentId -> scholarship
        const scholarshipMap = new Map();
        scholarships.forEach((s) => {
            if (!scholarshipMap.has(s.studentId)) {
                scholarshipMap.set(s.studentId, []);
            }
            scholarshipMap.get(s.studentId).push(s);
        });

        // Generate fees for each student
        const fees = await Promise.all(
            studentIds.map(async (studentId: string) => {
                const baseAmount = template.amount;
                let finalAmount = baseAmount;
                let totalDiscount = 0;

                // Apply scholarships
                const studentScholarships = scholarshipMap.get(studentId) || [];
                for (const scholarship of studentScholarships) {
                    if (scholarship.percentage) {
                        totalDiscount += baseAmount * (scholarship.percentage / 100);
                    } else if (scholarship.amount) {
                        totalDiscount += scholarship.amount;
                    }
                }

                finalAmount = Math.max(0, baseAmount - totalDiscount);

                return prisma.studentFee.create({
                    data: {
                        studentId,
                        templateId: template.id,
                        title: title || template.name,
                        amount: finalAmount,
                        originalAmount: baseAmount,
                        discountApplied: totalDiscount,
                        dueDate: new Date(dueDate),
                        status: "PENDING",
                    },
                });
            })
        );

        return NextResponse.json({
            success: true,
            count: fees.length,
            fees,
        });
    } catch (error) {
        console.error("[GENERATE_FEES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
