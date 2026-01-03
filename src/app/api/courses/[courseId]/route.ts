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
            return NextResponse.json({ error: "UNAUTHORIZED", message: "No autorizado" }, { status: 401 });
        }

        const { courseId } = await params;

        const course = await prisma.course.findUnique({
            where: { id: courseId },
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
                enrollments: {
                    select: {
                        id: true,
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                matricula: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        student: {
                            lastName: "asc",
                        },
                    },
                },
                schedules: {
                    select: {
                        id: true,
                        dayOfWeek: true,
                        startTime: true,
                        endTime: true,
                        room: true,
                    },
                    orderBy: [
                        { dayOfWeek: "asc" },
                        { startTime: "asc" }
                    ]
                },
                _count: {
                    select: {
                        enrollments: true,
                        schedules: true
                    }
                }
            },
        });

        if (!course) {
            return NextResponse.json({ error: "NOT_FOUND", message: "Curso no encontrado" }, { status: 404 });
        }

        // Generate a schedule summary from dynamic schedules
        let scheduleSummary = "Sin horario";
        let roomFromSchedules = "Por asignar";

        if (course.schedules && course.schedules.length > 0) {
            const schedulesCount = course.schedules.length;
            const firstSchedule = course.schedules[0];
            scheduleSummary = `${schedulesCount} sesión${schedulesCount > 1 ? "es" : ""} semanal${schedulesCount > 1 ? "es" : ""}`;

            // Get the most common room
            const rooms = course.schedules.map(s => s.room).filter(Boolean);
            if (rooms.length > 0) {
                roomFromSchedules = rooms[0] as string;
            }
        }

        return NextResponse.json({
            ...course,
            scheduleSummary,
            roomFromSchedules
        });
    } catch (error) {
        console.error("[COURSE_GET]", error);
        return NextResponse.json({ error: "INTERNAL_ERROR", message: "Error al obtener el curso" }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "UNAUTHORIZED", message: "No autorizado" }, { status: 401 });
        }

        const { courseId } = await params;
        const body = await req.json();
        const { name, description, teacherId, schedule, room, classroomId } = body;

        // Build update data
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (teacherId !== undefined) updateData.teacherId = teacherId;
        if (schedule !== undefined) updateData.schedule = schedule;
        if (room !== undefined) updateData.room = room;
        if (classroomId !== undefined) updateData.classroomId = classroomId || null;

        const course = await prisma.course.update({
            where: { id: courseId },
            data: updateData,
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                classroom: {
                    include: {
                        branch: true
                    }
                },
            },
        });

        return NextResponse.json(course);
    } catch (error) {
        console.error("[COURSE_PATCH]", error);
        return NextResponse.json({ error: "INTERNAL_ERROR", message: "Error al actualizar curso" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "UNAUTHORIZED", message: "No autorizado" }, { status: 401 });
        }

        const { courseId } = await params;

        await prisma.course.delete({
            where: { id: courseId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[COURSE_DELETE]", error);
        return NextResponse.json({ error: "INTERNAL_ERROR", message: "Error al eliminar curso" }, { status: 500 });
    }
}
