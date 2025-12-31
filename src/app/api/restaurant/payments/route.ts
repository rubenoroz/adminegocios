import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Obtener pagos de una orden
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json({ error: "orderId is required" }, { status: 400 });
        }

        const payments = await prisma.payment.findMany({
            where: { orderId },
            orderBy: { timestamp: 'desc' }
        });

        return NextResponse.json(payments);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// Crear nuevo pago
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { orderId, amount, method, tip = 0, guestName } = body;

        if (!orderId || !amount || !method) {
            return NextResponse.json({
                error: "orderId, amount, and method are required"
            }, { status: 400 });
        }

        // Validar método de pago
        const validMethods = ['CASH', 'CARD', 'TRANSFER'];
        if (!validMethods.includes(method)) {
            return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
        }

        // Obtener la orden actual
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { payments: true }
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Verificar que el pago no exceda el monto restante
        const paymentAmount = parseFloat(amount);
        if (paymentAmount > order.remainingAmount + 0.01) { // 0.01 de tolerancia por redondeo
            return NextResponse.json({
                error: `Payment amount ($${paymentAmount}) exceeds remaining amount ($${order.remainingAmount})`
            }, { status: 400 });
        }

        // Crear el pago
        const payment = await prisma.payment.create({
            data: {
                orderId,
                amount: paymentAmount,
                tip: parseFloat(tip.toString()) || 0,
                method,
                guestName: guestName || null,
                status: 'COMPLETED'
            }
        });

        // Actualizar el monto restante de la orden
        const newRemainingAmount = Math.max(0, order.remainingAmount - paymentAmount);

        // Si se pagó todo, marcar la orden como completada y actualizar mesa
        const isFullyPaid = newRemainingAmount <= 0.01;

        await prisma.order.update({
            where: { id: orderId },
            data: {
                remainingAmount: newRemainingAmount,
                ...(isFullyPaid ? { status: 'COMPLETED' } : {})
            }
        });

        // Si la orden está completamente pagada, actualizar la mesa
        if (isFullyPaid && order.tableId) {
            await prisma.table.update({
                where: { id: order.tableId },
                data: {
                    status: 'DIRTY',
                    currentOrderId: null,
                    currentPax: null
                }
            });
        } else if (order.tableId && order.status !== 'PAYING') {
            // Cambiar mesa a estado "pagando" si aún hay saldo
            await prisma.table.update({
                where: { id: order.tableId },
                data: { status: 'PAYING' }
            });
        }

        // Retornar la orden actualizada con todos los pagos
        const updatedOrder = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: { include: { product: true } },
                payments: true,
                table: true
            }
        });

        return NextResponse.json({
            payment,
            order: updatedOrder,
            isFullyPaid
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
