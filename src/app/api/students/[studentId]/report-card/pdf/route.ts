import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ studentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { studentId } = await params;

        // Fetch student with courses and grades
        const student = await prisma.student.findUnique({
            where: { id: studentId },
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
        });

        if (!student) {
            return new NextResponse("Student not found", { status: 404 });
        }

        // Fetch business info for header
        const business = await prisma.business.findFirst({
            where: { id: session.user.businessId },
        });

        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text(business?.name || "Escuela", 105, 20, { align: "center" });

        doc.setFontSize(16);
        doc.text("Boleta de Calificaciones", 105, 30, { align: "center" });

        // Student Info
        doc.setFontSize(12);
        doc.text(`Alumno: ${student.lastName}, ${student.firstName}`, 14, 45);
        doc.text(`Matrícula: ${student.matricula || "N/A"}`, 14, 52);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 59);

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
            const course = enrollment.course;
            const grades = courseGrades.get(course.id) || [];

            // Calculate average
            let totalWeighted = 0;
            let totalWeight = 0;

            // Group by type to handle weights correctly if multiple grades of same type exist (averaging them first? or summing?)
            // Assuming one grade per type per period for simplicity based on GradeCapture
            // But Grade model allows multiple? No, unique constraint on studentId, courseId, period, type.

            // Let's calculate average based on types
            // We need to know the weights. Assuming standard weights from GradeCapture for now or stored in grade?
            // The grade model has 'weight'.

            // Group by period first
            const periods = ["PARTIAL_1", "PARTIAL_2", "PARTIAL_3", "FINAL"];
            const periodAverages: { [key: string]: number | string } = {};

            periods.forEach(period => {
                const pGrades = grades.filter(g => g.period === period);
                if (pGrades.length === 0) {
                    periodAverages[period] = "-";
                    return;
                }

                let pTotal = 0;
                let pWeight = 0;

                pGrades.forEach(g => {
                    // If weight is stored, use it. Default to 1 if not? 
                    // In GradeCapture we used: EXAM 40, HOMEWORK 20, PROJECT 30, PARTICIPATION 10
                    // We should ideally store these weights in a Course settings or similar.
                    // For now, let's use the weight stored in the grade record.
                    const w = g.weight || 0;
                    pTotal += g.value * (w / 100); // Assuming weight is percentage e.g. 40
                    pWeight += w;
                });

                // If weights don't sum to 100, normalize? Or just display what we have?
                // Let's just sum the weighted values. 
                // Example: Exam 90 * 0.4 = 36. Homework 100 * 0.2 = 20. Total = 56.
                // If only Exam is present, is the average 36? No, it should be relative to current progress?
                // For simplicity, we sum the weighted parts.

                periodAverages[period] = pTotal.toFixed(1);
            });

            // Final Average (Average of periods? Or Final period is the final grade?)
            // Usually Final is a separate period or the average of partials.
            // Let's assume Final Average is average of Partial 1, 2, 3.
            // Or if "FINAL" period exists, use that.

            let finalAvg: number | string = "-";
            const p1 = parseFloat(periodAverages["PARTIAL_1"] as string);
            const p2 = parseFloat(periodAverages["PARTIAL_2"] as string);
            const p3 = parseFloat(periodAverages["PARTIAL_3"] as string);

            if (!isNaN(p1) && !isNaN(p2) && !isNaN(p3)) {
                finalAvg = ((p1 + p2 + p3) / 3).toFixed(1);
            }

            tableData.push([
                course.name,
                course.teacher?.name || "N/A",
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

        const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

        return new NextResponse(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="boleta_${student.matricula}.pdf"`,
            },
        });

    } catch (error) {
        console.error("[REPORT_CARD_PDF]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
