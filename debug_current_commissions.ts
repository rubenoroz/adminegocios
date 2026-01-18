
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugCurrentCommissions() {
    const teacherId = 'cmk34q10i000dh8quysooolj5'; // Rubén Oroz

    try {
        console.log("Searching for payments with commission > 0 for Rubén Oroz this month...");

        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const payments = await prisma.studentPayment.findMany({
            where: {
                teacherId: teacherId,
                teacherCommission: { gt: 0 },
                date: {
                    gte: firstDay,
                    lte: lastDay
                }
            },
            include: {
                studentFee: {
                    include: { student: true }
                }
            }
        });

        console.log(`Found ${payments.length} payments generating commission.`);
        let total = 0;
        payments.forEach(p => {
            console.log(`Payment ID: ${p.id}`);
            console.log(`   Amount: $${p.amount}`);
            console.log(`   Commission: $${p.teacherCommission}`);
            console.log(`   Fee Title: ${p.studentFee?.title}`);
            console.log(`   Student: ${p.studentFee?.student?.firstName} ${p.studentFee?.student?.lastName}`);
            console.log("---------------------------------------------------");
            total += Number(p.teacherCommission || 0);
        });
        console.log(`Total Calculated Commission: $${total}`);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

debugCurrentCommissions();
