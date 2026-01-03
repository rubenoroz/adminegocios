import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkLimit, incrementResourceCount } from "@/lib/plan-limits";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        // Get branchId from query params
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const branchId = searchParams.get("branchId");
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = parseInt(searchParams.get("offset") || "0");

        const where: any = {
            businessId: user?.businessId // Ensure scoped to business
        };

        if (search) {
            where.OR = [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { matricula: { contains: search } },
                { email: { contains: search } }
            ];
        }

        if (branchId) {
            // Filter students who have THIS branch in their list OR have NO branches (global)
            where.AND = [
                {
                    OR: [
                        { branches: { some: { id: branchId } } },
                        { branches: { none: {} } }
                    ]
                }
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
                },
                branches: true
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
        // branchIds should be an array of strings
        const { firstName, lastName, matricula, email, phone, businessId, branchIds } = body;

        if (!firstName || !lastName || !matricula || !businessId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // VALIDAR LÍMITE DE PLAN
        const limitCheck = await checkLimit(businessId, "students");

        if (!limitCheck.allowed) {
            return NextResponse.json({
                error: "LIMIT_REACHED",
                message: limitCheck.message,
                limit: limitCheck.limit,
                current: limitCheck.current,
                planName: limitCheck.planName
            }, { status: 403 });
        }

        // Validate branches belong to business if provided
        let connectedBranches: { id: string }[] = [];
        if (branchIds && Array.isArray(branchIds) && branchIds.length > 0) {
            connectedBranches = branchIds.map((id: string) => ({ id }));
        }

        const student = await prisma.student.create({
            data: {
                firstName,
                lastName,
                matricula,
                email,
                phone,
                businessId,
                branches: {
                    connect: connectedBranches
                }
            },
            include: {
                branches: true
            }
        });

        // Incrementar contador
        await incrementResourceCount(businessId, "students");

        return NextResponse.json(student);
    } catch (error) {
        console.error("[STUDENTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
