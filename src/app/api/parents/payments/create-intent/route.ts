import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { verify } from "jsonwebtoken";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-11-17.clover", // Use latest API version
});

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

export async function POST(req: Request) {
    try {
        const { feeId, amount } = await req.json();
        const token = req.headers.get("Authorization")?.split(" ")[1];

        if (!token) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Verify token
        let decoded: any;
        try {
            decoded = verify(token, JWT_SECRET);
        } catch (error) {
            return new NextResponse("Invalid token", { status: 401 });
        }

        // Get fee details
        const fee = await prisma.studentFee.findUnique({
            where: { id: feeId },
            include: {
                student: {
                    include: {
                        business: true
                    }
                }
            }
        });

        if (!fee) {
            return new NextResponse("Fee not found", { status: 404 });
        }

        // Create PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe expects cents
            currency: "mxn",
            metadata: {
                feeId: fee.id,
                studentId: fee.studentId,
                businessId: fee.student.businessId,
                parentId: decoded.id
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        console.error("[PAYMENT_INTENT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
