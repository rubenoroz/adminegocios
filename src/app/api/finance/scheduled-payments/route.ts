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

        if (!businessId) {
            return new NextResponse("Missing businessId", { status: 400 });
        }

        const scheduledPayments = await prisma.scheduledPayment.findMany({
            where: { businessId },
            include: {
                student: true,
                employee: true,
                feeTemplate: true
            },
            orderBy: { nextRunDate: "asc" }
        });

        return NextResponse.json(scheduledPayments);
    } catch (error) {
        console.error("[SCHEDULED_PAYMENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const {
            type,
            studentId,
            employeeId,
            feeTemplateId,
            recurrence,
            startDate,
            endDate,
            dayOfMonth,
            dayOfWeek,
            businessId
        } = body;

        if (!type || !recurrence || !startDate || !businessId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Validate type-specific requirements
        if (type === "STUDENT_FEE" && (!studentId || !feeTemplateId)) {
            return new NextResponse("Student and fee template required for student fees", { status: 400 });
        }

        if (type === "EMPLOYEE_SALARY" && !employeeId) {
            return new NextResponse("Employee required for salary payments", { status: 400 });
        }

        const scheduledPayment = await prisma.scheduledPayment.create({
            data: {
                type,
                studentId: studentId || null,
                employeeId: employeeId || null,
                feeTemplateId: feeTemplateId || null,
                recurrence,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                nextRunDate: new Date(startDate),
                dayOfMonth: dayOfMonth || null,
                dayOfWeek: dayOfWeek || null,
                businessId,
                active: true
            },
            include: {
                student: true,
                employee: true,
                feeTemplate: true
            }
        });

        return NextResponse.json(scheduledPayment);
    } catch (error) {
        console.error("[SCHEDULED_PAYMENTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { id, active, endDate } = body;

        if (!id) {
            return new NextResponse("Missing id", { status: 400 });
        }

        const scheduledPayment = await prisma.scheduledPayment.update({
            where: { id },
            data: {
                active: active !== undefined ? active : undefined,
                endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined
            },
            include: {
                student: true,
                employee: true,
                feeTemplate: true
            }
        });

        return NextResponse.json(scheduledPayment);
    } catch (error) {
        console.error("[SCHEDULED_PAYMENTS_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return new NextResponse("Missing id", { status: 400 });
        }

        await prisma.scheduledPayment.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[SCHEDULED_PAYMENTS_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
