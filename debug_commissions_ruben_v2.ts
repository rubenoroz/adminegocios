
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugCommissions() {
    try {
        const targetId = 'cmk34q10i000dh8quysooolj5';
        console.log(`Searching for employee ID: ${targetId}...`);

        const employee = await prisma.employee.findUnique({
            where: { id: targetId }
        });

        if (!employee) {
            console.log("Employee not found.");
            return;
        }

        console.log(`Found Employee: ${employee.firstName} ${employee.lastName} (${employee.id})`);

        // Check Expected Commissions (Projected)
        console.log("\n--- EXPECTED COMMISSIONS (PENDING FEES) ---");
        const pendingFees = await prisma.studentFee.findMany({
            where: {
                expectedTeacherId: employee.id,
                status: 'PENDING'
            },
            include: {
                payments: true
            }
        });

        let totalProjected = 0;
        pendingFees.forEach(fee => {
            console.log(`Fee ID: ${fee.id} | Amount: ${fee.amount} | Expected Comm: ${fee.expectedCommission} | Status: ${fee.status}`);
            totalProjected += Number(fee.expectedCommission || 0);
            if (fee.payments.length > 0) {
                console.log(`   WARNING: Fee is PENDING but has ${fee.payments.length} payments!`);
                fee.payments.forEach(p => {
                    console.log(`      Payment ID: ${p.id} | Amount: ${p.amount} | Teacher Comm: ${p.teacherCommission} | Date: ${p.date.toISOString()}`);
                });
            }
        });
        console.log(`Total Projected (Pending): $${totalProjected}`);


        // Check PAID Fees (that should be in Monthly Commission)
        console.log("\n--- PAID FEES (SHOULD BE IN MONTHLY) ---");
        // We look for fees that have this teacher as expected but are PAID
        const paidFees = await prisma.studentFee.findMany({
            where: {
                expectedTeacherId: employee.id,
                status: 'PAID' // or PARTIAL
            }
        });

        // Also checks actual payments assigned to this teacher
        console.log("\n--- ACTUAL COMMISSION PAYMENTS (THIS MONTH) ---");
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const payments = await prisma.studentPayment.findMany({
            where: {
                teacherId: employee.id,
                date: {
                    gte: firstDay,
                    lte: lastDay
                }
            },
            include: {
                studentFee: true
            }
        });

        let totalMonthly = 0;
        payments.forEach(p => {
            console.log(`Payment ID: ${p.id} | Amount: ${p.amount} | Teacher Comm: ${p.teacherCommission} | Fee ID: ${p.studentFeeId}`);
            totalMonthly += Number(p.teacherCommission || 0);
        });
        console.log(`Total Monthly (Actual Payments): $${totalMonthly}`);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

debugCommissions();
