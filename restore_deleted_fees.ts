
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function restoreFees() {
    const teacherId = 'cmk34q10i000dh8quysooolj5'; // Rubén Oroz

    // Data reconstruction using Paid Fee IDs to look up Student
    const toRestore = [
        {
            paidFeeId: 'cmki6flu5002539vtaaqsnapy', // Diego
            amount: 1000
        },
        {
            paidFeeId: 'cmkidp24p000h6zzkhj4n3vxk', // Natalie
            amount: 1000
        },
        {
            paidFeeId: 'cmki3lasz000fdbpbr9zy7kv3', // Sophia
            amount: 1000
        }
    ];

    try {
        console.log("Restoring 3 erroneously deleted fees...");

        for (const item of toRestore) {
            // Find existing fee to get valid studentId
            const paidFee = await prisma.studentFee.findUnique({
                where: { id: item.paidFeeId },
                include: { student: true }
            });

            if (!paidFee || !paidFee.studentId) {
                console.log(`❌ Could not find Paid Fee or Student for ID ${item.paidFeeId}`);
                continue;
            }

            console.log(`Processing restoration for: ${paidFee.student?.firstName}`);

            // Calculate expected Commission (60% of 1000 = 600)
            const expectedCommission = item.amount * 0.60;

            const restored = await prisma.studentFee.create({
                data: {
                    title: "Mensualidad Restante (Restaurada)",
                    amount: item.amount,
                    status: 'PENDING',
                    dueDate: new Date(), // Due now
                    student: {
                        connect: { id: paidFee.studentId }
                    },
                    expectedTeacher: {
                        connect: { id: teacherId }
                    },
                    expectedCommission: expectedCommission
                }
            });

            console.log(`   ✅ Restored Fee: ${restored.id} | Amount: ${restored.amount} | Student: ${paidFee.student?.firstName}`);
        }

    } catch (error) {
        console.error("Error restoring fees:", error);
    } finally {
        await prisma.$disconnect();
    }
}

restoreFees();
