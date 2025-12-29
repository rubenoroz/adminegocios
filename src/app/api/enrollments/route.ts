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
        const { courseId, studentIds } = body;

        if (!courseId || !studentIds || !Array.isArray(studentIds)) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Create enrollments for all students
        const enrollments = await Promise.all(
            studentIds.map((studentId: string) =>
                prisma.enrollment.create({
                    data: {
                        courseId,
                        studentId,
                    },
                    include: {
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                matricula: true,
                            },
                        },
                    },
                })
            )
        );

        return NextResponse.json({
            success: true,
            count: enrollments.length,
            enrollments,
        });
    } catch (error) {
        console.error("[ENROLLMENTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get("studentId");
        const courseId = searchParams.get("courseId");

        const where: any = {};
        if (studentId) where.studentId = studentId;
        if (courseId) where.courseId = courseId;

        const enrollments = await prisma.enrollment.findMany({
            where,
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        matricula: true,
                    },
                },
                course: {
                    select: {
                        id: true,
                        name: true,
                        teacher: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json(enrollments);
    } catch (error) {
        console.error("[ENROLLMENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const enrollmentId = searchParams.get("enrollmentId");

        if (!enrollmentId) {
            return new NextResponse("Missing enrollmentId", { status: 400 });
        }

        await prisma.enrollment.delete({
            where: { id: enrollmentId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[ENROLLMENT_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
