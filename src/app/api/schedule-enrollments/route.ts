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
        const { scheduleId, studentIds, propagateToSiblings } = body;

        if (!scheduleId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return NextResponse.json({ error: "scheduleId and studentIds array are required" }, { status: 400 });
        }

        let targetScheduleIds = [scheduleId];

        // If propagation is requested, find all active siblings (same course, same business)
        if (propagateToSiblings) {
            const currentSchedule = await prisma.classSchedule.findUnique({
                where: { id: scheduleId },
                select: { courseId: true, businessId: true }
            });

            if (currentSchedule?.courseId) {
                const siblings = await prisma.classSchedule.findMany({
                    where: {
                        courseId: currentSchedule.courseId,
                        businessId: currentSchedule.businessId,
                        // ensure we don't pick up old archives if status existed
                        // status: "ACTIVE" // Assuming status field exists or validUntil check
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
