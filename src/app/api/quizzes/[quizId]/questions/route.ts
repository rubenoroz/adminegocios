import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ quizId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { quizId } = await params;

        const questions = await prisma.question.findMany({
            where: { quizId },
            orderBy: { id: "asc" },
        });

        return NextResponse.json(questions);
    } catch (error) {
        console.error("[QUESTIONS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ quizId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { quizId } = await params;
        const { text, options, correctAnswer, points } = await req.json();

        const question = await prisma.question.create({
            data: {
                text,
                options: JSON.stringify(options),
                correctAnswer,
                points: points || 1,
                quizId,
            },
        });

        return NextResponse.json(question);
    } catch (error) {
        console.error("[QUESTIONS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ quizId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const questionId = searchParams.get("questionId");

        if (!questionId) {
            return new NextResponse("Question ID required", { status: 400 });
        }

        const { text, options, correctAnswer, points } = await req.json();

        const question = await prisma.question.update({
            where: { id: questionId },
            data: {
                ...(text !== undefined && { text }),
                ...(options !== undefined && { options: JSON.stringify(options) }),
                ...(correctAnswer !== undefined && { correctAnswer }),
                ...(points !== undefined && { points }),
            },
        });

        return NextResponse.json(question);
    } catch (error) {
        console.error("[QUESTION_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ quizId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const questionId = searchParams.get("questionId");

        if (!questionId) {
            return new NextResponse("Question ID required", { status: 400 });
        }

        const question = await prisma.question.delete({
            where: { id: questionId },
        });

        return NextResponse.json(question);
    } catch (error) {
        console.error("[QUESTION_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
