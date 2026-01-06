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
        const { scheduleId, studentIds } = body;

        if (!scheduleId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return NextResponse.json({ error: "scheduleId and studentIds array are required" }, { status: 400 });
        }

        // Create enrollments for each student (skip duplicates)
        const enrollments = await prisma.$transaction(
            studentIds.map((studentId: string) =>
                prisma.scheduleEnrollment.upsert({
                    where: {
                        studentId_scheduleId: { studentId, scheduleId }
                    },
                    create: {
                        studentId,
                        scheduleId,
                        status: "ACTIVE",
                    },
                    update: {
                        status: "ACTIVE",
                    },
                })
            )
        );

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
