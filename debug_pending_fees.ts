
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const fees = await prisma.studentFee.findMany({
            where: {
                expectedTeacherId: 'cmk34q10i000dh8quysooolj5',
                status: 'PENDING'
            },
            select: { id: true, studentId: true, courseId: true, amount: true }
        });
        console.log(JSON.stringify(fees, null, 2));
    } catch (e) { console.error(e); }
    finally { await prisma.$disconnect(); }
}
main();
