import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { studentIds, feeTypeId, title, amount, dueDate } = body;

        if (!studentIds || !studentIds.length || !title || !amount || !dueDate) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Create fees for all selected students
        const fees = await Promise.all(
            studentIds.map((studentId: string) =>
                prisma.studentFee.create({
                    data: {
                        studentId,
                        feeTypeId,
                        title,
                        amount: parseFloat(amount),
                        dueDate: new Date(dueDate),
                        status: "PENDING",
                    },
                })
            )
        );

        return NextResponse.json(fees);
    } catch (error) {
        console.error("[FEES_ASSIGN_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
