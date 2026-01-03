
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
                quizzes: {
                    orderBy: { order: "asc" },
                },
                assignments: {
                    orderBy: { order: "asc" },
                },
                resources: {
                    orderBy: { order: "asc" },
                }
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

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { courseId } = await params;
        const { list } = await req.json(); // list of { id: string, order: number }

        if (!Array.isArray(list)) {
            return new NextResponse("Invalid data", { status: 400 });
        }

        // Transaction to update all modules order
        await prisma.$transaction(
            list.map((item) =>
                prisma.courseModule.update({
                    where: { id: item.id },
                    data: { order: item.order },
                })
            )
        );

        return new NextResponse("Modules Reordered", { status: 200 });
    } catch (error) {
        console.error("[MODULES_REORDER]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
