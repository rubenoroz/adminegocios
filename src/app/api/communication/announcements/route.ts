import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List announcements
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const businessId = searchParams.get("businessId");

        if (!businessId) {
            return new NextResponse("Business ID required", { status: 400 });
        }

        const announcements = await prisma.announcement.findMany({
            where: { businessId },
            orderBy: { createdAt: "desc" },
            include: {
                author: {
                    select: { name: true, email: true }
                }
            }
        });

        return NextResponse.json(announcements);
    } catch (error) {
        console.error("[ANNOUNCEMENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST - Create announcement
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { title, content, type, priority, targetType, targetId, businessId } = body;

        if (!title || !content || !businessId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Get author ID
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return new NextResponse("User not found", { status: 404 });

        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                type,
                priority,
                targetType,
                targetId,
                businessId,
                authorId: user.id
            }
        });

        // Trigger notifications if priority is HIGH
        if (priority === "HIGH") {
            try {
                const emailService = (await import("@/lib/email")).emailService;

                let targetEmails: string[] = [];

                if (targetType === "ALL") {
                    // Get all parents in business
                    const parents = await prisma.parentAccount.findMany({
                        where: { businessId },
                        select: { email: true }
                    });
                    targetEmails = parents.map(p => p.email);
                } else if (targetType === "COURSE" && targetId) {
                    // Get parents of students in this course
                    const enrollments = await prisma.enrollment.findMany({
                        where: {
                            courseId: targetId,
                            status: "ACTIVE"
                        },
                        include: {
                            student: {
                                include: {
                                    parents: {
                                        include: { parent: true }
                                    }
                                }
                            }
                        }
                    });

                    const emailSet = new Set<string>();
                    enrollments.forEach(e => {
                        e.student.parents.forEach(sp => {
                            if (sp.parent.email) emailSet.add(sp.parent.email);
                        });
                    });
                    targetEmails = Array.from(emailSet);
                } else if (targetType === "STUDENT" && targetId) {
                    // Get parents of this student
                    const studentParents = await prisma.studentParent.findMany({
                        where: { studentId: targetId },
                        include: { parent: true }
                    });
                    targetEmails = studentParents.map(sp => sp.parent.email).filter(Boolean);
                }

                // Send emails in background (fire and forget)
                if (targetEmails.length > 0) {
                    // Send individually or bcc? For privacy, send individually or use BCC.
                    // For simplicity here, we'll loop. In production, use a queue.
                    console.log(`Sending ${targetEmails.length} emails for announcement: ${title}`);

                    const emailHtml = `
                        <div style="font-family: sans-serif; padding: 20px;">
                            <h2 style="color: #d32f2f;">Aviso Importante: ${title}</h2>
                            <p>${content}</p>
                            <hr />
                            <p style="font-size: 12px; color: #666;">Este es un mensaje automático de tu escuela.</p>
                        </div>
                    `;

                    // Send in batches or loop
                    for (const email of targetEmails) {
                        emailService.sendEmail({
                            to: email,
                            subject: `[URGENTE] ${title}`,
                            html: emailHtml
                        }).catch(err => console.error(`Failed to send to ${email}`, err));
                    }
                }

            } catch (error) {
                console.error("Error sending notifications:", error);
            }
        }

        return NextResponse.json(announcement);
    } catch (error) {
        console.error("[ANNOUNCEMENTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
