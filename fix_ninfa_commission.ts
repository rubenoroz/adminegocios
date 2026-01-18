
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixNinfaCommission() {
    const teacherId = 'cmk34q10i000dh8quysooolj5'; // Rubén Oroz
    const paymentId = 'cmkiljkz4001peasbp2zmdmlp'; // Ninfa's Payment ($700)

    try {
        console.log("Fixing Ninfa Commission...");

        const payment = await prisma.studentPayment.findUnique({
            where: { id: paymentId }
        });

        if (!payment) {
            console.error("Payment not found!");
            return;
        }

        const comm = payment.amount * 0.60; // $420

        await prisma.studentPayment.update({
            where: { id: paymentId },
            data: {
                teacherId: teacherId,
                teacherCommission: comm,
                schoolAmount: payment.amount - comm
            }
        });

        console.log(`Updated Commission to $${comm} for Ninfa`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

fixNinfaCommission();
