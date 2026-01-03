import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = {
    params: Promise<{ id: string }>;
};

// PATCH /api/appointments/[id] - Update appointment (status, reschedule, etc)
export async function PATCH(req: Request, { params }: RouteParams) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { status, startTime, employeeId, notes } = body;

        const updateData: any = {};

        if (status) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;
        if (employeeId !== undefined) updateData.employeeId = employeeId || null;

        // If rescheduling, recalculate end time
        if (startTime) {
            const appointment = await prisma.appointment.findUnique({
                where: { id },
                include: { service: true }
            });

            if (appointment) {
                const startDate = new Date(startTime);
                const endDate = new Date(startDate.getTime() + appointment.service.duration * 60000);
                updateData.startTime = startDate;
                updateData.endTime = endDate;
            }
        }

        const updated = await prisma.appointment.update({
            where: { id },
            data: updateData,
            include: {
                service: { select: { name: true, duration: true, price: true, color: true } },
                customer: { select: { name: true, phone: true } },
                employee: { select: { firstName: true, lastName: true } }
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// DELETE /api/appointments/[id] - Cancel/delete appointment
export async function DELETE(req: Request, { params }: RouteParams) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await prisma.appointment.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
