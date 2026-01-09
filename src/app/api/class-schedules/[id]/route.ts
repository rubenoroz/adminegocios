import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const body = await request.json();
        const { courseId, classroomId, teacherId, title, dayOfWeek, startTime, endTime, validFrom, validUntil } = body;
        const id = params.id;

        if (!id) {
            return NextResponse.json({ error: "Schedule ID is required" }, { status: 400 });
        }

        const data: any = {};
        // Only include defined fields
        if (courseId !== undefined) data.courseId = courseId;
        if (classroomId !== undefined) data.classroomId = classroomId;
        if (teacherId !== undefined) data.teacherId = teacherId;
        if (title !== undefined) data.title = title;
        if (dayOfWeek !== undefined) data.dayOfWeek = dayOfWeek;
        if (startTime !== undefined) data.startTime = startTime;
        if (endTime !== undefined) data.endTime = endTime;
        if (validFrom !== undefined) data.validFrom = validFrom ? new Date(validFrom) : null;
        if (validUntil !== undefined) data.validUntil = validUntil ? new Date(validUntil) : null;

        const schedule = await prisma.classSchedule.update({
            where: { id },
            data,
            include: {
                course: { select: { id: true, name: true } },
                classroom: { select: { id: true, name: true } },
                teacher: { select: { id: true, name: true } }
            }
        });

        return NextResponse.json(schedule);
    } catch (error: any) {
        console.error("Error updating class schedule:", error);
        return NextResponse.json({ error: "Failed to update schedule", details: error?.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const id = params.id;

    if (!id) {
        return NextResponse.json({ error: "Schedule ID is required" }, { status: 400 });
    }

    try {
        // If a specific date is provided, create a cancellation exception instead of deleting
        if (date) {
            // We store the date exactly as provided in the query param (YYYY-MM-DD)
            // By appending "T00:00:00Z", we force it to be treated as UTC, avoiding local timezone shifts
            // that could change the day (e.g., 2024-01-07 -> 2024-01-06 in EST)
            const isoDate = new Date(`${date}T00:00:00Z`);

            const cancellation = await prisma.classScheduleCancellation.create({
                data: {
                    scheduleId: id,
                    date: isoDate,
                    reason: "User cancelled session"
                }
            });
            return NextResponse.json({ message: "Session cancelled", cancellation });
        } else {
            // Delete the entire schedule series
            await prisma.classSchedule.delete({
                where: { id }
            });
            return NextResponse.json({ message: "Schedule deleted successfully" });
        }
    } catch (error: any) {
        console.error("Error deleting class schedule:", error);
        return NextResponse.json({ error: "Failed to delete schedule", details: error?.message }, { status: 500 });
    }
}
