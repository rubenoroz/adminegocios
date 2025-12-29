import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

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
            where: { id: courseId },
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
                                email: true,
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

        // Prepare Excel data
        const worksheetData: (string | number)[][] = [
            [course.business.name],
            [`Lista de Asistencia - ${course.name}`],
            [`Profesor: ${course.teacher?.name || "Sin asignar"}`],
            [`Horario: ${course.schedule || "No definido"}`],
            [`Salón: ${course.room || "No asignado"}`],
            [`Total de alumnos: ${course.enrollments.length}`],
            [], // Empty row
            ["#", "Apellido", "Nombre", "Matrícula", "Email", "Fecha 1", "Fecha 2", "Fecha 3", "Fecha 4", "Fecha 5"],
        ];

        // Add student rows
        course.enrollments.forEach((enrollment, index) => {
            worksheetData.push([
                index + 1,
                enrollment.student.lastName,
                enrollment.student.firstName,
                enrollment.student.matricula || "",
                enrollment.student.email || "",
                "", // Fecha 1
                "", // Fecha 2
                "", // Fecha 3
                "", // Fecha 4
                "", // Fecha 5
            ]);
        });

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // Set column widths
        worksheet["!cols"] = [
            { wch: 5 },  // #
            { wch: 20 }, // Apellido
            { wch: 20 }, // Nombre
            { wch: 15 }, // Matrícula
            { wch: 25 }, // Email
            { wch: 12 }, // Fecha 1
            { wch: 12 }, // Fecha 2
            { wch: 12 }, // Fecha 3
            { wch: 12 }, // Fecha 4
            { wch: 12 }, // Fecha 5
        ];

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, "Lista de Asistencia");

        // Generate Excel buffer
        const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        return new NextResponse(excelBuffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="lista_${course.name.replace(/\s+/g, "_")}.xlsx"`,
            },
        });
    } catch (error) {
        console.error("[COURSE_EXCEL_EXPORT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
