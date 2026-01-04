
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
});

const BUSINESS_ID = "cmjygf2aw0002pv9mhvgzlaqb"; // Known business ID

async function main() {
    console.log("--- TESTING CLASSROOMS QUERY ---");
    try {
        const classrooms = await prisma.classroom.findMany({
            where: {
                businessId: BUSINESS_ID,
            },
            orderBy: {
                name: "asc",
            },
            include: {
                branch: true,
            },
        });
        console.log("Classrooms query successful. Count:", classrooms.length);
    } catch (error) {
        console.error("Classrooms query FAILED:", error);
    }

    console.log("\n--- TESTING COURSES QUERY ---");
    try {
        const courses = await prisma.course.findMany({
            where: {
                businessId: BUSINESS_ID,
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
                branches: true,
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
        console.log("Courses query successful. Count:", courses.length);
        console.log("Sample course:", JSON.stringify(courses[0], null, 2));

    } catch (error) {
        console.error("Courses query FAILED:", error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
