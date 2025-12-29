
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting Attendance Logic Verification...');

    // 1. Setup Data
    const business = await prisma.business.findFirst();
    if (!business) throw new Error('No business found');

    const course = await prisma.course.findFirst({
        where: { businessId: business.id },
        include: { enrollments: true }
    });

    if (!course) throw new Error('No course found');
    if (course.enrollments.length === 0) {
        console.log('⚠ Course has no enrollments. Creating a dummy enrollment...');
        const student = await prisma.student.findFirst({ where: { businessId: business.id } });
        if (student) {
            await prisma.enrollment.create({
                data: { studentId: student.id, courseId: course.id }
            });
        }
    }

    // Reload course with enrollments
    const activeCourse = await prisma.course.findFirst({
        where: { id: course.id },
        include: { enrollments: { include: { student: true } } }
    });

    const student = activeCourse.enrollments[0].student;
    console.log(`Using Course: ${activeCourse.name}, Student: ${student.firstName}`);

    // 2. Clear previous test data for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.attendance.deleteMany({
        where: {
            courseId: activeCourse.id,
            studentId: student.id,
            date: today
        }
    });

    // 3. Test Upsert (New Record)
    console.log('Testing NEW Attendance Record (ABSENT)...');
    const record1 = await prisma.attendance.upsert({
        where: {
            studentId_courseId_date: {
                studentId: student.id,
                courseId: activeCourse.id,
                date: today,
            },
        },
        update: { status: 'ABSENT' },
        create: {
            studentId: student.id,
            courseId: activeCourse.id,
            date: today,
            status: 'ABSENT',
        },
    });
    console.log('✔ Record Created:', record1.status);

    // 4. Test Upsert (Update Record)
    console.log('Testing UPDATE Attendance Record (PRESENT)...');
    const record2 = await prisma.attendance.upsert({
        where: {
            studentId_courseId_date: {
                studentId: student.id,
                courseId: activeCourse.id,
                date: today,
            },
        },
        update: { status: 'PRESENT' },
        create: {
            studentId: student.id,
            courseId: activeCourse.id,
            date: today,
            status: 'PRESENT',
        },
    });

    if (record2.id === record1.id && record2.status === 'PRESENT') {
        console.log('✔ Record Updated Correctly (ID consistent)');
    } else {
        console.error('❌ Update Logic Failed: created new record or failed update');
    }

    // 5. Verify Uniqueness Constraint
    console.log('Verifying Uniqueness Constraint...');
    try {
        await prisma.attendance.create({
            data: {
                studentId: student.id,
                courseId: activeCourse.id,
                date: today,
                status: 'LATE',
            }
        });
        console.error('❌ Duplicate protection FAILED');
    } catch (e) {
        if (e.code === 'P2002') {
            console.log('✔ Duplicate protection OK (Prisma threw P2002)');
        } else {
            console.error('❌ Unexpected error:', e);
        }
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
