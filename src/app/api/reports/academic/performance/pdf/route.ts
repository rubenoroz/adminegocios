import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get("courseId");

        if (!courseId) {
            return new NextResponse("Missing courseId", { status: 400 });
        }

        // Reuse logic to fetch data
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                enrollments: {
                    include: {
                        student: true,
                    },
                },
                grades: true,
                teacher: {
                    select: { name: true }
                }
            },
        });

        if (!course) {
            return new NextResponse("Course not found", { status: 404 });
        }

        // Calculate stats (simplified for PDF)
        const students = course.enrollments.map((e) => e.student);
        const grades = course.grades;

        const studentPerformances = students.map((student) => {
            const studentGrades = grades.filter((g) => g.studentId === student.id);

            if (studentGrades.length === 0) {
                return {
                    name: `${student.lastName}, ${student.firstName}`,
                    matricula: student.matricula,
                    average: 0,
                    hasGrades: false,
                };
            }

            let totalScore = 0;
            let hasWeights = studentGrades.some(g => g.weight !== null);

            if (hasWeights) {
                studentGrades.forEach(g => {
                    const weight = g.weight || 0;
                    const normalizedValue = (g.value / g.maxValue) * 100;
                    totalScore += normalizedValue * (weight / 100);
                });
            } else {
                const sum = studentGrades.reduce((acc, g) => acc + (g.value / g.maxValue) * 100, 0);
                totalScore = sum / studentGrades.length;
            }

            return {
                name: `${student.lastName}, ${student.firstName}`,
                matricula: student.matricula,
                average: Math.round(totalScore * 10) / 10,
                hasGrades: true,
            };
        }).sort((a, b) => b.average - a.average);

        // Generate PDF
        const business = await prisma.business.findFirst({
            where: { id: session.user.businessId },
        });

        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text(business?.name || "Escuela", 105, 20, { align: "center" });
        doc.setFontSize(14);
        doc.text("Reporte de Rendimiento Académico", 105, 30, { align: "center" });

        doc.setFontSize(11);
        doc.text(`Curso: ${course.name}`, 14, 45);
        doc.text(`Profesor: ${course.teacher?.name || "N/A"}`, 14, 50);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 190, 45, { align: "right" });

        // Stats Summary
        const activeStudents = studentPerformances.filter(s => s.hasGrades);
        const classAverage = activeStudents.length > 0
            ? activeStudents.reduce((acc, s) => acc + s.average, 0) / activeStudents.length
            : 0;
        const passingCount = activeStudents.filter(s => s.average >= 60).length;
        const failingCount = activeStudents.filter(s => s.average < 60).length;

        doc.text(`Promedio General: ${classAverage.toFixed(1)}`, 14, 60);
        doc.text(`Aprobados: ${passingCount}`, 80, 60);
        doc.text(`Reprobados: ${failingCount}`, 140, 60);

        // Table
        const tableBody = studentPerformances.map((s, index) => [
            (index + 1).toString(),
            s.name,
            s.matricula || "-",
            s.hasGrades ? s.average.toString() : "S/C",
            s.hasGrades ? (s.average >= 60 ? "Aprobado" : "Reprobado") : "-"
        ]);

        autoTable(doc, {
            startY: 65,
            head: [["#", "Alumno", "Matrícula", "Promedio", "Estatus"]],
            body: tableBody,
            theme: "grid",
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            didParseCell: function (data) {
                if (data.section === 'body' && data.column.index === 3) {
                    const val = parseFloat(data.cell.text[0]);
                    if (!isNaN(val)) {
                        if (val < 60) data.cell.styles.textColor = [200, 0, 0];
                        else if (val >= 90) data.cell.styles.textColor = [0, 128, 0];
                    }
                }
            }
        });

        const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

        return new NextResponse(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="rendimiento_${course.name}.pdf"`,
            },
        });

    } catch (error) {
        console.error("[ACADEMIC_REPORT_PDF]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
