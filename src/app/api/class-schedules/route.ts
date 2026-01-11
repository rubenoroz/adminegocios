import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const branchId = searchParams.get("branchId");

    if (!businessId) {
        return NextResponse.json({ error: "businessId is required" }, { status: 400 });
    }

    try {
        const schedules = await prisma.classSchedule.findMany({
            where: {
                businessId,
                ...(branchId && { branchId }),
            },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                        teacher: {
                            select: { id: true, name: true }
                        }
                    }
                },
                classroom: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                teacher: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                enrollments: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                },
                cancellations: true,
                _count: {
                    select: { enrollments: true }
                }
            },
            orderBy: [
                { dayOfWeek: "asc" },
                { startTime: "asc" }
            ]
        });

        return NextResponse.json(schedules);
    } catch (error) {
        console.error("Error fetching class schedules:", error);
        return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { businessId, branchId, courseId, classroomId, teacherId, title, groupName, dayOfWeek, startTime, endTime, validFrom, validUntil } = body;

        // courseId AND classroomId AND groupName are required for groups
        if (!businessId || !courseId || !classroomId || !groupName || dayOfWeek === undefined || !startTime || !endTime) {
            return NextResponse.json({
                error: "Faltan campos requeridos. Debes seleccionar un curso, un salón y definir un nombre de grupo."
            }, { status: 400 });
        }

        // Helper function to check if two time ranges overlap
        const timesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
            const toMinutes = (time: string): number => {
                const [h, m] = time.split(":").map(Number);
                return h * 60 + m;
            };
            const s1 = toMinutes(start1);
            const e1 = toMinutes(end1);
            const s2 = toMinutes(start2);
            const e2 = toMinutes(end2);
            return s1 < e2 && e1 > s2;
        };

        // Validate classroom conflicts (if classroomId is provided)
        if (classroomId) {
            const existingSchedules = await prisma.classSchedule.findMany({
                where: {
                    businessId,
                    classroomId,
                    dayOfWeek
                },
                include: {
                    course: { select: { name: true } },
                    classroom: { select: { name: true } }
                }
            });

            const conflicting = existingSchedules.filter(s =>
                timesOverlap(startTime, endTime, s.startTime, s.endTime)
            );

            if (conflicting.length > 0) {
                const conflict = conflicting[0];
                return NextResponse.json({
                    hasConflict: true,
                    message: `El salón "${conflict.classroom?.name || 'asignado'}" ya está ocupado por "${conflict.course?.name || conflict.title || 'otra clase'}" de ${conflict.startTime} a ${conflict.endTime}`,
                    conflicts: conflicting.map(c => ({
                        courseName: c.course?.name || c.title || "Clase",
                        time: `${c.startTime} - ${c.endTime}`,
                        classroom: c.classroom?.name
                    }))
                }, { status: 409 });
            }
        }

        const schedule = await prisma.classSchedule.create({
            data: {
                businessId,
                branchId: branchId || null,
                courseId: courseId || null,
                classroomId: classroomId || null,
                teacherId: teacherId || null,
                title: title || null,
                groupName: groupName || null,
                dayOfWeek,
                startTime,
                endTime,
                validFrom: validFrom ? new Date(validFrom) : null,
                validUntil: validUntil ? new Date(validUntil) : null,
            },
            include: {
                course: { select: { id: true, name: true } },
                classroom: { select: { id: true, name: true } },
            }
        });

        return NextResponse.json(schedule, { status: 201 });
    } catch (error: any) {
        console.error("Error creating class schedule:", error?.message || error);
        console.error("Full error:", JSON.stringify(error, null, 2));
        return NextResponse.json({ error: "Failed to create schedule", details: error?.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, courseId, classroomId, teacherId, groupName, dayOfWeek, startTime, endTime, validFrom, validUntil } = body;

        if (!id) {
            return NextResponse.json({ error: "Schedule ID is required" }, { status: 400 });
        }

        // Get the current schedule to know its businessId and current values
        const currentSchedule = await prisma.classSchedule.findUnique({
            where: { id }
        });

        if (!currentSchedule) {
            return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
        }

        // Determine the values to use for validation (new or current)
        const checkClassroomId = classroomId !== undefined ? classroomId : currentSchedule.classroomId;
        const checkDayOfWeek = dayOfWeek !== undefined ? dayOfWeek : currentSchedule.dayOfWeek;
        const checkStartTime = startTime || currentSchedule.startTime;
        const checkEndTime = endTime || currentSchedule.endTime;

        // Helper function to check if two time ranges overlap
        const timesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
            const toMinutes = (time: string): number => {
                const [h, m] = time.split(":").map(Number);
                return h * 60 + m;
            };
            const s1 = toMinutes(start1);
            const e1 = toMinutes(end1);
            const s2 = toMinutes(start2);
            const e2 = toMinutes(end2);
            return s1 < e2 && e1 > s2;
        };

        // Validate classroom conflicts (if there's a classroomId)
        if (checkClassroomId) {
            const existingSchedules = await prisma.classSchedule.findMany({
                where: {
                    businessId: currentSchedule.businessId,
                    classroomId: checkClassroomId,
                    dayOfWeek: checkDayOfWeek,
                    id: { not: id } // Exclude current schedule
                },
                include: {
                    course: { select: { name: true } },
                    classroom: { select: { name: true } }
                }
            });

            const conflicting = existingSchedules.filter(s =>
                timesOverlap(checkStartTime, checkEndTime, s.startTime, s.endTime)
            );

            if (conflicting.length > 0) {
                const conflict = conflicting[0];
                return NextResponse.json({
                    hasConflict: true,
                    message: `El salón "${conflict.classroom?.name || 'asignado'}" ya está ocupado por "${conflict.course?.name || conflict.title || 'otra clase'}" de ${conflict.startTime} a ${conflict.endTime}`,
                    conflicts: conflicting.map(c => ({
                        courseName: c.course?.name || c.title || "Clase",
                        time: `${c.startTime} - ${c.endTime}`,
                        classroom: c.classroom?.name
                    }))
                }, { status: 409 });
            }
        }

        const schedule = await prisma.classSchedule.update({
            where: { id },
            data: {
                ...(courseId && { courseId }),
                ...(classroomId !== undefined && { classroomId: classroomId || null }),
                ...(teacherId !== undefined && { teacherId: teacherId || null }),
                ...(groupName !== undefined && { groupName: groupName || null }),
                ...(dayOfWeek !== undefined && { dayOfWeek }),
                ...(startTime && { startTime }),
                ...(endTime && { endTime }),
                ...(validFrom !== undefined && { validFrom: validFrom ? new Date(validFrom) : null }),
                ...(validUntil !== undefined && { validUntil: validUntil ? new Date(validUntil) : null }),
            },
            include: {
                course: { select: { id: true, name: true } },
                classroom: { select: { id: true, name: true } },
            }
        });

        return NextResponse.json(schedule);
    } catch (error) {
        console.error("Error updating class schedule:", error);
        return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Schedule ID is required" }, { status: 400 });
    }

    try {
        await prisma.classSchedule.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting class schedule:", error);
        return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 });
    }
}
