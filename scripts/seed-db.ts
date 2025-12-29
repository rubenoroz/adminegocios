import { prisma } from "../src/lib/prisma";

const FIRST_NAMES = ["Sofia", "Mateo", "Valentina", "Santiago", "Camila", "Sebastian", "Isabella", "Leonardo", "Mariana", "Emiliano"];
const LAST_NAMES = ["Garcia", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Perez", "Sanchez", "Ramirez", "Torres"];
const COURSES = ["Matemáticas 101", "Historia Universal", "Ciencias Naturales", "Literatura", "Inglés Avanzado"];

function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
    try {
        console.log("Starting seed...");

        // 1. Get or Create Business
        let business = await prisma.business.findFirst();
        if (!business) {
            console.log("Creating business...");
            business = await prisma.business.create({
                data: {
                    name: "Escuela Demo",
                    type: "SCHOOL",
                    slug: "escuela-demo-" + Math.floor(Math.random() * 1000),
                }
            });
        }
        console.log(`Using Business: ${business.id}`);

        // 2. Create Employees (Teachers & Staff)
        console.log("Creating employees...");
        const teachers = [];
        for (let i = 0; i < 5; i++) {
            const firstName = getRandomElement(FIRST_NAMES);
            const lastName = getRandomElement(LAST_NAMES);
            const teacher = await prisma.user.upsert({
                where: { email: `teacher${i}@school.com` },
                update: {},
                create: {
                    name: `${firstName} ${lastName}`,
                    email: `teacher${i}@school.com`,
                    password: "password123", // In real app, hash this
                    role: "TEACHER",
                    business: { connect: { id: business.id } },
                    status: "ACTIVE",
                    hourlyRate: 200 + Math.floor(Math.random() * 100),
                    paymentModel: Math.random() > 0.5 ? "COMMISSION" : "HOURLY",
                    commissionPercentage: 40
                }
            });
            teachers.push(teacher);
        }

        // 3. Create Courses
        console.log("Creating courses...");
        const courses = [];
        for (const name of COURSES) {
            const teacher = getRandomElement(teachers);
            const course = await prisma.course.create({
                data: {
                    name,
                    businessId: business.id,
                    description: "Curso introductorio",
                    teacherId: teacher.id,
                    status: "ACTIVE"
                }
            });
            courses.push(course);
        }
        console.log(`Created ${courses.length} courses`);

        // 4. Create Students & Parents
        console.log("Creating students and parents...");
        const students = [];
        for (let i = 0; i < 20; i++) {
            const firstName = getRandomElement(FIRST_NAMES);
            const lastName = getRandomElement(LAST_NAMES);

            // Create Parent
            const parent = await prisma.parentAccount.create({
                data: {
                    firstName: `Parent${i}`,
                    lastName: `Lastname${i}`,
                    email: `parent${i}@example.com`,
                    password: "password123",
                    phone: "555-0000",
                    business: { connect: { id: business.id } },
                    status: "ACTIVE"
                }
            });

            const student = await prisma.student.create({
                data: {
                    firstName,
                    lastName,
                    matricula: `MAT-${Math.floor(Math.random() * 100000)}`,
                    businessId: business.id,
                    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}${Math.floor(Math.random() * 100)}@example.com`,
                    status: "ACTIVE",
                    enrollments: {
                        create: {
                            courseId: getRandomElement(courses).id,
                            status: "ACTIVE",
                            enrolledAt: new Date()
                        }
                    },
                    parents: {
                        create: {
                            parentId: parent.id,
                            relationship: "FATHER",
                            isPrimary: true
                        }
                    },
                    scholarships: Math.random() > 0.7 ? {
                        create: {
                            name: "Beca Académica",
                            percentage: 20,
                            active: true
                        }
                    } : undefined
                }
            });
            students.push(student);
        }
        console.log(`Created ${students.length} students`);

        // 4. Create Attendance
        console.log("Creating attendance...");
        const attendanceRecords = [];
        const now = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(now.getDate() - i);

            for (const student of students) {
                const rand = Math.random();
                let status = "PRESENT";
                if (rand > 0.9) status = "ABSENT";
                else if (rand > 0.8) status = "LATE";

                const course = getRandomElement(courses);

                // Check if record exists to avoid unique constraint error
                const exists = await prisma.attendance.findUnique({
                    where: {
                        studentId_courseId_date: {
                            studentId: student.id,
                            courseId: course.id,
                            date: date
                        }
                    }
                });

                if (!exists) {
                    attendanceRecords.push(prisma.attendance.create({
                        data: {
                            studentId: student.id,
                            courseId: course.id,
                            date,
                            status,
                            // businessId: business.id // REMOVED as it doesn't exist
                        }
                    }));
                }
            }
        }
        await prisma.$transaction(attendanceRecords);
        console.log(`Created ${attendanceRecords.length} attendance records`);

        // 5. Create Fees
        console.log("Creating fees...");
        const feeRecords = [];
        for (let i = 0; i < 3; i++) {
            const monthDate = new Date();
            monthDate.setMonth(now.getMonth() - i);

            for (const student of students) {
                const rand = Math.random();
                let status = "PAID";
                if (rand > 0.9) status = "OVERDUE";
                else if (rand > 0.7) status = "PENDING";

                const hasScholarship = Math.random() > 0.7; // Approximate check, ideally check student relation
                const amount = 1500 + Math.floor(Math.random() * 500);
                const discount = hasScholarship ? amount * 0.2 : 0;

                feeRecords.push(prisma.studentFee.create({
                    data: {
                        title: `Colegiatura ${monthDate.toLocaleString('default', { month: 'long' })}`,
                        amount: amount - discount,
                        originalAmount: amount,
                        discountApplied: discount,
                        dueDate: monthDate,
                        status,
                        studentId: student.id,
                    }
                }));
            }
        }
        await prisma.$transaction(feeRecords);
        console.log(`Created ${feeRecords.length} fee records`);

    } catch (e) {
        console.error("SEED ERROR:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
