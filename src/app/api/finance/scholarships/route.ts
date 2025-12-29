import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get("studentId");

        const where = studentId ? { studentId } : {};

        const scholarships = await prisma.scholarship.findMany({
            where,
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
                student: { lastName: "asc" },
            },
        });

        return NextResponse.json(scholarships);
    } catch (error) {
        console.error("[SCHOLARSHIPS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, percentage, amount, studentId, active } = body;

        if (!name || !studentId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const scholarship = await prisma.scholarship.create({
            data: {
                name,
                percentage: percentage ? parseFloat(percentage) : null,
                amount: amount ? parseFloat(amount) : null,
                studentId,
                active: active !== undefined ? active : true,
            },
            include: {
                student: {
                    select: {
                        firstName: true,
                        lastName: true,
                        matricula: true,
                    },
                },
            },
        });

        return NextResponse.json(scholarship);
    } catch (error) {
        console.error("[SCHOLARSHIPS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
