import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ moduleId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { moduleId } = await params;

        const lessons = await prisma.lesson.findMany({
            where: { moduleId: moduleId },
            orderBy: { order: "asc" },
        });

        return NextResponse.json(lessons);
    } catch (error) {
        console.error("[LESSONS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ moduleId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { moduleId } = await params;
        const { title, content } = await req.json();

        const lesson = await prisma.lesson.create({
            data: {
                title,
                content: content || "",
                moduleId
            }
        });

        return NextResponse.json(lesson);
    } catch (error) {
        console.error("[LESSONS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ moduleId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const lessonId = searchParams.get("lessonId");

        if (!lessonId) {
            return new NextResponse("Lesson ID required", { status: 400 });
        }

        const lesson = await prisma.lesson.delete({
            where: { id: lessonId }
        });

        return NextResponse.json(lesson);
    } catch (error) {
        console.error("[LESSON_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ moduleId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const lessonId = searchParams.get("lessonId");

        if (!lessonId) {
            return new NextResponse("Lesson ID required", { status: 400 });
        }

        const { title, content } = await req.json();

        const lesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                ...(title !== undefined && { title }),
                ...(content !== undefined && { content }),
            }
        });

        return NextResponse.json(lesson);
    } catch (error) {
        console.error("[LESSON_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

