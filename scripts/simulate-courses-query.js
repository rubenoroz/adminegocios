
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Fetching a business ID...');
    const business = await prisma.business.findFirst();
    if (!business) {
        console.log('No business found.');
        return;
    }
    console.log('Using Business ID:', business.id);

    console.log('Running courses query...');
    const courses = await prisma.course.findMany({
        where: {
            businessId: business.id,
        },
        select: {
            id: true,
            name: true,
            description: true,
            gradeLevel: true,
            schedule: true,
            room: true,
            teacher: {
                select: {
                    id: true,
                    name: true,
                },
            },
            _count: {
                select: {
                    enrollments: true,
                },
            },
        },
        orderBy: {
            name: "asc",
        },
    });
    console.log('Query success! Courses found:', courses.length);
    if (courses.length > 0) {
        console.log('Sample course:', courses[0]);
    }
}

main()
    .catch((e) => {
        console.error('Query Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
