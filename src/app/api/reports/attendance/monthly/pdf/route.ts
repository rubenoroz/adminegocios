import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns";
import { es } from "date-fns/locale";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get("courseId");
        const monthStr = searchParams.get("month"); // YYYY-MM

        if (!courseId || !monthStr) {
            return new NextResponse("Missing courseId or month", { status: 400 });
        }

        const date = new Date(monthStr + "-01");
        const start = startOfMonth(date);
        const end = endOfMonth(date);

        // Fetch course and attendance data (reuse logic from main report API)
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                enrollments: {
                    include: {
                        student: true,
                    },
                    orderBy: {
                        student: { lastName: "asc" },
                    },
                },
                teacher: {
                    select: { name: true }
                }
            },
        });

        if (!course) {
            return new NextResponse("Course not found", { status: 404 });
        }

        const attendance = await prisma.attendance.findMany({
            where: {
                courseId,
                date: {
                    gte: start,
                    lte: end,
                },
            },
        });

        // Fetch business info for header
        const business = await prisma.business.findFirst({
            where: { id: session.user.businessId },
        });

        const doc = new jsPDF({ orientation: "landscape" });
        const days = eachDayOfInterval({ start, end });

        // Header
        doc.setFontSize(18);
        doc.text(business?.name || "Escuela", 14, 15);
        doc.setFontSize(14);
        doc.text("Reporte Mensual de Asistencia", 14, 22);
        doc.setFontSize(11);
        doc.text(`Curso: ${course.name}`, 14, 29);
        doc.text(`Profesor: ${course.teacher?.name || "N/A"}`, 14, 34);
        doc.text(`Mes: ${format(date, "MMMM yyyy", { locale: es })}`, 200, 29, { align: "right" });

        // Prepare table data
        const head = [
            ["Alumno", ...days.map(d => format(d, "d")), "Faltas"]
        ];

        const body = course.enrollments.map((enrollment) => {
            const row = [`${enrollment.student.lastName}, ${enrollment.student.firstName}`];
            let absences = 0;

            days.forEach(day => {
                const record = attendance.find(
                    a => a.studentId === enrollment.student.id &&
                        format(a.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
                );

                if (record) {
                    if (record.status === "PRESENT") row.push("•");
                    else if (record.status === "ABSENT") {
                        row.push("X");
                        absences++;
                    }
                    else if (record.status === "LATE") row.push("L");
                    else if (record.status === "EXCUSED") row.push("J");
                    else row.push("");
                } else {
                    row.push("");
                }
            });

            row.push(absences.toString());
            return row;
        });

        autoTable(doc, {
            startY: 40,
            head: head,
            body: body,
            theme: "grid",
            styles: { fontSize: 8, cellPadding: 1 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255, halign: 'center' },
            columnStyles: {
                0: { cellWidth: 40 }, // Name column
                // Dynamic columns for days? autoTable handles it usually, but might be tight.
            },
            didParseCell: function (data) {
                // Color code cells
                if (data.section === 'body' && data.column.index > 0 && data.column.index <= days.length) {
                    const text = data.cell.text[0];
                    if (text === 'X') {
                        data.cell.styles.textColor = [200, 0, 0]; // Red
                        data.cell.styles.fontStyle = 'bold';
                    } else if (text === '•') {
                        data.cell.styles.textColor = [0, 128, 0]; // Green
                    }
                }
            }
        });

        const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

        return new NextResponse(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="asistencia_${course.name}_${monthStr}.pdf"`,
            },
        });

    } catch (error) {
        console.error("[ATTENDANCE_REPORT_PDF]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
