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

        const assignments = await prisma.assignment.findMany({
            where: { moduleId: moduleId },
            orderBy: { dueDate: "asc" },
        });

        return NextResponse.json(assignments);
    } catch (error) {
        console.error("[ASSIGNMENTS_GET]", error);
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
        const { title, description, dueDate } = await req.json();

        const assignment = await prisma.assignment.create({
            data: {
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : null,
                moduleId
            }
        });

        return NextResponse.json(assignment);
    } catch (error) {
        console.error("[ASSIGNMENTS_POST]", error);
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
        const assignmentId = searchParams.get("assignmentId");

        if (!assignmentId) {
            return new NextResponse("Assignment ID required", { status: 400 });
        }

        const assignment = await prisma.assignment.delete({
            where: { id: assignmentId }
        });

        return NextResponse.json(assignment);
    } catch (error) {
        console.error("[ASSIGNMENT_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
