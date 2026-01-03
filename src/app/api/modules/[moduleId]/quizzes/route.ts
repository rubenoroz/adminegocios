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

        const quizzes = await prisma.quiz.findMany({
            where: { moduleId: moduleId },
            orderBy: { order: "asc" },
        });

        return NextResponse.json(quizzes);
    } catch (error) {
        console.error("[QUIZZES_GET]", error);
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
        const { title } = await req.json();

        const lastQuiz = await prisma.quiz.findFirst({
            where: { moduleId },
            orderBy: { order: "desc" },
        });

        const newOrder = lastQuiz ? lastQuiz.order + 1 : 1;

        const quiz = await prisma.quiz.create({
            data: {
                title,
                moduleId,
                order: newOrder
            }
        });

        return NextResponse.json(quiz);
    } catch (error) {
        console.error("[QUIZZES_POST]", error);
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
        const quizId = searchParams.get("quizId");

        if (!quizId) {
            return new NextResponse("Quiz ID required", { status: 400 });
        }

        const quiz = await prisma.quiz.delete({
            where: { id: quizId }
        });

        return NextResponse.json(quiz);
    } catch (error) {
        console.error("[QUIZ_DELETE]", error);
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
        const quizId = searchParams.get("quizId");

        if (!quizId) {
            return new NextResponse("Quiz ID required", { status: 400 });
        }

        const { title } = await req.json();

        const quiz = await prisma.quiz.update({
            where: { id: quizId },
            data: {
                ...(title !== undefined && { title }),
            }
        });

        return NextResponse.json(quiz);
    } catch (error) {
        console.error("[QUIZ_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

