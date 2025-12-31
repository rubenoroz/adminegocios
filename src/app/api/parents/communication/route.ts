import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // 1. Get Parent Account directly by email
        const parentAccount = await prisma.parentAccount.findUnique({
            where: { email: session.user.email },
            include: {
                students: {
                    include: {
                        student: {
                            include: {
                                enrollments: {
                                    where: { status: "ACTIVE" }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!parentAccount) {
            return new NextResponse("Parent account not found", { status: 404 });
        }

        const businessId = parentAccount.businessId;

        // 2. Collect Student IDs and Course IDs
        const studentIds: string[] = [];
        const courseIds: string[] = [];

        (parentAccount as any).students.forEach((sp: any) => {
            studentIds.push(sp.studentId);
            sp.student.enrollments.forEach((enrollment: any) => {
                courseIds.push(enrollment.courseId);
            });
        });

        // 3. Fetch Announcements
        // Logic: TargetType = ALL OR (COURSE & targetId in courseIds) OR (STUDENT & targetId in studentIds)
        const announcements = await prisma.announcement.findMany({
            where: {
                businessId,
                OR: [
                    { targetType: "ALL" },
                    { targetType: "COURSE", targetId: { in: courseIds } },
                    { targetType: "STUDENT", targetId: { in: studentIds } }
                ]
            },
            orderBy: { createdAt: "desc" },
            take: 10 // Limit to recent 10
        });

        // 4. Fetch Upcoming Events
        const events = await prisma.schoolEvent.findMany({
            where: {
                businessId,
                startDate: {
                    gte: new Date() // Future events only
                }
            },
            orderBy: { startDate: "asc" },
            take: 5
        });

        return NextResponse.json({
            announcements,
            events
        });

    } catch (error) {
        console.error("[PARENT_COMM_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
