
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixRestoredCommissions() {
    try {
        console.log("Removing commissions from 'Mensualidad Restante (Restaurada)' fees...");

        // Find fees with this specific title that have payments
        const fees = await prisma.studentFee.findMany({
            where: {
                title: "Mensualidad Restante (Restaurada)",
                status: { in: ['PAID', 'PARTIAL'] }
            }
        });

        for (const fee of fees) {
            console.log(`Processing Fee ${fee.id} (${fee.title})...`);

            // 1. Remove expectation
            await prisma.studentFee.update({
                where: { id: fee.id },
                data: {
                    expectedTeacherId: null,
                    expectedCommission: 0
                }
            });
            console.log(`   -> Removed Fee expectation.`);

            // 2. Remove commission from payments
            const payments = await prisma.studentPayment.findMany({
                where: { studentFeeId: fee.id }
            });

            for (const p of payments) {
                if ((p.teacherCommission || 0) > 0) {
                    await prisma.studentPayment.update({
                        where: { id: p.id },
                        data: {
                            teacherId: null,
                            teacherCommission: 0,
                            schoolAmount: p.amount
                        }
                    });
                    console.log(`   -> Payment ${p.id}: Commission Zeroed Out.`);
                }
            }
        }
        console.log("Done.");

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

fixRestoredCommissions();
