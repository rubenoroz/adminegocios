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

        // 1. Get all students in the course
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                enrollments: {
                    include: {
                        student: {
                            include: {
                                enrollments: {
                                    include: {
                                        course: {
                                            include: {
                                                teacher: {
                                                    select: { name: true },
                                                },
                                            },
                                        },
                                    },
                                },
                                grades: {
                                    include: {
                                        course: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: {
                        student: { lastName: "asc" },
                    },
                },
            },
        });

        if (!course) {
            return new NextResponse("Course not found", { status: 404 });
        }

        // Fetch business info for header
        const business = await prisma.business.findFirst({
            where: { id: session.user.businessId },
        });

        const doc = new jsPDF();
        const students = course.enrollments.map(e => e.student);

        for (let i = 0; i < students.length; i++) {
            const student = students[i];

            if (i > 0) {
                doc.addPage();
            }

            // Header
            doc.setFontSize(20);
            doc.text(business?.name || "Escuela", 105, 20, { align: "center" });

            doc.setFontSize(16);
            doc.text("Boleta de Calificaciones", 105, 30, { align: "center" });

            // Student Info
            doc.setFontSize(12);
            doc.text(`Alumno: ${student.lastName}, ${student.firstName}`, 14, 45);
            doc.text(`Matrícula: ${student.matricula || "N/A"}`, 14, 52);
            doc.text(`Grupo: ${course.name}`, 14, 59); // Contextual group
            doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 59);

            // Prepare data for table
            const tableData: any[] = [];

            // Group grades by course
            const courseGrades = new Map<string, any[]>();
            student.grades.forEach(grade => {
                if (!courseGrades.has(grade.courseId)) {
                    courseGrades.set(grade.courseId, []);
                }
                courseGrades.get(grade.courseId)?.push(grade);
            });

            student.enrollments.forEach(enrollment => {
                const sCourse = enrollment.course;
                const grades = courseGrades.get(sCourse.id) || [];

                const periods = ["PARTIAL_1", "PARTIAL_2", "PARTIAL_3", "FINAL"];
                const periodAverages: { [key: string]: number | string } = {};

                periods.forEach(period => {
                    const pGrades = grades.filter(g => g.period === period);
                    if (pGrades.length === 0) {
                        periodAverages[period] = "-";
                        return;
                    }

                    let pTotal = 0;
                    pGrades.forEach(g => {
                        const w = g.weight || 0;
                        pTotal += g.value * (w / 100);
                    });

                    periodAverages[period] = pTotal.toFixed(1);
                });

                let finalAvg: number | string = "-";
                const p1 = parseFloat(periodAverages["PARTIAL_1"] as string);
                const p2 = parseFloat(periodAverages["PARTIAL_2"] as string);
                const p3 = parseFloat(periodAverages["PARTIAL_3"] as string);

                if (!isNaN(p1) && !isNaN(p2) && !isNaN(p3)) {
                    finalAvg = ((p1 + p2 + p3) / 3).toFixed(1);
                }

                tableData.push([
                    sCourse.name,
                    sCourse.teacher?.name || "N/A",
                    periodAverages["PARTIAL_1"],
                    periodAverages["PARTIAL_2"],
                    periodAverages["PARTIAL_3"],
                    periodAverages["FINAL"],
                    finalAvg
                ]);
            });

            autoTable(doc, {
                startY: 70,
                head: [["Materia", "Profesor", "Parcial 1", "Parcial 2", "Parcial 3", "Final", "Promedio"]],
                body: tableData,
                theme: "grid",
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                styles: { fontSize: 10, cellPadding: 4 },
            });

            // Footer
            const pageCount = doc.getNumberOfPages();
            doc.setFontSize(10);
            doc.text(`Página ${pageCount}`, 190, 280, { align: "right" });
        }

        const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

        return new NextResponse(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="boletas_${course.name.replace(/\s+/g, "_")}.pdf"`,
            },
        });

    } catch (error) {
        console.error("[BULK_REPORT_CARDS_PDF]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
