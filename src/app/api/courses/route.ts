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
        const { name, description, teacherId, schedules, classroomId, branchIds, price, color } = body;

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
                    color: color || "#3B82F6",
                    price: price ? parseFloat(price) : 0,
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

            // Auto-add teacher to authorized teachers (CourseTeacher) if teacherId is provided
            if (teacherId) {
                const employee = await tx.employee.findFirst({
                    where: { userId: teacherId }
                });

                if (employee) {
                    // Use upsert to avoid duplicate errors
                    await tx.courseTeacher.upsert({
                        where: {
                            courseId_employeeId: {
                                courseId: newCourse.id,
                                employeeId: employee.id
                            }
                        },
                        update: {},
                        create: {
                            courseId: newCourse.id,
                            employeeId: employee.id
                        }
                    });
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

        // Optimized query to fetch necessary data
        const rawCourses: any[] = await prisma.course.findMany({
            where,
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
                branches: true,
                // Include schedules enrollments to calculate real student count
                schedules: {
                    select: {
                        enrollments: {
                            select: {
                                studentId: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        enrollments: true, // Keep direct enrollments just in case
                        grades: true, // Count grades to know if course has been evaluated
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
        });

        // Process courses to calculate unique students from schedules
        const courses = rawCourses.map((course: any) => {
            // Get all student IDs from all schedules of this course
            const scheduleStudentIds = course.schedules?.flatMap((s: any) =>
                s.enrollments?.map((e: any) => e.studentId) || []
            ) || [];

            // Count unique students
            const uniqueStudents = new Set(scheduleStudentIds).size;

            // Use the greater of direct enrollments or schedule enrollments
            // This handles legacy data or different enrollment flows
            const totalEnrollments = Math.max(course._count.enrollments, uniqueStudents);

            return {
                ...course,
                hasGrades: course._count.grades > 0, // True if course has any grades
                _count: {
                    enrollments: totalEnrollments,
                    grades: course._count.grades
                },
                // Build a summary of schedules for UI if needed, or remove to save bandwidth
                // Removing heavy schedule data from response as it's not needed for the list view
                schedules: undefined
            };
        });

        return NextResponse.json(courses);
    } catch (error) {
        console.error("[COURSES_GET] Full Error:", error);
        return NextResponse.json({ error: "INTERNAL_ERROR", message: "Error al obtener cursos", details: String(error) }, { status: 500 });
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
            for (let i = 0; i < deleted.count; i++) {
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
