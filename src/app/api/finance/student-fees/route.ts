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
        const { studentId, templateId, dueDate, customAmount } = body;

        if (!studentId || !templateId || !dueDate) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Get template
        const template = await prisma.schoolFeeTemplate.findUnique({
            where: { id: templateId },
        });

        if (!template) {
            return new NextResponse("Template not found", { status: 404 });
        }

        // Get student scholarships
        const scholarships = await prisma.scholarship.findMany({
            where: {
                studentId,
                active: true,
            },
        });

        // Calculate final amount with scholarships
        let finalAmount = customAmount ? parseFloat(customAmount) : template.amount;
        let discountApplied = 0;

        scholarships.forEach((scholarship) => {
            if (scholarship.percentage) {
                discountApplied += finalAmount * (scholarship.percentage / 100);
            } else if (scholarship.amount) {
                discountApplied += scholarship.amount;
            }
        });

        finalAmount = Math.max(0, finalAmount - discountApplied);

        // Create fee
        const fee = await prisma.studentFee.create({
            data: {
                title: template.name,
                amount: finalAmount,
                originalAmount: customAmount ? parseFloat(customAmount) : template.amount,
                discountApplied,
                dueDate: new Date(dueDate),
                studentId,
                templateId,
            },
            include: {
                template: true,
                student: {
                    select: {
                        firstName: true,
                        lastName: true,
                        matricula: true,
                    },
                },
            },
        });

        return NextResponse.json(fee);
    } catch (error) {
        console.error("[STUDENT_FEE_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
