import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkLimit, incrementResourceCount, decrementResourceCount } from "@/lib/plan-limits";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // Get branchId and role from query params
        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get("branchId");
        const role = searchParams.get("role");

        const employees = await prisma.employee.findMany({
            where: {
                businessId: user.businessId,
                ...(role ? { role } : {}),
                // Si se especifica branchId, incluir empleados de esa sucursal O empleados globales (sin sucursal)
                ...(branchId ? {
                    OR: [
                        { branchId },
                        { branchId: null } // Empleados globales aparecen en todas las sucursales
                    ]
                } : {})
            },
            orderBy: {
                lastName: 'asc'
            },
            include: {
                branch: true
            }
        });

        const employeesWithNames = employees.map(emp => ({
            ...emp,
            name: `${emp.firstName} ${emp.lastName}`
        }));

        return NextResponse.json(employeesWithNames);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { firstName, lastName, email, phone, role, salary, branchId } = body;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // Validate branch belongs to business if provided
        if (branchId) {
            const branch = await prisma.branch.findFirst({
                where: { id: branchId, businessId: user.businessId }
            });
            if (!branch) {
                return NextResponse.json({ error: "Invalid branch" }, { status: 400 });
            }
        }

        // VALIDAR LÍMITE DE PLAN (solo para maestros)
        if (role === "TEACHER") {
            const limitCheck = await checkLimit(user.businessId, "teachers");

            if (!limitCheck.allowed) {
                return NextResponse.json({
                    error: "LIMIT_REACHED",
                    message: limitCheck.message,
                    limit: limitCheck.limit,
                    current: limitCheck.current,
                    planName: limitCheck.planName
                }, { status: 403 });
            }
        }

        const employee = await prisma.employee.create({
            data: {
                firstName,
                lastName,
                email,
                phone,
                role,
                salary: salary ? parseFloat(salary) : null,
                businessId: user.businessId,
                branchId: branchId || null
            }
        });

        // Auto-create User account for the employee
        try {
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({ where: { email } });

            if (!existingUser) {
                const hashedPassword = await import("bcryptjs").then(bcrypt => bcrypt.hash("password123", 10));

                await prisma.user.create({
                    data: {
                        name: `${firstName} ${lastName}`,
                        email,
                        password: hashedPassword,
                        role: role === "TEACHER" ? "TEACHER" : "RECEPTIONIST", // Default mapping
                        businessId: user.businessId,
                        branchId: branchId || null,
                        status: "ACTIVE"
                    }
                });
            }
        } catch (userError) {
            console.error("Failed to auto-create user for employee:", userError);
            // Continue execution, don't fail the request just because user creation failed
        }

        // Incrementar contador si es maestro
        if (role === "TEACHER") {
            await incrementResourceCount(user.businessId, "teachers");
        }

        return NextResponse.json(employee);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
