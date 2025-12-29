import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: Request,
    { params }: { params: { noteId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { noteId } = params;

        const note = await prisma.studentNote.findUnique({
            where: { id: noteId },
        });

        if (!note) {
            return new NextResponse("Note not found", { status: 404 });
        }

        // Only author or ADMIN/OWNER can delete
        if (note.authorId !== session.user.id && session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await prisma.studentNote.delete({
            where: { id: noteId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[STUDENT_NOTES_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
