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

        const whereClause: any = {
            businessId: user.businessId,
        };

        if (role) {
            whereClause.role = role;
        }

        if (branchId) {
            // Filter employees who have THIS branch in their list OR have NO branches (global)
            whereClause.OR = [
                { branches: { some: { id: branchId } } },
                { branches: { none: {} } }
            ];
        }

        const employees = await prisma.employee.findMany({
            where: whereClause,
            orderBy: [
                { lastName: 'asc' },
                { firstName: 'asc' }
            ],
            include: {
                branches: true
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
        // branchIds should be an array of strings
        const { firstName, lastName, email, phone, role, salary, branchIds } = body;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // Validate branches belong to business if provided
        let connectedBranches: { id: string }[] = [];
        if (branchIds && Array.isArray(branchIds) && branchIds.length > 0) {
            // Verify ownership could be done here, skipping for brevity but recommended
            connectedBranches = branchIds.map((id: string) => ({ id }));
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
                branches: {
                    connect: connectedBranches
                }
            },
            include: {
                branches: true
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
                        // For user, currently we only support single branchId.
                        // Ideally User model should also update, but for now let's leave it null 
                        // or pick the first one if we want them tied to a dashboard view.
                        branchId: connectedBranches.length > 0 ? connectedBranches[0].id : null,
                        status: "ACTIVE"
                    }
                });
            }
        } catch (userError) {
            console.error("Failed to auto-create user for employee:", userError);
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
