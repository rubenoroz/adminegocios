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
        const { studentId, courseId, period, type, value, maxValue, weight } = body;

        if (!studentId || !courseId || !period || !type || value === undefined) {
            return NextResponse.json({ error: "MISSING_FIELDS", message: "Faltan campos requeridos" }, { status: 400 });
        }

        const numericValue = parseFloat(value);
        if (isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
            return NextResponse.json({ error: "INVALID_VALUE", message: "La calificación debe estar entre 0 y 100" }, { status: 400 });
        }

        // Generate default name if missing (Required by Schema)
        const generatedName = body.name || `${type} - ${period}`;

        const grade = await prisma.grade.upsert({
            where: {
                studentId_courseId_period_type: {
                    studentId,
                    courseId,
                    period,
                    type,
                },
            },
            update: {
                value: parseFloat(value),
                maxValue: maxValue ? parseFloat(maxValue) : 100,
                weight: weight ? parseFloat(weight) : null,
                name: generatedName, // Update name just in case
            },
            create: {
                studentId,
                courseId,
                period,
                type,
                value: parseFloat(value),
                maxValue: maxValue ? parseFloat(maxValue) : 100,
                weight: weight ? parseFloat(weight) : null,
                name: generatedName,
            },
        });

        return NextResponse.json(grade);
    } catch (error) {
        console.error("[GRADES_POST]", error);
        return NextResponse.json({ error: "INTERNAL_ERROR", message: "Error al registrar calificación" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "UNAUTHORIZED", message: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get("studentId");
        const courseId = searchParams.get("courseId");
        const period = searchParams.get("period");

        const where: any = {};
        if (studentId) where.studentId = studentId;
        if (courseId) where.courseId = courseId;
        if (period) where.period = period;

        const grades = await prisma.grade.findMany({
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
            orderBy: [
                { period: "asc" },
                { type: "asc" },
            ],
        });

        return NextResponse.json(grades);
    } catch (error) {
        console.error("[GRADES_GET]", error);
        return NextResponse.json({ error: "INTERNAL_ERROR", message: "Error al obtener calificaciones" }, { status: 500 });
    }
}
