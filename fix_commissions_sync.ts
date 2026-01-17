
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCommissions() {
    const teacherId = 'cmk34q10i000dh8quysooolj5'; // Rubén Oroz (Mixed)
    const commissionPct = 60; // 60%

    try {
        console.log(`Starting Commission Fix for Teacher ID: ${teacherId}`);

        // 1. Get all Pending Fees (Projected)
        const pendingFees = await prisma.studentFee.findMany({
            where: {
                expectedTeacherId: teacherId,
                status: 'PENDING'
            },
            include: { student: true }
        });

        console.log(`Found ${pendingFees.length} Pending Fees (Projected). Checking for Paid duplicates...`);

        for (const pendingFee of pendingFees) {
            // 2. Find a PAID fee for the same student, created roughly same time (or any time this month)
            // We'll broaden search to any PAID fee for this student without a teacher expected
            const paidFee = await prisma.studentFee.findFirst({
                where: {
                    studentId: pendingFee.studentId,
                    status: { in: ['PAID', 'PARTIAL'] },
                    expectedTeacherId: null, // Only fix ones that are missing the teacher
                    // Optional: Check amount match?
                    amount: { gte: pendingFee.amount - 200, lte: pendingFee.amount + 200 } // Fuzzy match amount
                },
                include: { payments: true }
            });

            if (paidFee) {
                console.log(`\n✅ MATCH FOUND!`);
                console.log(`   Pending Fee (Ghost): ${pendingFee.id} | Amount: ${pendingFee.amount}`);
                console.log(`   Paid Fee (Real):     ${paidFee.id} | Amount: ${paidFee.amount} | Payments: ${paidFee.payments.length}`);

                // 3. EXECUTE FIX
                // A. Update Paid Fee to link to teacher
                await prisma.studentFee.update({
                    where: { id: paidFee.id },
                    data: {
                        expectedTeacherId: teacherId,
                        expectedCommission: Number(paidFee.amount) * (commissionPct / 100)
                    }
                });
                console.log(`   -> Updated Paid Fee with Teacher Link.`);

                // B. Update Payments
                for (const p of paidFee.payments) {
                    const comm = Number(p.amount) * (commissionPct / 100);
                    await prisma.studentPayment.update({
                        where: { id: p.id },
                        data: {
                            teacherId: teacherId,
                            teacherCommission: comm,
                            schoolAmount: Number(p.amount) - comm
                        }
                    });
                    console.log(`   -> Updated Payment ${p.id}: Commission $${comm}`);
                }

                // C. Delete Pending Fee
                await prisma.studentFee.delete({
                    where: { id: pendingFee.id }
                });
                console.log(`   -> Deleted Pending 'Ghost' Fee.`);

            } else {
                console.log(`   No paid duplicate found for Pending Fee ${pendingFee.id} (Student: ${pendingFee.student?.firstName})`);
            }
        }

        console.log("\nFix Complete.");

    } catch (error) {
        console.error("Error executing fix:", error);
    } finally {
        await prisma.$disconnect();
    }
}

fixCommissions();
