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
        const search = searchParams.get("search") || "";
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = parseInt(searchParams.get("offset") || "0");

        const where: any = {};

        if (search) {
            where.OR = [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { matricula: { contains: search } },
            ];
        }

        const students = await prisma.student.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: { lastName: "asc" },
            include: {
                enrollments: {
                    include: {
                        course: true
                    }
                }
            }
        });

        return NextResponse.json(students);
    } catch (error) {
        console.error("[STUDENTS_GET]", error);
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
        const { firstName, lastName, matricula, email, phone, businessId } = body;

        if (!firstName || !lastName || !matricula || !businessId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const student = await prisma.student.create({
            data: {
                firstName,
                lastName,
                matricula,
                email,
                phone,
                businessId,
            },
        });

        return NextResponse.json(student);
    } catch (error) {
        console.error("[STUDENTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
