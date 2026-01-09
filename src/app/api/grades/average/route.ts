import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Calculate the average grade for a course in a specific period
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get("courseId");
        const period = searchParams.get("period");

        if (!courseId) {
            return NextResponse.json({ error: "courseId is required" }, { status: 400 });
        }

        // Get all grades for this course and period
        const whereClause: any = { courseId };
        if (period) {
            whereClause.period = period;
        }

        const grades = await prisma.grade.findMany({
            where: whereClause,
            select: {
                value: true,
                weight: true,
                studentId: true,
                type: true
            }
        });

        if (grades.length === 0) {
            return NextResponse.json({ average: null, count: 0 });
        }

        // Group grades by student and calculate weighted average per student
        const studentGrades: Record<string, { total: number; weights: number }> = {};

        grades.forEach(grade => {
            if (!studentGrades[grade.studentId]) {
                studentGrades[grade.studentId] = { total: 0, weights: 0 };
            }
            const weight = grade.weight || 1;
            studentGrades[grade.studentId].total += grade.value * weight;
            studentGrades[grade.studentId].weights += weight;
        });

        // Calculate average of all student averages
        const studentIds = Object.keys(studentGrades);
        if (studentIds.length === 0) {
            return NextResponse.json({ average: null, count: 0 });
        }

        let totalAverage = 0;
        studentIds.forEach(studentId => {
            const studentData = studentGrades[studentId];
            if (studentData.weights > 0) {
                totalAverage += studentData.total / studentData.weights;
            }
        });

        const average = totalAverage / studentIds.length;

        return NextResponse.json({
            average: Math.round(average * 10) / 10, // Round to 1 decimal
            count: studentIds.length,
            totalGrades: grades.length
        });
    } catch (error) {
        console.error("[GRADES_AVERAGE_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
