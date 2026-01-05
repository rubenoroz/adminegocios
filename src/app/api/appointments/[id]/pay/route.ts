
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { paymentMethod, customerId, requiresInvoice } = body;

        if (!paymentMethod) {
            return new NextResponse("Payment method required", { status: 400 });
        }

        // 1. Get current appointment
        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: { service: true, employee: true, customer: true }
        });

        if (!appointment) {
            return new NextResponse("Appointment not found", { status: 404 });
        }

        if (appointment.status === 'CANCELLED') {
            return new NextResponse("Cannot pay cancelled appointment", { status: 400 });
        }

        // 2. Create Transaction
        const transaction = await prisma.transaction.create({
            data: {
                type: 'INCOME',
                amount: appointment.service.price,
                description: `Pago de Cita - ${appointment.service.name} - ${appointment.customer.name}`,
                businessId: appointment.service.businessId,
                appointment: { connect: { id } } // Link to appointment directly if schema supported it inside create, but we use update
            }
        });

        // 3. Update Appointment with payment status and fiscal info
        const updatedAppointment = await prisma.appointment.update({
            where: { id },
            data: {
                status: 'COMPLETED', // Auto-complete on payment? Yes, usually.
                paymentStatus: 'PAID',
                paymentMethod,
                transactionId: transaction.id,
                // Fiscal
                customerId: customerId || undefined,
                requiresInvoice: requiresInvoice || false,
            },
            include: {
                service: true,
                customer: true
            }
        });

        return NextResponse.json(updatedAppointment);

    } catch (error) {
        console.error("[APPOINTMENT_PAY]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
