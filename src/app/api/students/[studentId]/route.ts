import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ studentId: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const { studentId } = await params;
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { enrollments: true, parents: true }
        });

        if (!student) return new NextResponse("Student not found", { status: 404 });

        return NextResponse.json(student);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ studentId: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const { studentId } = await params;
        const body = await req.json();
        const { status } = body; // ACTIVE, INACTIVE, ARCHIVED

        const student = await prisma.student.update({
            where: { id: studentId },
            data: { status }
        });

        return NextResponse.json(student);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ studentId: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const { studentId } = await params;

        // Soft delete (Archive)
        const student = await prisma.student.update({
            where: { id: studentId },
            data: { status: "ARCHIVED" }
        });

        return NextResponse.json(student);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}
