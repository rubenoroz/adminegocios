import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: List authorized teachers for a course
export async function GET(
    request: Request,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.businessId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { courseId } = await params;

        const courseTeachers = await prisma.courseTeacher.findMany({
            where: { courseId },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        color: true,
                        role: true
                    }
                }
            },
            orderBy: [
                { isPrimary: "desc" },
                { createdAt: "asc" }
            ]
        });

        return NextResponse.json(courseTeachers);
    } catch (error) {
        console.error("Error fetching course teachers:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST: Add teacher(s) to a course
export async function POST(
    request: Request,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.businessId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { courseId } = await params;
        const body = await request.json();
        const { employeeIds, isPrimary = false } = body;

        if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
            return NextResponse.json({ error: "employeeIds array required" }, { status: 400 });
        }

        // Verify course exists and belongs to business
        const course = await prisma.course.findFirst({
            where: { id: courseId, businessId: session.user.businessId }
        });

        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // Add teachers (upsert to avoid duplicates)
        const results = await Promise.all(
            employeeIds.map(async (employeeId: string) => {
                return prisma.courseTeacher.upsert({
                    where: {
                        courseId_employeeId: { courseId, employeeId }
                    },
                    update: { isPrimary },
                    create: { courseId, employeeId, isPrimary }
                });
            })
        );

        return NextResponse.json(results, { status: 201 });
    } catch (error) {
        console.error("Error adding course teachers:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE: Remove teacher from course
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.businessId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { courseId } = await params;
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get("employeeId");

        if (!employeeId) {
            return NextResponse.json({ error: "employeeId query param required" }, { status: 400 });
        }

        // Delete the course-teacher relation
        await prisma.courseTeacher.delete({
            where: {
                courseId_employeeId: { courseId, employeeId }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing course teacher:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
