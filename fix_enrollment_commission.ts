
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixEnrollmentCommission() {
    // These are the 3 "Paid" fees that we previously linked to the teacher.
    // The user indicates these are "Inscripción" (Enrollment) and should NOT have commission.
    const enrollmentFeeIds = [
        'cmki6flu5002539vtaaqsnapy', // Diego ($850)
        'cmkidp24p000h6zzkhj4n3vxk', // Natalie ($900)
        'cmki3lasz000fdbpbr9zy7kv3'  // Sophia ($1000)
    ];

    try {
        console.log("Removing commission from Enrollment Fees...");

        for (const feeId of enrollmentFeeIds) {
            // 1. Remove expectation from Fee
            await prisma.studentFee.update({
                where: { id: feeId },
                data: {
                    expectedTeacherId: null,
                    expectedCommission: 0
                }
            });
            console.log(`Updated Fee ${feeId}: Removed Teacher link.`);

            // 2. Remove commission from Payment
            const payments = await prisma.studentPayment.findMany({
                where: { studentFeeId: feeId }
            });

            for (const p of payments) {
                await prisma.studentPayment.update({
                    where: { id: p.id },
                    data: {
                        teacherId: null,
                        teacherCommission: 0,
                        schoolAmount: p.amount // Full amount goes to school
                    }
                });
                console.log(`   -> Updated Payment ${p.id}: Commission set to $0.`);
            }
        }
        console.log("Done.");

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

fixEnrollmentCommission();
