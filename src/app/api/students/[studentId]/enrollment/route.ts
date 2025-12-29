import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Get student's active enrollment with course and teacher info
export async function GET(
    req: Request,
    { params }: { params: Promise<{ studentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { studentId } = await params;

        // Find the student's active enrollment with course and teacher
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                studentId: studentId,
                status: "ACTIVE"
            },
            include: {
                course: {
                    include: {
                        teacher: {
                            select: {
                                id: true,
                                email: true,
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                enrolledAt: "desc"
            }
        });

        if (!enrollment) {
            return NextResponse.json(null);
        }

        return NextResponse.json({
            id: enrollment.id,
            course: enrollment.course ? {
                id: enrollment.course.id,
                name: enrollment.course.name,
                teacher: enrollment.course.teacher ? {
                    id: enrollment.course.teacher.id,
                    email: enrollment.course.teacher.email,
                    name: enrollment.course.teacher.name
                } : null
            } : null
        });
    } catch (error) {
        console.error("[STUDENT_ENROLLMENT_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
