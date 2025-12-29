import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get("courseId");

        // 1. Fetch courses (either specific one or all for the teacher/admin)
        // For simplicity, if no courseId, we might want to return a summary of all courses
        // But let's focus on a per-course report or a general school report.
        // Let's support filtering by courseId.

        const whereClause = courseId ? { id: courseId } : {};

        const courses = await prisma.course.findMany({
            where: whereClause,
            include: {
                enrollments: {
                    include: {
                        student: true,
                    },
                },
                grades: true,
            },
        });

        const reportData = courses.map((course) => {
            const students = course.enrollments.map((e) => e.student);
            const grades = course.grades;

            // Calculate average per student
            const studentPerformances = students.map((student) => {
                const studentGrades = grades.filter((g) => g.studentId === student.id);

                if (studentGrades.length === 0) {
                    return {
                        student: { id: student.id, name: `${student.lastName}, ${student.firstName}` },
                        average: 0,
                        hasGrades: false,
                    };
                }

                // Simple average for now, or weighted if weights exist
                // Assuming weights are percentages (e.g. 40 for 40%)
                // If weights are present, use them. If not, simple average.

                let totalScore = 0;
                let totalWeight = 0;
                let hasWeights = studentGrades.some(g => g.weight !== null);

                if (hasWeights) {
                    studentGrades.forEach(g => {
                        const weight = g.weight || 0;
                        const normalizedValue = (g.value / g.maxValue) * 100;
                        totalScore += normalizedValue * (weight / 100);
                        totalWeight += weight;
                    });
                    // If total weight is less than 100, we might need to normalize or just show current progress
                    // For now, let's assume the calculated score is the current grade
                } else {
                    const sum = studentGrades.reduce((acc, g) => acc + (g.value / g.maxValue) * 100, 0);
                    totalScore = sum / studentGrades.length;
                }

                return {
                    student: { id: student.id, name: `${student.lastName}, ${student.firstName}` },
                    average: Math.round(totalScore * 10) / 10, // 1 decimal
                    hasGrades: true,
                };
            });

            // Filter out students with no grades for stats
            const activeStudents = studentPerformances.filter(s => s.hasGrades);

            const classAverage = activeStudents.length > 0
                ? activeStudents.reduce((acc, s) => acc + s.average, 0) / activeStudents.length
                : 0;

            const failingStudents = activeStudents.filter(s => s.average < 60);
            const passingStudents = activeStudents.filter(s => s.average >= 60);

            return {
                courseId: course.id,
                courseName: course.name,
                stats: {
                    average: Math.round(classAverage * 10) / 10,
                    totalStudents: students.length,
                    activeStudents: activeStudents.length,
                    passingCount: passingStudents.length,
                    failingCount: failingStudents.length,
                    passRate: activeStudents.length > 0 ? Math.round((passingStudents.length / activeStudents.length) * 100) : 0,
                },
                students: studentPerformances.sort((a, b) => b.average - a.average), // Rank by average
            };
        });

        return NextResponse.json(reportData);
    } catch (error) {
        console.error("[ACADEMIC_PERFORMANCE_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
