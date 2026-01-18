
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixJorgeCommission() {
    const teacherId = 'cmk34q10i000dh8quysooolj5'; // Rubén Oroz
    const paymentId = 'cmkil913k001leasbn9ypdlyp'; // Jorge's Payment ($870)

    try {
        console.log("Fixing Jorge Commission...");

        const payment = await prisma.studentPayment.findUnique({
            where: { id: paymentId },
            include: { studentFee: true }
        });

        if (!payment) {
            console.error("Payment not found!");
            return;
        }

        console.log(`Payment Found: $${payment.amount}`);
        console.log(`Linked Fee ID: ${payment.studentFeeId}`);
        console.log(`Current Commission: ${payment.teacherCommission}`);

        const comm = payment.amount * 0.60;

        await prisma.studentPayment.update({
            where: { id: paymentId },
            data: {
                teacherId: teacherId,
                teacherCommission: comm,
                schoolAmount: payment.amount - comm
            }
        });

        console.log(`Updated Commission to $${comm} for Teacher ${teacherId}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

fixJorgeCommission();
