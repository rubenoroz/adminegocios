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
        const { firstName, lastName, email, phone, role, paymentModel, salary, hourlyRate, commissionPercentage, reservePercentage, branchId, branchIds } = body;

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

        // Build update data
        const updateData: any = {};
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (role !== undefined) updateData.role = role;
        if (paymentModel !== undefined) updateData.paymentModel = paymentModel;
        if (salary !== undefined) updateData.salary = salary ? parseFloat(salary) : null;
        if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate ? parseFloat(hourlyRate) : null;
        if (commissionPercentage !== undefined) updateData.commissionPercentage = commissionPercentage ? parseFloat(commissionPercentage) : null;
        if (reservePercentage !== undefined) updateData.reservePercentage = reservePercentage ? parseFloat(reservePercentage) : null;

        // Handle legacy single branchId (backwards compatibility)
        if (branchId !== undefined) {
            updateData.branchId = branchId || null;
        }

        // Handle multi-branch (many-to-many)
        if (branchIds !== undefined) {
            updateData.branches = {
                set: branchIds.map((id: string) => ({ id }))
            };
        }

        const employee = await prisma.employee.update({
            where: { id: employeeId },
            data: updateData,
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
