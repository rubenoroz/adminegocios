
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkFields() {
    try {
        console.log("Checking Prisma Fields...");

        // Check StudentFee fields
        const fee = await prisma.studentFee.findFirst({
            select: {
                id: true,
                expectedTeacherId: true,
                expectedCommission: true
            }
        });
        console.log("Fee Fields OK:", fee);

        // Check Business fields
        const business = await prisma.business.findFirst({
            select: {
                id: true,
                commissionOnInscription: true
            }
        });
        console.log("Business Fields OK:", business);

    } catch (e) {
        console.error("FIELD CHECK FAILED:", e);
    } finally {
        await prisma.$disconnect();
    }
}

checkFields();
