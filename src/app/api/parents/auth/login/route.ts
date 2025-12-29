import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return new NextResponse("Email and password required", { status: 400 });
        }

        // Find parent account
        const parent = await prisma.parentAccount.findUnique({
            where: { email },
            include: {
                students: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                matricula: true
                            }
                        }
                    }
                }
            }
        });

        if (!parent) {
            return new NextResponse("Invalid credentials", { status: 401 });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, parent.password);
        if (!isValid) {
            return new NextResponse("Invalid credentials", { status: 401 });
        }

        // Update last login
        await prisma.parentAccount.update({
            where: { id: parent.id },
            data: { lastLogin: new Date() }
        });

        // Create JWT token
        const token = sign(
            {
                id: parent.id,
                email: parent.email,
                type: "parent"
            },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        return NextResponse.json({
            token,
            parent: {
                id: parent.id,
                firstName: parent.firstName,
                lastName: parent.lastName,
                email: parent.email,
                mustChangePassword: parent.mustChangePassword,
                students: parent.students
            }
        });
    } catch (error) {
        console.error("[PARENT_LOGIN]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
