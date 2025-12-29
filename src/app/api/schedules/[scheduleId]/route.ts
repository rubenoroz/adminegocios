import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ scheduleId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { scheduleId } = await params;
        console.log("[SCHEDULE_DELETE] Deleting schedule:", scheduleId);

        await prisma.classSchedule.delete({
            where: { id: scheduleId }
        });

        console.log("[SCHEDULE_DELETE] Schedule deleted successfully");
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[SCHEDULE_DELETE] Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
