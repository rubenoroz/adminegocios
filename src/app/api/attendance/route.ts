import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "UNAUTHORIZED", message: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const { courseId, date, attendanceRecords } = body;

        if (!courseId || !date || !attendanceRecords) {
            return NextResponse.json({ error: "MISSING_FIELDS", message: "Faltan campos requeridos" }, { status: 400 });
        }

        // Validate Date
        const attendanceDate = new Date(date);
        if (isNaN(attendanceDate.getTime())) {
            return NextResponse.json({ error: "INVALID_DATE", message: "Fecha inválida" }, { status: 400 });
        }

        // Create attendance records for all students
        const records = await Promise.all(
            attendanceRecords.map((record: { studentId: string; status: string }) =>
                prisma.attendance.upsert({
                    where: {
                        studentId_courseId_date: {
                            studentId: record.studentId,
                            courseId,
                            date: new Date(date),
                        },
                    },
                    update: {
                        status: record.status,
                    },
                    create: {
                        studentId: record.studentId,
                        courseId,
                        date: new Date(date),
                        status: record.status,
                    },
                })
            )
        );

        // Send Absence Alerts
        const absentStudents = attendanceRecords.filter((r: any) => r.status === "ABSENT");

        if (absentStudents.length > 0) {
            try {
                const emailService = (await import("@/lib/email")).emailService;

                // Fetch course name
                const course = await prisma.course.findUnique({
                    where: { id: courseId },
                    select: { name: true }
                });

                // Process each absent student
                for (const record of absentStudents) {
                    // Get student info and parent emails
                    const student = await prisma.student.findUnique({
                        where: { id: record.studentId },
                        include: {
                            parents: {
                                include: { parent: true }
                            }
                        }
                    });

                    if (student) {
                        const recipients = student.parents
                            .map(sp => sp.parent.email)
                            .filter(Boolean) as string[];

                        // Also add student's email if available
                        if (student.email) {
                            recipients.push(student.email);
                        }

                        if (recipients.length > 0) {
                            const dateStr = new Date(date).toLocaleDateString("es-MX", {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            });

                            const html = `
                                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                                    <h2 style="color: #d32f2f;">Alerta de Inasistencia</h2>
                                    <p>Estimado estudiante / padre de familia,</p>
                                    <p>Le informamos que <strong>${student.firstName} ${student.lastName}</strong> ha sido marcado como <strong>AUSENTE</strong> en la clase de <strong>${course?.name || "Clase"}</strong> el día de hoy (${dateStr}).</p>
                                    <p>Si considera que esto es un error o desea justificar la falta, por favor contacte a la administración escolar.</p>
                                    <hr />
                                    <p style="font-size: 12px; color: #666;">Este es un mensaje automático de seguridad escolar.</p>
                                </div>
                            `;

                            // Remove duplicates
                            const uniqueRecipients = Array.from(new Set(recipients));

                            for (const email of uniqueRecipients) {
                                emailService.sendEmail({
                                    to: email,
                                    subject: `[ALERTA] Inasistencia - ${student.firstName} ${student.lastName}`,
                                    html
                                }).catch(err => console.error(`Failed to send absence alert to ${email}`, err));
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error sending absence alerts:", error);
            }
        }

        return NextResponse.json({
            success: true,
            count: records.length,
            records,
        });
    } catch (error) {
        console.error("[ATTENDANCE_POST]", error);
        return NextResponse.json({ error: "INTERNAL_ERROR", message: "Error al registrar asistencia" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "UNAUTHORIZED", message: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get("courseId");
        const studentId = searchParams.get("studentId");
        const date = searchParams.get("date");

        const where: any = {};
        if (courseId) where.courseId = courseId;
        if (studentId) where.studentId = studentId;
        if (date) where.date = new Date(date);

        const attendances = await prisma.attendance.findMany({
            where,
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        matricula: true,
                    },
                },
                course: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                date: "desc",
            },
        });

        return NextResponse.json(attendances);
    } catch (error) {
        console.error("[ATTENDANCE_GET]", error);
        return NextResponse.json({ error: "INTERNAL_ERROR", message: "Error al obtener asistencias" }, { status: 500 });
    }
}
