import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get courses where the user is the teacher
        const courses = await prisma.course.findMany({
            where: {
                teacherId: session.user.id,
            },
            include: {
                _count: {
                    select: { enrollments: true },
                },
                enrollments: {
                    include: {
                        student: true
                    }
                }
            },
        });

        // Check attendance for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const coursesWithStatus = await Promise.all(
            courses.map(async (course) => {
                const attendanceCount = await prisma.attendance.count({
                    where: {
                        courseId: course.id,
                        date: {
                            gte: today,
                            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                        },
                    },
                });

                return {
                    ...course,
                    attendanceTaken: attendanceCount > 0,
                    studentCount: course._count.enrollments,
                };
            })
        );

        // Get recent behavior alerts for students in these courses
        // Get all student IDs in these courses
        const studentIds = courses.flatMap(c => c.enrollments.map(e => e.studentId));

        const recentAlerts = await prisma.studentNote.findMany({
            where: {
                studentId: { in: studentIds },
                type: "BEHAVIOR",
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
            },
            include: {
                student: true,
                course: true,
                author: {
                    select: { name: true }
                }
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 5,
        });

        return NextResponse.json({
            courses: coursesWithStatus,
            recentAlerts,
            userName: session.user.name,
        });
    } catch (error) {
        console.error("[TEACHER_DASHBOARD_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
