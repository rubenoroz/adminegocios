
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMixedCommissions() {
    const teacherId = 'cmk34q10i000dh8quysooolj5'; // Rubén Oroz

    try {
        console.log("Fixing Commissions...");

        // 1. Zero out Vania and José (Inscripción) and Alejandra (Restaurada)
        const paymentsToZero = [
            'cmkik0g3i0001easbh1hr8w79', // Vania
            'cmkik3v08000heasbohji1lu1', // José
            'cmkik2iuw0009easbhmnirjhf'  // Alejandra
        ];

        await prisma.studentPayment.updateMany({
            where: { id: { in: paymentsToZero } },
            data: {
                teacherId: null,
                teacherCommission: 0,
                schoolAmount: 1000 // Assuming full amount, but updateMany can't reference current amount?
                // Wait, updateMany sets SET values. 
                // I should assume they are full payments of 1000? 
                // Let's do a loop to be safe and use schoolAmount = amount.
            }
        });

        // Loop for precise update
        for (const pid of paymentsToZero) {
            const p = await prisma.studentPayment.findUnique({ where: { id: pid } });
            if (p) {
                await prisma.studentPayment.update({
                    where: { id: pid },
                    data: {
                        teacherId: null,
                        teacherCommission: 0,
                        schoolAmount: p.amount
                    }
                });
                console.log(`Zeroed out commission for payment ${pid}`);
            }
        }

        // 2. Add Commission for Alonso (Tuition)
        // Payment: cmkik9pn5000leasbk0vfx4gj ($700)
        // Teacher: Rubén
        // Commission: 420 (60% of 700)
        const alonsoPaymentId = 'cmkik9pn5000leasbk0vfx4gj';
        const alonsoPayment = await prisma.studentPayment.findUnique({ where: { id: alonsoPaymentId } });

        if (alonsoPayment) {
            const comm = alonsoPayment.amount * 0.60;
            await prisma.studentPayment.update({
                where: { id: alonsoPaymentId },
                data: {
                    teacherId: teacherId,
                    teacherCommission: comm,
                    schoolAmount: alonsoPayment.amount - comm
                }
            });
            console.log(`Added commission $${comm} for Alonso (${alonsoPaymentId})`);
        } else {
            console.log("Alonso payment not found!");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

fixMixedCommissions();
