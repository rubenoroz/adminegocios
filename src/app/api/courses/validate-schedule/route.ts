import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { classroomId, days, startTime, endTime, courseId } = body;

        if (!classroomId || !days || !startTime || !endTime) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Get classroom name for better error messages
        const classroom = await prisma.classroom.findUnique({
            where: { id: classroomId },
            select: { name: true }
        });

        if (!classroom) {
            return NextResponse.json(
                { error: "Classroom not found" },
                { status: 404 }
            );
        }

        // Check for conflicts for each day
        const conflicts = [];

        for (const dayOfWeek of days) {
            const existingSchedules = await prisma.classSchedule.findMany({
                where: {
                    classroomId,
                    dayOfWeek,
                    ...(courseId ? { courseId: { not: courseId } } : {}),
                    OR: [
                        // New schedule starts during an existing schedule
                        {
                            AND: [
                                { startTime: { lte: startTime } },
                                { endTime: { gt: startTime } }
                            ]
                        },
                        // New schedule ends during an existing schedule
                        {
                            AND: [
                                { startTime: { lt: endTime } },
                                { endTime: { gte: endTime } }
                            ]
                        },
                        // New schedule completely wraps an existing schedule
                        {
                            AND: [
                                { startTime: { gte: startTime } },
                                { endTime: { lte: endTime } }
                            ]
                        }
                    ]
                },
                include: {
                    course: {
                        select: {
                            name: true
                        }
                    }
                }
            });

            if (existingSchedules.length > 0) {
                conflicts.push(...existingSchedules);
            }
        }

        if (conflicts.length > 0) {
            const conflictingCourse = conflicts[0].course.name;
            const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
            const conflictDay = dayNames[conflicts[0].dayOfWeek];

            // Format time to 12-hour
            const formatTime = (time24: string) => {
                const [hour, minute] = time24.split(':').map(Number);
                const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                const period = hour < 12 ? "AM" : "PM";
                return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
            };

            return NextResponse.json({
                hasConflict: true,
                conflictingCourse: `El salón "${classroom.name}" ya está ocupado el ${conflictDay} de ${formatTime(conflicts[0].startTime)} a ${formatTime(conflicts[0].endTime)} por el curso "${conflictingCourse}"`
            });
        }

        return NextResponse.json({ hasConflict: false });
    } catch (error) {
        console.error("[VALIDATE_SCHEDULE]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
