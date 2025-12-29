import { prisma } from "../src/lib/prisma";

async function main() {
    try {
        console.log("Checking database...");
        const businessCount = await prisma.business.count();
        console.log(`Businesses found: ${businessCount}`);

        if (businessCount > 0) {
            const business = await prisma.business.findFirst();
            console.log(`First Business ID: ${business?.id}`);
            console.log(`First Business Name: ${business?.name}`);

            const students = await prisma.student.count({ where: { businessId: business?.id } });
            console.log(`Students: ${students}`);

            const fees = await prisma.studentFee.count({ where: { student: { businessId: business?.id } } });
            console.log(`Fees: ${fees}`);

            const attendance = await prisma.attendance.count({ where: { businessId: business?.id } });
            console.log(`Attendance: ${attendance}`);
        } else {
            console.log("No businesses found! Seeding script would fail.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
