import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkLimit } from "@/lib/plan-limits";

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

        // Obtener usuario para verificar businessId
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // VALIDAR LÍMITE DE PLAN
        const limitCheck = await checkLimit(user.businessId, "lessons");

        if (!limitCheck.allowed) {
            return NextResponse.json({
                error: "LIMIT_REACHED",
                message: limitCheck.message,
                limit: limitCheck.limit,
                current: limitCheck.current,
                planName: limitCheck.planName
            }, { status: 403 });
        }

        const lastLesson = await prisma.lesson.findFirst({
            where: { moduleId },
            orderBy: { order: "desc" },
        });

        const newOrder = lastLesson ? lastLesson.order + 1 : 1;

        const lesson = await prisma.lesson.create({
            data: {
                title,
                content: content || "",
                moduleId,
                order: newOrder
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

