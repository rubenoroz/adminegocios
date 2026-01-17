import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupFees() {
    console.log('🧹 Cleaning up old student fees...');

    // Get all fees for the business
    const fees = await prisma.studentFee.findMany({
        include: {
            student: true
        }
    });

    console.log(`Found ${fees.length} total fees`);

    // Delete fees that:
    // 1. Have amount = 0, or
    // 2. Are for January 2026 (month 0, year 2026) - so they can be regenerated
    const jan2026Fees = fees.filter(fee => {
        const dueDate = new Date(fee.dueDate);
        return dueDate.getMonth() === 0 && dueDate.getFullYear() === 2026;
    });

    console.log(`Found ${jan2026Fees.length} fees for January 2026`);

    for (const fee of jan2026Fees) {
        console.log(`Deleting fee: ${fee.title} - $${fee.amount} for ${fee.student.firstName} ${fee.student.lastName}`);

        // First delete related payments
        await prisma.studentPayment.deleteMany({
            where: { studentFeeId: fee.id }
        });

        // Then delete the fee
        await prisma.studentFee.delete({
            where: { id: fee.id }
        });
    }

    console.log('✅ Cleanup complete! Reload the students page to regenerate fees.');
}

cleanupFees()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
