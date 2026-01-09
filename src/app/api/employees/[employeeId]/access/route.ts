import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ employeeId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { employeeId } = await params;
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId }
        });

        if (!employee) {
            return new NextResponse("Employee not found", { status: 404 });
        }

        if (!employee.email) {
            return NextResponse.json(
                { message: "El empleado debe tener un email para crearle acceso." },
                { status: 400 }
            );
        }

        const body = await req.json().catch(() => ({}));
        const { reset } = body;

        // Check if user already exists
        let user = await prisma.user.findUnique({
            where: { email: employee.email }
        });

        const tempPassword = "Cambiar123!"; // Or generate random
        let isNewUser = false;
        let passwordReset = false;

        if (!user) {
            // Create New User
            const hashedPassword = await hash(tempPassword, 10);

            // Map Employee Role to User Role
            // TEACHER -> TEACHER, ADMIN -> ADMIN, etc.
            // If mapping fails, default to STAFF or USER
            let userRole = "USER";
            if (employee.role === "ADMIN") userRole = "ADMIN";
            else if (employee.role === "TEACHER") userRole = "TEACHER";
            else if (employee.role === "MANAGER") userRole = "MANAGER";
            else if (employee.role === "RECEPTIONIST") userRole = "RECEPTIONIST";

            user = await prisma.user.create({
                data: {
                    name: `${employee.firstName} ${employee.lastName}`,
                    email: employee.email,
                    password: hashedPassword,
                    role: userRole,
                    businessId: employee.businessId,
                }
            });
            isNewUser = true;
        } else if (reset) {
            // Reset existing user password
            const hashedPassword = await hash(tempPassword, 10);
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
            });
            passwordReset = true;
        }

        // Link Employee to User if not linked
        if (!employee.userId || employee.userId !== user.id) {
            await prisma.employee.update({
                where: { id: employee.id },
                data: { userId: user.id }
            });
        }

        return NextResponse.json({
            success: true,
            isNewUser,
            passwordReset,
            tempPassword: (isNewUser || passwordReset) ? tempPassword : null,
            message: isNewUser
                ? "Cuenta creada exitosamente."
                : passwordReset
                    ? "Contraseña restablecida exitosamente."
                    : "Se vinculó a una cuenta de usuario existente."
        });

    } catch (error) {
        console.error("[EMPLOYEE_ACCESS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
