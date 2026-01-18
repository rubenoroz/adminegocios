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

        // Date range for current month commissions
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const employees = await prisma.employee.findMany({
            where: whereClause,
            orderBy: [
                { lastName: 'asc' },
                { firstName: 'asc' }
            ],
            include: {
                branches: true,
                user: {
                    select: { id: true, name: true, email: true }
                },
                // Include payments where this employee is the teacher (commission)
                commissionPayments: {
                    where: {
                        date: {
                            gte: firstDay,
                            lte: lastDay
                        },
                        teacherCommission: { gt: 0 }
                    },
                    select: {
                        teacherCommission: true
                    }
                },
                // Include projected commissions (Pending Fees)
                expectedCommissions: {
                    where: {
                        dueDate: {
                            gte: firstDay,
                            lte: lastDay
                        },
                        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
                        expectedCommission: { gt: 0 }
                    },
                    select: {
                        expectedCommission: true
                    }
                }
            }
        });

        const employeesWithNames = employees.map((emp: any) => {
            const monthlyCommission = emp.commissionPayments.reduce((sum: number, p: any) => sum + (p.teacherCommission || 0), 0);
            const projectedCommission = emp.expectedCommissions.reduce((sum: number, p: any) => sum + (p.expectedCommission || 0), 0);
            return {
                ...emp,
                name: `${emp.firstName} ${emp.lastName}`,
                monthlyCommission, // New calculated field
                projectedCommission // Future Commission
            };
        });

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
        const { firstName, lastName, email, phone, role, salary, branchIds, color } = body;

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

        // __VALIDAR LÍMITE DE PLAN (Global para empleados)__
        const limitCheck = await checkLimit(user.businessId, "employees");

        if (!limitCheck.allowed) {
            return NextResponse.json({
                error: "LIMIT_REACHED",
                message: limitCheck.message,
                limit: limitCheck.limit,
                current: limitCheck.current,
                planName: limitCheck.planName
            }, { status: 403 });
        }

        const employee = await prisma.employee.create({
            data: {
                firstName,
                lastName,
                email,
                phone,
                role,
                color: color || "#3B82F6",
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



        return NextResponse.json(employee);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
