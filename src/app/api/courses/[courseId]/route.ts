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
                price: true,
                // color: true, // Commenting out to fix lint error if types are not synced
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
                                phone: true,
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
                        classroom: {
                            select: {
                                name: true
                            }
                        },
                        groupName: true,
                        enrollments: {
                            select: {
                                studentId: true,
                                student: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        matricula: true,
                                        email: true,
                                        phone: true
                                    }
                                }
                            }
                        }
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

        const typedCourse = course as any;

        // Generate a schedule summary from dynamic schedules
        let scheduleSummary = "Sin horario";
        let roomFromSchedules = "Por asignar";

        if (typedCourse.schedules && typedCourse.schedules.length > 0) {
            const schedulesCount = typedCourse.schedules.length;
            const firstSchedule = typedCourse.schedules[0];
            scheduleSummary = `${schedulesCount} sesión${schedulesCount > 1 ? "es" : ""} semanal${schedulesCount > 1 ? "es" : ""}`;

            // Get the most common room
            const rooms = typedCourse.schedules.map((s: any) => s.room).filter(Boolean);
            if (rooms.length > 0) {
                roomFromSchedules = rooms[0] as string;
            }
        }

        return NextResponse.json({
            ...typedCourse,
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
        const { name, description, teacherId, schedule, room, classroomId, price } = body;

        // Build update data
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (teacherId !== undefined) updateData.teacherId = teacherId;
        if (schedule !== undefined) updateData.schedule = schedule;
        if (room !== undefined) updateData.room = room;
        if (classroomId !== undefined) updateData.classroomId = classroomId || null;
        if (body.color !== undefined) updateData.color = body.color;
        if (price !== undefined) {
            const parsed = parseFloat(price);
            updateData.price = isNaN(parsed) ? 0 : parsed;
        }

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

        // Auto-add teacher to authorized teachers (CourseTeacher) if teacherId is being set
        if (teacherId) {
            const employee = await prisma.employee.findFirst({
                where: { userId: teacherId }
            });

            if (employee) {
                // Use upsert to avoid duplicate errors
                await prisma.courseTeacher.upsert({
                    where: {
                        courseId_employeeId: {
                            courseId: courseId,
                            employeeId: employee.id
                        }
                    },
                    update: {},
                    create: {
                        courseId: courseId,
                        employeeId: employee.id
                    }
                });
            }
        }

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
