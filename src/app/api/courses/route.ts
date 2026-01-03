import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkLimit, incrementResourceCount, decrementResourceCount } from "@/lib/plan-limits";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "UNAUTHORIZED", message: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const { name, description, teacherId, schedules, classroomId, branchIds } = body;

        if (!name) {
            return NextResponse.json({
                error: "MISSING_FIELDS",
                message: "El nombre del curso es requerido"
            }, { status: 400 });
        }

        // VALIDAR LÍMITE DE PLAN
        const businessId = session.user.businessId!;
        const limitCheck = await checkLimit(businessId, "courses");

        if (!limitCheck.allowed) {
            return NextResponse.json({
                error: "LIMIT_REACHED",
                message: limitCheck.message,
                limit: limitCheck.limit,
                current: limitCheck.current,
                planName: limitCheck.planName
            }, { status: 403 });
        }

        // Validate branches belong to business if provided
        let connectedBranches: { id: string }[] = [];
        if (branchIds && Array.isArray(branchIds) && branchIds.length > 0) {
            connectedBranches = branchIds.map((id: string) => ({ id }));
        }

        // Create course with schedules in a transaction
        const course = await prisma.$transaction(async (tx) => {
            const newCourse = await tx.course.create({
                data: {
                    name,
                    description: description || null,
                    teacherId: teacherId || null,
                    classroomId: classroomId || null,
                    businessId: session.user.businessId!,
                    branches: {
                        connect: connectedBranches
                    }
                },
                include: {
                    teacher: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    branches: true,
                },
            });

            // Create ClassSchedule entries if schedules provided
            if (schedules && schedules.length > 0) {
                for (const schedule of schedules) {
                    for (const dayOfWeek of schedule.days) {
                        await tx.classSchedule.create({
                            data: {
                                courseId: newCourse.id,
                                dayOfWeek,
                                startTime: schedule.startTime,
                                endTime: schedule.endTime,
                                classroomId: classroomId || null,
                                teacherId: teacherId || null,
                                businessId: session.user.businessId!,
                            },
                        });
                    }
                }
            }

            return newCourse;
        });

        // Incrementar contador
        await incrementResourceCount(businessId, "courses");

        return NextResponse.json(course);
    } catch (error) {
        console.error("[COURSES_POST]", error);
        return NextResponse.json({
            error: "INTERNAL_ERROR",
            message: "Error al crear el curso"
        }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get("branchId");

        const where: any = {
            businessId: session.user.businessId,
        };

        if (branchId) {
            where.OR = [
                { branches: { some: { id: branchId } } },
                { branches: { none: {} } }
            ];
        }

        // Optimized query with select instead of include
        const courses = await prisma.course.findMany({
            where,
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
                branches: true, // Include branches for UI display
                _count: {
                    select: {
                        enrollments: true,
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
        });

        return NextResponse.json(courses);
    } catch (error) {
        console.error("[COURSES_GET]", error);
        return NextResponse.json({ error: "INTERNAL_ERROR", message: "Error al obtener cursos" }, { status: 500 });
    }
}
export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({
                error: "INVALID_INPUT",
                message: "Se requiere un array de IDs"
            }, { status: 400 });
        }

        // Delete courses in a transaction to ensure all associated schedules are also handled
        // and only for the current business
        const result = await prisma.$transaction(async (tx) => {
            // ClassSchedule has a relation to Course, so we need to make sure they are deleted
            // If the schema has onDelete: Cascade, it's easier.
            // Let's force it just in case.
            await tx.classSchedule.deleteMany({
                where: {
                    courseId: {
                        in: ids
                    },
                    businessId: session.user.businessId!
                }
            });

            const deleted = await tx.course.deleteMany({
                where: {
                    id: {
                        in: ids
                    },
                    businessId: session.user.businessId!
                }
            });

            // Decrementar contador por cada curso eliminado
            for (let i = 0; i < result.count; i++) {
                await decrementResourceCount(session.user.businessId!, "courses");
            }

            return deleted;
        });

        return NextResponse.json({ success: true, count: result.count });
    } catch (error) {
        console.error("[COURSES_DELETE_BULK]", error);
        return NextResponse.json({
            error: "INTERNAL_ERROR",
            message: "Error al eliminar cursos"
        }, { status: 500 });
    }
}
