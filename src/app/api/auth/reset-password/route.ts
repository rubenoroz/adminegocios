import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return new NextResponse("Token and password are required", { status: 400 });
        }

        // Validate password length
        if (password.length < 6) {
            return new NextResponse("Password must be at least 6 characters", { status: 400 });
        }

        // Find valid token
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token }
        });

        if (!resetToken || resetToken.used) {
            return new NextResponse("Invalid or expired token", { status: 400 });
        }

        // Check if token is expired
        if (new Date() > resetToken.expires) {
            return new NextResponse("Token has expired", { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user password
        await prisma.user.update({
            where: { email: resetToken.email },
            data: { password: hashedPassword }
        });

        // Mark token as used
        await prisma.passwordResetToken.update({
            where: { token },
            data: { used: true }
        });

        return NextResponse.json({
            message: "Password reset successful"
        });
    } catch (error) {
        console.error("[RESET_PASSWORD]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
