import { prisma } from "../src/lib/prisma";

async function main() {
    try {
        console.log("Testing Payroll Logic...");

        // 1. Get Business and Update Settings
        const business = await prisma.business.findFirst();
        if (!business) return;

        await prisma.business.update({
            where: { id: business.id },
            data: {
                expenseReservePercentage: 5,
                benefitsReservePercentage: 10
            }
        });
        console.log("Updated Business Settings: Reserves 5% / 10%");

        // 2. Get a Teacher and Update Model
        // Find a user with role TEACHER or create one
        let teacher = await prisma.user.findFirst({ where: { role: "TEACHER", businessId: business.id } });
        if (!teacher) {
            // Create one if missing
            teacher = await prisma.user.create({
                data: {
                    email: "profe.test@example.com",
                    password: "password",
                    firstName: "Profe",
                    lastName: "Test",
                    role: "TEACHER",
                    businessId: business.id
                }
            });
        }

        await prisma.user.update({
            where: { id: teacher.id },
            data: {
                paymentModel: "COMMISSION",
                commissionPercentage: 40 // 40% commission
            }
        });
        console.log(`Updated Teacher ${teacher.firstName}: Commission 40%`);

        // 3. Ensure Teacher has a Course and Paid Fees
        const course = await prisma.course.findFirst({ where: { businessId: business.id } });
        if (course) {
            await prisma.course.update({
                where: { id: course.id },
                data: { teacherId: teacher.id }
            });

            // Create a paid fee
            await prisma.studentFee.create({
                data: {
                    title: "Test Fee",
                    amount: 1000,
                    dueDate: new Date(),
                    status: "PAID",
                    studentId: (await prisma.student.findFirst({ where: { businessId: business.id } }))?.id!,
                    courseId: course.id,
                    updatedAt: new Date() // Paid now
                }
            });
            console.log("Created Paid Fee: $1000");
        }

        // 4. Run Payroll Logic (Simulated)
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const paidFees = await prisma.studentFee.aggregate({
            where: {
                status: "PAID",
                updatedAt: { gte: startDate, lte: endDate },
                course: { teacherId: teacher.id }
            },
            _sum: { amount: true }
        });

        const totalRevenue = paidFees._sum.amount || 0;
        const grossPay = totalRevenue * 0.40;
        const expenses = grossPay * 0.05;
        const benefits = grossPay * 0.10;
        const netPay = grossPay - expenses - benefits;

        console.log("--- Calculation Result ---");
        console.log(`Total Revenue: $${totalRevenue}`);
        console.log(`Gross Pay (40%): $${grossPay}`);
        console.log(`Expenses Reserve (5%): $${expenses}`);
        console.log(`Benefits Reserve (10%): $${benefits}`);
        console.log(`Net Pay: $${netPay}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
