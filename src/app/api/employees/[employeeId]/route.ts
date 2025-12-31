import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrementResourceCount } from "@/lib/plan-limits";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ employeeId: string }> }
) {
    const session = await getServerSession(authOptions);
    const { employeeId } = await params;

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

        const employee = await prisma.employee.findFirst({
            where: {
                id: employeeId,
                businessId: user.businessId
            },
            include: {
                branch: true
            }
        });

        if (!employee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        return NextResponse.json(employee);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ employeeId: string }> }
) {
    const session = await getServerSession(authOptions);
    const { employeeId } = await params;

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { firstName, lastName, email, phone, role, paymentModel, salary, hourlyRate, commissionPercentage, reservePercentage, branchId } = body;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // Verify employee belongs to user's business
        const existingEmployee = await prisma.employee.findFirst({
            where: {
                id: employeeId,
                businessId: user.businessId
            }
        });

        if (!existingEmployee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        // Validate branch if provided
        if (branchId) {
            const branch = await prisma.branch.findFirst({
                where: { id: branchId, businessId: user.businessId }
            });
            if (!branch) {
                return NextResponse.json({ error: "Invalid branch" }, { status: 400 });
            }
        }

        const employee = await prisma.employee.update({
            where: { id: employeeId },
            data: {
                ...(firstName !== undefined && { firstName }),
                ...(lastName !== undefined && { lastName }),
                ...(email !== undefined && { email }),
                ...(phone !== undefined && { phone }),
                ...(role !== undefined && { role }),
                ...(paymentModel !== undefined && { paymentModel }),
                ...(salary !== undefined && { salary: salary ? parseFloat(salary) : null }),
                ...(hourlyRate !== undefined && { hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null }),
                ...(commissionPercentage !== undefined && { commissionPercentage: commissionPercentage ? parseFloat(commissionPercentage) : null }),
                ...(reservePercentage !== undefined && { reservePercentage: reservePercentage ? parseFloat(reservePercentage) : null }),
                ...(branchId !== undefined && { branchId: branchId || null })
            },
            include: {
                branch: true
            }
        });

        return NextResponse.json(employee);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ employeeId: string }> }
) {
    const session = await getServerSession(authOptions);
    const { employeeId } = await params;

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

        // Verify employee belongs to user's business
        const existingEmployee = await prisma.employee.findFirst({
            where: {
                id: employeeId,
                businessId: user.businessId
            }
        });

        if (!existingEmployee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        // PROTECCIÓN: No permitir eliminar empleados con rol OWNER
        if (existingEmployee.role === "OWNER") {
            // Solo Super Admin de la plataforma puede eliminar owners
            if (user.role !== "SUPERADMIN") {
                return NextResponse.json({
                    error: "No puedes eliminar a un propietario del negocio. Solo un administrador de la plataforma puede hacerlo."
                }, { status: 403 });
            }
        }

        // PROTECCIÓN: No permitir que un usuario se elimine a sí mismo si tiene empleado vinculado
        const linkedUser = await prisma.user.findFirst({
            where: {
                email: existingEmployee.email,
                businessId: user.businessId
            }
        });

        if (linkedUser && linkedUser.id === user.id) {
            return NextResponse.json({
                error: "No puedes eliminarte a ti mismo de la lista de empleados."
            }, { status: 403 });
        }

        // PROTECCIÓN: No permitir eliminar admins a menos que seas owner o super admin
        if (existingEmployee.role === "ADMIN" && linkedUser) {
            if (user.role !== "OWNER" && user.role !== "SUPERADMIN") {
                return NextResponse.json({
                    error: "Solo el propietario del negocio puede eliminar administradores con cuenta de acceso."
                }, { status: 403 });
            }
        }

        await prisma.employee.delete({
            where: { id: employeeId }
        });

        return NextResponse.json({ success: true, message: "Employee deleted" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
