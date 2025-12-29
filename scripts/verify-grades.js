
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting Grades Logic Verification...');

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

    // 2. Clear previous grades for this student/course/period
    const PERIOD = 'PARTIAL_1';
    await prisma.grade.deleteMany({
        where: {
            courseId: activeCourse.id,
            studentId: student.id,
            period: PERIOD
        }
    });

    // 3. Test Upsert (Insert EXAM)
    console.log('Testing INSERT Grade (EXAM)...');
    const grade1 = await prisma.grade.upsert({
        where: {
            studentId_courseId_period_type: {
                studentId: student.id,
                courseId: activeCourse.id,
                period: PERIOD,
                type: 'EXAM',
            },
        },
        update: { value: 85 },
        create: {
            studentId: student.id,
            courseId: activeCourse.id,
            period: PERIOD,
            type: 'EXAM',
            name: 'Examen Parcial 1',
            value: 85,
            maxValue: 100,
            weight: 0.4
        },
    });
    console.log('✔ Grade Created:', grade1.value);

    // 4. Test Upsert (Update EXAM)
    console.log('Testing UPDATE Grade (EXAM)...');
    const grade2 = await prisma.grade.upsert({
        where: {
            studentId_courseId_period_type: {
                studentId: student.id,
                courseId: activeCourse.id,
                period: PERIOD,
                type: 'EXAM',
            },
        },
        update: { value: 95 },
        create: {
            studentId: student.id,
            courseId: activeCourse.id,
            period: PERIOD,
            type: 'EXAM',
            name: 'Examen Parcial 1',
            value: 95,
            maxValue: 100,
            weight: 0.4
        },
    });

    if (grade2.id === grade1.id && grade2.value === 95) {
        console.log('✔ Grade Updated Correctly (ID consistent)');
    } else {
        console.error(`❌ Update Logic Failed: expected 95, got ${grade2.value} or ID changed`);
    }

    // 5. Test Multiple Criteria (HOMEWORK)
    console.log('Testing INSERT Second Criterion (HOMEWORK)...');
    await prisma.grade.create({
        data: {
            studentId: student.id,
            courseId: activeCourse.id,
            period: PERIOD,
            type: 'HOMEWORK',
            name: 'Tareas Parcial 1',
            value: 100,
            maxValue: 100,
            weight: 0.3
        }
    });

    // 6. Verify Retrieval
    const grades = await prisma.grade.findMany({
        where: {
            studentId: student.id,
            courseId: activeCourse.id,
            period: PERIOD
        }
    });

    console.log(`✔ Retrieved ${grades.length} grades for ${PERIOD}.`);
    if (grades.length === 2) {
        console.log('✔ Count matches expected (Exam + Homework)');
    } else {
        console.error('❌ Mismatch in grade count');
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
