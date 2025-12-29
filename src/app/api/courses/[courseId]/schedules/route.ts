import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List schedules for a course
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
        const schedules = await prisma.classSchedule.findMany({
            where: { courseId },
            orderBy: [
                { dayOfWeek: "asc" },
                { startTime: "asc" }
            ]
        });

        return NextResponse.json(schedules);
    } catch (error) {
        console.error("[SCHEDULES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST - Create a new schedule
export async function POST(
    req: Request,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { courseId } = await params;
        const body = await req.json();
        const { dayOfWeek, startTime, endTime, room, businessId, forceCreate } = body;

        console.log("[SCHEDULES_POST] Creating schedule:", { courseId, dayOfWeek, startTime, endTime, room, businessId, forceCreate });

        if (dayOfWeek === undefined || !startTime || !endTime || !businessId) {
            return new NextResponse("Missing required fields", { status: 400 });
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

        // Check 1: Prevent duplicate schedules within the same course
        if (!forceCreate) {
            const existingSameCourse = await prisma.classSchedule.findMany({
                where: {
                    courseId,
                    dayOfWeek
                }
            });

            const duplicates = existingSameCourse.filter(s =>
                timesOverlap(startTime, endTime, s.startTime, s.endTime)
            );

            if (duplicates.length > 0) {
                console.log("[SCHEDULES_POST] Duplicate schedule detected for same course");
                return NextResponse.json({
                    isDuplicate: true,
                    message: `Este curso ya tiene un horario que se cruza en este día (${duplicates[0].startTime} - ${duplicates[0].endTime})`
                }, { status: 400 });
            }
        }

        // Check 2: Check for room conflicts with OTHER courses
        if (room && !forceCreate) {
            console.log("[SCHEDULES_POST] Checking for conflicts in room:", room);

            const existingSchedules = await prisma.classSchedule.findMany({
                where: {
                    businessId,
                    room,
                    dayOfWeek,
                    courseId: { not: courseId }
                },
                include: {
                    course: {
                        select: { name: true }
                    }
                }
            });

            console.log("[SCHEDULES_POST] Existing schedules in this room/day:", existingSchedules.length);

            const conflictingSchedules = existingSchedules.filter(s =>
                timesOverlap(startTime, endTime, s.startTime, s.endTime)
            );

            console.log("[SCHEDULES_POST] Conflicting schedules found:", conflictingSchedules.length);

            if (conflictingSchedules.length > 0) {
                const conflicts = conflictingSchedules.map(s => ({
                    courseName: s.course?.name || "Curso desconocido",
                    time: `${s.startTime} - ${s.endTime}`,
                    room: s.room
                }));

                console.log("[SCHEDULES_POST] Returning conflict response:", conflicts);

                return NextResponse.json({
                    hasConflict: true,
                    conflicts,
                    message: `El salón "${room}" ya está ocupado en este horario`
                }, { status: 409 });
            }
        }

        const schedule = await prisma.classSchedule.create({
            data: {
                dayOfWeek,
                startTime,
                endTime,
                room,
                courseId,
                businessId
            }
        });

        console.log("[SCHEDULES_POST] Created schedule:", schedule);
        return NextResponse.json(schedule);
    } catch (error) {
        console.error("[SCHEDULES_POST] Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
