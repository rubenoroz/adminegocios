import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ studentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { studentId } = await params;

        const notes = await prisma.studentNote.findMany({
            where: { studentId },
            include: {
                author: {
                    select: {
                        name: true,
                        image: true,
                    },
                },
                course: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(notes);
    } catch (error) {
        console.error("[NOTES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ studentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { studentId } = await params;
        const body = await req.json();
        const { content, type, courseId } = body;

        if (!content || !type) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const note = await prisma.studentNote.create({
            data: {
                content,
                type,
                studentId,
                authorId: session.user.id,
                courseId: courseId || null,
            },
            include: {
                author: {
                    select: {
                        name: true,
                        image: true,
                    },
                },
                course: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json(note);
    } catch (error) {
        console.error("[STUDENT_NOTES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
