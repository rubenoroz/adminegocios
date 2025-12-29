import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

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

        // Fetch all schedules for the business
        const schedules = await prisma.classSchedule.findMany({
            where: { businessId },
            include: {
                course: true,
                teacher: true
            }
        });

        // Create workbook
        const wb = XLSX.utils.book_new();
        const wsData: any[][] = [];

        // Headers: Time vs Days/Rooms
        // For simplicity, we'll create a matrix of Time vs Days (Monday-Saturday)
        // This mimics the structure of "HORARIOS 2021.xlsx" which had times in rows and days/rooms in columns

        const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        const times = [];
        for (let h = 7; h <= 21; h++) {
            times.push(`${h.toString().padStart(2, '0')}:00`);
        }

        // Header Row
        wsData.push(["Horario", ...days]);

        // Fill grid
        times.forEach(time => {
            const row = [time];
            days.forEach((_, dayIndex) => {
                // Find class at this time and day (dayIndex + 1 because 0 is Sunday in DB)
                const dayValue = dayIndex + 1;
                const classAtTime = schedules.find((s: any) =>
                    s.dayOfWeek === dayValue &&
                    s.startTime <= time &&
                    s.endTime > time
                );

                if (classAtTime) {
                    row.push(`${classAtTime.course.name}\n${classAtTime.room || ''}`);
                } else {
                    row.push("");
                }
            });
            wsData.push(row);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Set column widths
        ws['!cols'] = [{ wch: 10 }, ...days.map(() => ({ wch: 30 }))];

        XLSX.utils.book_append_sheet(wb, ws, "Horarios");

        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

        return new NextResponse(buf, {
            headers: {
                "Content-Disposition": 'attachment; filename="Horarios_Generados.xlsx"',
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
        });
    } catch (error) {
        console.error("[EXPORT_SCHEDULES]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
