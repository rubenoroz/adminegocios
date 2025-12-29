import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { courseId } = await params;

        const enrollments = await prisma.enrollment.findMany({
            where: {
                courseId,
                status: 'ACTIVE'
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        matricula: true,
                        status: true
                    }
                }
            },
            orderBy: {
                student: { lastName: 'asc' }
            }
        });

        // Flatten structure for the frontend
        const students = enrollments.map(e => e.student);

        return NextResponse.json(students);
    } catch (error) {
        console.error("[COURSE_STUDENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
