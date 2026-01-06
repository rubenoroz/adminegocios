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
                        teacher: {
                            select: { name: true }
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
        const { businessId, branchId, courseId, classroomId, teacherId, dayOfWeek, startTime, endTime, validFrom, validUntil } = body;

        if (!businessId || !courseId || dayOfWeek === undefined || !startTime || !endTime) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const schedule = await prisma.classSchedule.create({
            data: {
                businessId,
                branchId: branchId || null,
                courseId,
                classroomId: classroomId || null,
                teacherId: teacherId || null,
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
    } catch (error) {
        console.error("Error creating class schedule:", error);
        return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, courseId, classroomId, teacherId, dayOfWeek, startTime, endTime, validFrom, validUntil } = body;

        if (!id) {
            return NextResponse.json({ error: "Schedule ID is required" }, { status: 400 });
        }

        const schedule = await prisma.classSchedule.update({
            where: { id },
            data: {
                ...(courseId && { courseId }),
                ...(classroomId !== undefined && { classroomId: classroomId || null }),
                ...(teacherId !== undefined && { teacherId: teacherId || null }),
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
