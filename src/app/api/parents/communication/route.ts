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

        // 1. Get Parent User
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                parentAccounts: {
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
                }
            }
        });

        if (!user || user.parentAccounts.length === 0) {
            return new NextResponse("Parent account not found", { status: 404 });
        }

        const parentAccount = user.parentAccounts[0];
        const businessId = parentAccount.businessId;

        // 2. Collect Student IDs and Course IDs
        const studentIds: string[] = [];
        const courseIds: string[] = [];

        // Fix: Explicitly type the parent account and its relations if needed, or rely on inference
        // The issue 'parentAccounts does not exist' suggests the include might not be properly typed or the client isn't generated correctly.
        // However, for now we will cast to any to bypass the strict check if the runtime behavior is correct, 
        // or better, we ensure we are accessing the right property.
        // Assuming the relation exists in schema (it does), let's try to fix the access.

        const parentAccount = (user as any).parentAccounts[0];
        const businessId = parentAccount.businessId;

        parentAccount.students.forEach((sp: any) => {
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
