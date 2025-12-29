import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verify } from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

export async function POST(req: Request) {
    try {
        const { token, newPassword } = await req.json();

        if (!token || !newPassword) {
            return new NextResponse("Token and new password required", { status: 400 });
        }

        if (newPassword.length < 6) {
            return new NextResponse("Password must be at least 6 characters", { status: 400 });
        }

        // Verify JWT token
        let decoded: any;
        try {
            decoded = verify(token, JWT_SECRET);
        } catch (error) {
            return new NextResponse("Invalid token", { status: 401 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear mustChangePassword flag
        await prisma.parentAccount.update({
            where: { id: decoded.id },
            data: {
                password: hashedPassword,
                mustChangePassword: false
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[PARENT_CHANGE_PASSWORD]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
