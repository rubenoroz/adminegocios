import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET enrollments for a schedule or student
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get("scheduleId");
    const studentId = searchParams.get("studentId");
    const businessId = searchParams.get("businessId");

    if (!scheduleId && !studentId) {
        return NextResponse.json({ error: "scheduleId or studentId is required" }, { status: 400 });
    }

    try {
        const enrollments = await prisma.scheduleEnrollment.findMany({
            where: {
                ...(scheduleId && { scheduleId }),
                ...(studentId && { studentId }),
                ...(businessId && {
                    schedule: { businessId }
                }),
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        matricula: true,
                        email: true,
                    }
                },
                schedule: {
                    select: {
                        id: true,
                        dayOfWeek: true,
                        startTime: true,
                        endTime: true,
                        course: { select: { id: true, name: true } },
                    }
                }
            },
            orderBy: { enrolledAt: "desc" }
        });

        return NextResponse.json(enrollments);
    } catch (error) {
        console.error("Error fetching schedule enrollments:", error);
        return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 });
    }
}

// POST - Enroll student(s) in a schedule
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { scheduleId, studentIds, propagateToSiblings, skipConflictCheck } = body;

        if (!scheduleId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return NextResponse.json({ error: "scheduleId and studentIds array are required" }, { status: 400 });
        }

        // Get the target schedule info for conflict checking
        const targetSchedule = await prisma.classSchedule.findUnique({
            where: { id: scheduleId },
            select: {
                id: true,
                dayOfWeek: true,
                startTime: true,
                endTime: true,
                courseId: true,
                businessId: true,
                course: { select: { name: true } }
            }
        });

        if (!targetSchedule) {
            return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
        }

        // Helper to check if two time ranges overlap
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

        // Check for conflicts if not skipped
        if (!skipConflictCheck) {
            const conflicts: Array<{ studentName: string; conflictingCourse: string; day: number; time: string }> = [];

            for (const studentId of studentIds) {
                // Get student's existing enrollments
                const existingEnrollments = await prisma.scheduleEnrollment.findMany({
                    where: {
                        studentId,
                        status: "ACTIVE",
                        schedule: {
                            dayOfWeek: targetSchedule.dayOfWeek,
                            businessId: targetSchedule.businessId,
                        }
                    },
                    include: {
                        student: { select: { firstName: true, lastName: true } },
                        schedule: {
                            select: {
                                id: true,
                                startTime: true,
                                endTime: true,
                                course: { select: { name: true } }
                            }
                        }
                    }
                });

                // Check for time overlap
                for (const enrollment of existingEnrollments) {
                    if (enrollment.schedule.id === scheduleId) continue; // Skip same schedule

                    if (timesOverlap(
                        targetSchedule.startTime,
                        targetSchedule.endTime,
                        enrollment.schedule.startTime,
                        enrollment.schedule.endTime
                    )) {
                        conflicts.push({
                            studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
                            conflictingCourse: enrollment.schedule.course?.name || "Otro horario",
                            day: targetSchedule.dayOfWeek,
                            time: `${enrollment.schedule.startTime} - ${enrollment.schedule.endTime}`
                        });
                    }
                }
            }

            // If there are conflicts, return them as a warning
            if (conflicts.length > 0) {
                return NextResponse.json({
                    hasConflicts: true,
                    conflicts,
                    message: `Se detectaron ${conflicts.length} conflicto(s) de horario. ¿Desea continuar de todos modos?`
                }, { status: 409 });
            }
        }

        let targetScheduleIds = [scheduleId];

        // If propagation is requested, find all active siblings (same course, same business)
        if (propagateToSiblings) {
            if (targetSchedule.courseId) {
                const siblings = await prisma.classSchedule.findMany({
                    where: {
                        courseId: targetSchedule.courseId,
                        businessId: targetSchedule.businessId,
                        OR: [
                            { validUntil: null },
                            { validUntil: { gte: new Date() } }
                        ]
                    },
                    select: { id: true }
                });
                targetScheduleIds = siblings.map(s => s.id);
            }
        }

        // Create enrollments for each student in EACH target schedule
        const operations = [];

        for (const targetId of targetScheduleIds) {
            for (const studentId of studentIds) {
                operations.push(
                    prisma.scheduleEnrollment.upsert({
                        where: {
                            studentId_scheduleId: { studentId, scheduleId: targetId }
                        },
                        create: {
                            studentId,
                            scheduleId: targetId,
                            status: "ACTIVE",
                        },
                        update: {
                            status: "ACTIVE",
                        },
                    })
                );
            }
        }

        const enrollments = await prisma.$transaction(operations);

        return NextResponse.json(enrollments, { status: 201 });
    } catch (error) {
        console.error("Error creating schedule enrollments:", error);
        return NextResponse.json({ error: "Failed to create enrollments" }, { status: 500 });
    }
}

// DELETE - Remove enrollment
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const scheduleId = searchParams.get("scheduleId");
    const studentId = searchParams.get("studentId");

    try {
        if (id) {
            await prisma.scheduleEnrollment.delete({ where: { id } });
        } else if (scheduleId && studentId) {
            await prisma.scheduleEnrollment.delete({
                where: {
                    studentId_scheduleId: { studentId, scheduleId }
                }
            });
        } else {
            return NextResponse.json({ error: "id or (scheduleId + studentId) required" }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting schedule enrollment:", error);
        return NextResponse.json({ error: "Failed to delete enrollment" }, { status: 500 });
    }
}
