
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearProjectedInscriptions() {
    try {
        console.log("Clearing Improper Projected Commissions (Inscriptions)...");

        // Find them first to log count
        const count = await prisma.studentFee.count({
            where: {
                expectedCommission: { gt: 0 },
                title: { contains: 'Inscripci' }
            }
        });
        console.log(`Found ${count} global fees to fix.`);

        // Fix them
        const result = await prisma.studentFee.updateMany({
            where: {
                expectedCommission: { gt: 0 },
                title: { contains: 'Inscripci' }
            },
            data: {
                expectedTeacherId: null,
                expectedCommission: 0
            }
        });

        console.log(`Success: Updated ${result.count} fees.`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

clearProjectedInscriptions();
