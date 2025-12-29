import { prisma } from "../src/lib/prisma";

async function main() {
    const businesses = await prisma.business.findMany();
    console.log(`Total Businesses: ${businesses.length}`);
    businesses.forEach(b => console.log(`- ${b.name} (${b.id})`));

    const business = businesses[0];

    const students = await prisma.student.count({ where: { businessId: business.id } });
    console.log(`Students: ${students}`);

    const attendance = await prisma.attendance.count({ where: { course: { businessId: business.id } } });
    console.log(`Attendance: ${attendance}`);

    const fees = await prisma.studentFee.count({ where: { student: { businessId: business.id } } });
    console.log(`Fees: ${fees}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
