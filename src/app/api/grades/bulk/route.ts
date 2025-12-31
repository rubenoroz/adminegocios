import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { courseId, period, grades } = body;

        if (!courseId || !period || !grades || !Array.isArray(grades)) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Bulk upsert grades
        const results = await Promise.all(
            grades.map((gradeData: any) =>
                prisma.grade.upsert({
                    where: {
                        studentId_courseId_period_type: {
                            studentId: gradeData.studentId,
                            courseId,
                            period,
                            type: gradeData.type,
                        },
                    },
                    update: {
                        value: parseFloat(gradeData.value),
                        maxValue: gradeData.maxValue ? parseFloat(gradeData.maxValue) : 100,
                        weight: gradeData.weight ? parseFloat(gradeData.weight) : null,
                    },
                    create: {
                        name: gradeData.name || gradeData.type,
                        studentId: gradeData.studentId,
                        courseId,
                        period,
                        type: gradeData.type,
                        value: parseFloat(gradeData.value),
                        maxValue: gradeData.maxValue ? parseFloat(gradeData.maxValue) : 100,
                        weight: gradeData.weight ? parseFloat(gradeData.weight) : null,
                    },
                })
            )
        );

        return NextResponse.json({
            success: true,
            count: results.length,
            grades: results,
        });
    } catch (error) {
        console.error("[GRADES_BULK_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
