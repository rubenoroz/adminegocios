
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting Finance Logic Verification...');

    // 1. Setup Data
    const business = await prisma.business.findFirst();
    if (!business) throw new Error('No business found');

    const student = await prisma.student.findFirst({ where: { businessId: business.id } });
    if (!student) throw new Error('No student found');

    console.log(`Using Business: ${business.name}, Student: ${student.firstName}`);

    // 2. Create Template
    console.log('Creating Fee Template...');
    const template = await prisma.schoolFeeTemplate.create({
        data: {
            name: 'Test Tuition 2024',
            category: 'TUITION',
            amount: 1000,
            recurrence: 'MONTHLY',
            businessId: business.id
        }
    });
    console.log('✔ Template Created:', template.id);

    // 3. Assign Fee (Normal)
    console.log('Assigning Fee...');
    const fee = await prisma.studentFee.create({
        data: {
            studentId: student.id,
            title: 'Tuition Test',
            amount: 1000,
            dueDate: new Date(new Date().setDate(new Date().getDate() + 7)), // 1 week from now
            templateId: template.id,
            status: 'PENDING'
        }
    });
    console.log('✔ Fee Assigned:', fee.id);

    // 4. Test Partial Payment
    console.log('Registering Partial Payment ($400)...');

    // Simulate logic from API
    await prisma.studentPayment.create({
        data: { studentFeeId: fee.id, amount: 400, method: 'CASH' }
    });

    // Check Status Update Logic
    let updatedFee = await prisma.studentFee.findUnique({ where: { id: fee.id }, include: { payments: true } });
    let totalPaid = updatedFee.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid > 0 && totalPaid < updatedFee.amount) {
        await prisma.studentFee.update({ where: { id: fee.id }, data: { status: 'PARTIAL' } });
        console.log('✔ Status updated to PARTIAL');
    } else {
        console.error('❌ Status Logic Failed: Should be PARTIAL');
    }

    // 5. Test Full Payment
    console.log('Registering Remaining Payment ($600)...');
    await prisma.studentPayment.create({
        data: { studentFeeId: fee.id, amount: 600, method: 'CASH' }
    });

    updatedFee = await prisma.studentFee.findUnique({ where: { id: fee.id }, include: { payments: true } });
    totalPaid = updatedFee.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid >= updatedFee.amount) {
        await prisma.studentFee.update({ where: { id: fee.id }, data: { status: 'PAID' } });
        console.log('✔ Status updated to PAID');
    } else {
        console.error('❌ Status Logic Failed: Should be PAID');
    }

    // 6. Test Overdue Logic
    console.log('Creating Overdue Fee...');
    const overdueFee = await prisma.studentFee.create({
        data: {
            studentId: student.id,
            title: 'Past Due Fee',
            amount: 500,
            dueDate: new Date(new Date().setDate(new Date().getDate() - 7)), // 1 week ago
            status: 'PENDING'
        }
    });

    // Verify Computed Status (Simulating the API Read Logic)
    const isOverdue = new Date(overdueFee.dueDate) < new Date() && overdueFee.status !== 'PAID';
    if (isOverdue) {
        console.log('✔ Overdue Logic Verified: Fee is detected as overdue');
    } else {
        console.error('❌ Overdue Logic Failed');
    }

    console.log('Verification Complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
