
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProjectedInscriptions() {
    const teacherId = 'cmk34q10i000dh8quysooolj5'; // Rubén Oroz

    try {
        console.log("Checking Project Commissions for Inscriptions...");

        const fees = await prisma.studentFee.findMany({
            where: {
                expectedTeacherId: teacherId,
                expectedCommission: { gt: 0 },
                title: { contains: 'Inscripci' } // Broad check
            },
            select: {
                id: true,
                title: true,
                amount: true,
                expectedCommission: true,
                student: { select: { firstName: true, lastName: true } }
            }
        });

        console.log(`Found ${fees.length} Inscription Fees with Commission:`);
        let total = 0;
        fees.forEach(f => {
            console.log(`- ${f.title} (${f.student.firstName}): $${f.expectedCommission}`);
            total += (f.expectedCommission || 0);
        });
        console.log(`Total Improper Projection: $${total}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkProjectedInscriptions();
