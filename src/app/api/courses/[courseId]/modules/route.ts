import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { courseId } = await params;

        const modules = await prisma.courseModule.findMany({
            where: { courseId: courseId },
            include: {
                lessons: {
                    orderBy: { order: "asc" },
                },
                quizzes: true,
                assignments: true,
                resources: true
            },
            orderBy: { order: "asc" },
        });

        return NextResponse.json(modules);
    } catch (error) {
        console.error("[MODULES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { courseId } = await params;
        const { title } = await req.json();

        const lastModule = await prisma.courseModule.findFirst({
            where: { courseId },
            orderBy: { order: 'desc' }
        });

        const newOrder = lastModule ? lastModule.order + 1 : 0;

        const module = await prisma.courseModule.create({
            data: {
                title,
                courseId,
                order: newOrder
            }
        });

        return NextResponse.json(module);
    } catch (error) {
        console.error("[MODULES_POST]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
