
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
            // Ordering by creation time since there is no 'order' field on Question currently.
            // If order matters, we should consider adding an order field or relying on creation order.
            // For now, let's use implicit creation order (id sort if cuid is sequential-ish or just unsorted).
            // Actually, usually users want custom order. 
            // The schema viewed earlier (lines 642-651) DID NOT show an 'order' column for Question.
            // We should stick to what's there.
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

        // `options` comes as an array from UI, but schema stores it as String (JSON)
        // We need to JSON.stringify it.

        const question = await prisma.question.create({
            data: {
                text,
                options: JSON.stringify(options || []), // Store as JSON string
                correctAnswer: correctAnswer || "",
                points: points || 1,
                quizId
            }
        });

        return NextResponse.json(question);
    } catch (error) {
        console.error("[QUESTIONS_POST]", error);
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
            where: { id: questionId }
        });

        return NextResponse.json(question);
    } catch (error) {
        console.error("[QUESTION_DELETE]", error);
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

        const data: any = {};
        if (text !== undefined) data.text = text;
        if (options !== undefined) data.options = JSON.stringify(options);
        if (correctAnswer !== undefined) data.correctAnswer = correctAnswer;
        if (points !== undefined) data.points = points;

        const question = await prisma.question.update({
            where: { id: questionId },
            data
        });

        return NextResponse.json(question);
    } catch (error) {
        console.error("[QUESTION_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
