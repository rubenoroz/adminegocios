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

        // 1. Get students from direct course Enrollments
        const courseEnrollments = await prisma.enrollment.findMany({
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
            }
        });

        // 2. Get students from ClassSchedule (groups) enrollments for this course
        const scheduleEnrollments = await prisma.scheduleEnrollment.findMany({
            where: {
                schedule: {
                    courseId
                },
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
            }
        });

        // Combine and deduplicate students by ID
        const studentMap = new Map<string, any>();

        courseEnrollments.forEach(e => {
            if (e.student) {
                studentMap.set(e.student.id, e.student);
            }
        });

        scheduleEnrollments.forEach(e => {
            if (e.student) {
                studentMap.set(e.student.id, e.student);
            }
        });

        // Convert to array and sort by lastName
        const students = Array.from(studentMap.values()).sort((a, b) =>
            a.lastName.localeCompare(b.lastName)
        );

        return NextResponse.json(students);
    } catch (error) {
        console.error("[COURSE_STUDENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
