import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FIRST_NAMES = ["Sofia", "Mateo", "Valentina", "Santiago", "Camila", "Sebastian", "Isabella", "Leonardo", "Mariana", "Emiliano"];
const LAST_NAMES = ["Garcia", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Perez", "Sanchez", "Ramirez", "Torres"];
const COURSES = ["Matemáticas 101", "Historia Universal", "Ciencias Naturales", "Literatura", "Inglés Avanzado"];

function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export async function GET(req: Request) {
    try {
        // 1. Get Business
        // 1. Get or Create Business
        let business = await prisma.business.findFirst();
        if (!business) {
            console.log("No business found, creating default one...");
            business = await prisma.business.create({
                data: {
                    name: "Escuela Demo",
                    type: "SCHOOL",
                    slug: "escuela-demo-" + Math.floor(Math.random() * 1000),
                }
            });
        }

        // 2. Create Courses
        const courses = [];
        for (const name of COURSES) {
            const course = await prisma.course.create({
                data: {
                    name,
                    businessId: business.id,
                    description: "Curso introductorio",
                    startDate: new Date(),
                    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                }
            });
            courses.push(course);
        }

        // 3. Create Students & Enrollments
        const students = [];
        for (let i = 0; i < 20; i++) {
            const firstName = getRandomElement(FIRST_NAMES);
            const lastName = getRandomElement(LAST_NAMES);

            const student = await prisma.student.create({
                data: {
                    firstName,
                    lastName,
                    matricula: `MAT-${Math.floor(Math.random() * 10000)}`,
                    businessId: business.id,
                    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
                    enrollments: {
                        create: {
                            courseId: getRandomElement(courses).id,
                            status: "ACTIVE",
                            enrolledAt: new Date()
                        }
                    }
                }
            });
            students.push(student);
        }

        // 4. Create Attendance (Last 7 days)
        const attendanceRecords = [];
        const now = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(now.getDate() - i);

            for (const student of students) {
                // 80% Present, 10% Absent, 10% Late
                const rand = Math.random();
                let status = "PRESENT";
                if (rand > 0.9) status = "ABSENT";
                else if (rand > 0.8) status = "LATE";

                // Pick a random course the student is enrolled in (simplified: just pick one from all courses for seeding)
                // In reality we should check enrollments, but for seeding speed we'll pick a random course from the list
                // assuming they might have class.
                const course = getRandomElement(courses);

                attendanceRecords.push(prisma.attendance.create({
                    data: {
                        studentId: student.id,
                        courseId: course.id,
                        date,
                        status,
                        businessId: business.id
                    }
                }));
            }
        }
        await prisma.$transaction(attendanceRecords);

        // 5. Create Fees (Last 3 months)
        const feeRecords = [];
        for (let i = 0; i < 3; i++) {
            const monthDate = new Date();
            monthDate.setMonth(now.getMonth() - i);

            for (const student of students) {
                const rand = Math.random();
                let status = "PAID";
                if (rand > 0.9) status = "OVERDUE";
                else if (rand > 0.7) status = "PENDING";

                feeRecords.push(prisma.studentFee.create({
                    data: {
                        title: `Colegiatura ${monthDate.toLocaleString('default', { month: 'long' })}`,
                        amount: 1500 + Math.floor(Math.random() * 500),
                        dueDate: monthDate,
                        status,
                        studentId: student.id,
                        // businessId is not on StudentFee directly based on previous schema checks, it's via Student
                        // Wait, let's check schema if StudentFee has businessId. 
                        // Previous view showed: model StudentFee { ... student Student ... }
                        // It relies on student relation.
                    }
                }));
            }
        }
        await prisma.$transaction(feeRecords);

        return NextResponse.json({
            message: "Database seeded successfully",
            stats: {
                students: students.length,
                courses: courses.length,
                attendance: attendanceRecords.length,
                fees: feeRecords.length
            }
        });

    } catch (error) {
        console.error("[SEED_ERROR]", error);
        return NextResponse.json({ error: "Internal Error: " + error }, { status: 500 });
    }
}
