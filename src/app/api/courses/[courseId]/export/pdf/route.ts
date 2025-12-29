import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

        // Get course with students
        const course = await prisma.course.findUnique({
            where: { id: params.courseId },
            include: {
                teacher: {
                    select: {
                        name: true,
                    },
                },
                business: {
                    select: {
                        name: true,
                    },
                },
                enrollments: {
                    include: {
                        student: {
                            select: {
                                firstName: true,
                                lastName: true,
                                matricula: true,
                            },
                        },
                    },
                    orderBy: {
                        student: {
                            lastName: "asc",
                        },
                    },
                },
            },
        });

        if (!course) {
            return new NextResponse("Course not found", { status: 404 });
        }

        // Create PDF
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text(course.business.name, 14, 20);

        doc.setFontSize(14);
        doc.text(`Lista de Asistencia - ${course.name}`, 14, 30);

        doc.setFontSize(10);
        doc.text(`Profesor: ${course.teacher?.name || "Sin asignar"}`, 14, 38);
        if (course.schedule) {
            doc.text(`Horario: ${course.schedule}`, 14, 44);
        }
        if (course.room) {
            doc.text(`Salón: ${course.room}`, 14, 50);
        }
        doc.text(`Total de alumnos: ${course.enrollments.length}`, 14, 56);

        // Prepare table data
        const tableData = course.enrollments.map((enrollment, index) => [
            (index + 1).toString(),
            `${enrollment.student.lastName}, ${enrollment.student.firstName}`,
            enrollment.student.matricula || "",
            "", // Fecha 1
            "", // Fecha 2
            "", // Fecha 3
            "", // Fecha 4
            "", // Fecha 5
        ]);

        // Add table
        autoTable(doc, {
            startY: 62,
            head: [["#", "Nombre", "Matrícula", "Fecha 1", "Fecha 2", "Fecha 3", "Fecha 4", "Fecha 5"]],
            body: tableData,
            theme: "grid",
            headStyles: {
                fillColor: [66, 139, 202],
                textColor: 255,
                fontStyle: "bold",
            },
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 60 },
                2: { cellWidth: 30 },
                3: { cellWidth: 20 },
                4: { cellWidth: 20 },
                5: { cellWidth: 20 },
                6: { cellWidth: 20 },
                7: { cellWidth: 20 },
            },
        });

        // Generate PDF buffer
        const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

        return new NextResponse(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="lista_${course.name.replace(/\s+/g, "_")}.pdf"`,
            },
        });
    } catch (error) {
        console.error("[COURSE_PDF_EXPORT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
