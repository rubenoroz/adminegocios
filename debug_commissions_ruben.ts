
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugCommissions() {
    try {
        console.log("Searching for employee 'Rubén Oroz'...");
        const employee = await prisma.employee.findFirst({
            where: {
                firstName: { contains: 'Rubén' },
                lastName: { contains: 'Oroz' }
            }
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

        if (pendingFees.length === 0) console.log("No pending fees found linked to this teacher.");

        pendingFees.forEach(fee => {
            console.log(`Fee ID: ${fee.id} | Amount: ${fee.amount} | Expected Comm: ${fee.expectedCommission} | Status: ${fee.status}`);
            console.log(`   Payments linked: ${fee.payments.length}`);
            fee.payments.forEach(p => {
                console.log(`      Payment ID: ${p.id} | Amount: ${p.amount} | Teacher Comm: ${p.teacherCommission} | Date: ${p.date}`);
            });
        });

        // Check Actual Commission Payments (Monthly)
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

        if (payments.length === 0) console.log("No payments found for this teacher this month.");

        payments.forEach(p => {
            console.log(`Payment ID: ${p.id} | Amount: ${p.amount} | Teacher Comm: ${p.teacherCommission} | Fee Status: ${p.studentFee?.status}`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

debugCommissions();
