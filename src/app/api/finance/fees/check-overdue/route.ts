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

        const { businessId } = await req.json();

        if (!businessId) {
            return new NextResponse("Missing businessId", { status: 400 });
        }

        const now = new Date();

        // Find all fees that are past due and not fully paid
        const overdueFees = await prisma.studentFee.findMany({
            where: {
                student: { businessId },
                dueDate: { lt: now },
                status: { in: ["PENDING", "PARTIAL"] }
            },
            include: {
                template: true,
                payments: true
            }
        });

        let updatedCount = 0;

        for (const fee of overdueFees) {
            // Calculate total paid
            const totalPaid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
            const remainingBalance = fee.amount - totalPaid;

            // Apply late fee if template has one and it hasn't been applied yet
            let newAmount = fee.amount;
            if (fee.template?.lateFee && fee.status !== "OVERDUE") {
                newAmount = fee.amount + fee.template.lateFee;
            }

            // Update status to OVERDUE
            await prisma.studentFee.update({
                where: { id: fee.id },
                data: {
                    status: "OVERDUE",
                    amount: newAmount
                }
            });

            updatedCount++;
        }

        return NextResponse.json({ success: true, updatedCount });
    } catch (error) {
        console.error("[FEES_CHECK_OVERDUE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
