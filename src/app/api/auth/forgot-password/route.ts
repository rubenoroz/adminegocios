import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return new NextResponse("Email is required", { status: 400 });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            // Don't reveal if user exists or not for security
            return NextResponse.json({
                message: "Si el correo existe, recibirás un enlace de recuperación"
            });
        }

        // Generate reset token
        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 3600000); // 1 hour

        // Delete any existing tokens for this email
        await prisma.passwordResetToken.deleteMany({
            where: { email }
        });

        // Create new reset token
        await prisma.passwordResetToken.create({
            data: {
                email,
                token,
                expires
            }
        });

        // In production, send email here
        // For now, we'll just return the token (remove this in production!)
        const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

        console.log("Password reset URL:", resetUrl);

        // TODO: Send email with resetUrl
        // await sendEmail({
        //     to: email,
        //     subject: "Recuperar contraseña",
        //     html: `Click here to reset your password: ${resetUrl}`
        // });

        return NextResponse.json({
            message: "Si el correo existe, recibirás un enlace de recuperación",
            // Remove this in production:
            resetUrl
        });
    } catch (error) {
        console.error("[FORGOT_PASSWORD]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
