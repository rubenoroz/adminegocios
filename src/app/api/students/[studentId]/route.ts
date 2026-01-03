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
        const { status, firstName, lastName, email, matricula, guardianName, guardianPhone, branchIds } = body;

        // Build update data dynamically
        const updateData: any = {};
        if (status !== undefined) updateData.status = status;
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (email !== undefined) updateData.email = email;
        if (matricula !== undefined) updateData.matricula = matricula;
        if (guardianName !== undefined) updateData.guardianName = guardianName;
        if (guardianPhone !== undefined) updateData.guardianPhone = guardianPhone;

        // Handle branch connections (many-to-many)
        if (branchIds !== undefined) {
            updateData.branches = {
                set: branchIds.map((id: string) => ({ id }))
            };
        }

        const student = await prisma.student.update({
            where: { id: studentId },
            data: updateData,
            include: { branches: true }
        });

        return NextResponse.json(student);
    } catch (error) {
        console.error("Error updating student:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ studentId: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

        const { studentId } = await params;

        // Hard delete - permanently remove student
        await prisma.student.delete({
            where: { id: studentId }
        });

        return NextResponse.json({ success: true, message: "Student deleted permanently" });
    } catch (error) {
        console.error("Error deleting student:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
