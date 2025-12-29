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
        const businessId = searchParams.get("businessId");
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

        if (!businessId) {
            return new NextResponse("Business ID required", { status: 400 });
        }

        // 1. Fetch all courses for the business
        const courses = await prisma.course.findMany({
            where: { businessId },
            select: { id: true, name: true }
        });

        // 2. Fetch all fees for the year linked to courses
        // Note: Since we just added courseId, old fees might be null. 
        // We might need to fallback to enrollment logic if courseId is null, 
        // but for new data it will work. For legacy data import, we should set courseId.

        // For now, let's try to infer course from enrollment if courseId is missing in fee
        // But that's complex in a single query. 
        // Let's fetch fees with student enrollments to map manually if needed.

        const fees = await prisma.studentFee.findMany({
            where: {
                student: { businessId },
                dueDate: {
                    gte: new Date(year, 0, 1),
                    lte: new Date(year, 11, 31)
                }
            },
            include: {
                student: {
                    include: {
                        enrollments: {
                            where: { status: "ACTIVE" },
                            include: { course: true }
                        }
                    }
                }
            }
        });

        // 3. Aggregate data
        // Map: CourseID -> [Month0_Count, Month1_Count, ...]
        const stats: Record<string, Set<string>[]> = {}; // Set of StudentIDs to count unique students

        // Initialize stats for all courses
        courses.forEach(c => {
            stats[c.id] = Array(12).fill(null).map(() => new Set());
        });

        fees.forEach((fee: any) => {
            const month = new Date(fee.dueDate).getMonth();
            let courseId = fee.courseId;

            // Fallback: if fee has no courseId, use student's first active enrollment
            if (!courseId && fee.student.enrollments.length > 0) {
                courseId = fee.student.enrollments[0].courseId;
            }

            if (courseId && stats[courseId]) {
                // Count this student for this course in this month
                // We count if fee exists (implies active/billed)
                stats[courseId][month].add(fee.studentId);
            }
        });

        // Format for response
        const reportData = courses.map(c => {
            const monthlyCounts = stats[c.id].map(set => set.size);
            return {
                id: c.id,
                name: c.name,
                months: monthlyCounts,
                total: monthlyCounts.reduce((a, b) => a + b, 0)
            };
        });

        return NextResponse.json(reportData);
    } catch (error) {
        console.error("[CLASS_STATS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
