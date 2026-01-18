
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixJoseCommission() {
    const teacherId = 'cmk34q10i000dh8quysooolj5'; // Rubén Oroz
    const paymentId = 'cmkilxya80029easb27gn7xar'; // José's Payment ($770)

    try {
        console.log("Fixing José Commission...");

        const payment = await prisma.studentPayment.findUnique({
            where: { id: paymentId }
        });

        if (!payment) {
            console.error("Payment not found!");
            return;
        }

        const comm = payment.amount * 0.60;

        await prisma.studentPayment.update({
            where: { id: paymentId },
            data: {
                teacherId: teacherId,
                teacherCommission: comm,
                schoolAmount: payment.amount - comm
            }
        });

        console.log(`Updated Commission to $${comm} for José`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

fixJoseCommission();
