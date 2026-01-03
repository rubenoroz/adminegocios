import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-11-17.clover" as any, // Cast to any to avoid strict type mismatch if types are outdated
});

export async function POST(req: Request) {
    try {
        const { planId, email, userId } = await req.json();

        if (!planId || !email || !userId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const plan = await prisma.plan.findUnique({
            where: { id: planId }
        });

        if (!plan) {
            return new NextResponse("Plan not found", { status: 404 });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "mxn",
                        product_data: {
                            name: plan.name,
                            description: plan.description || undefined,
                        },
                        unit_amount: Math.round(plan.price * 100),
                        recurring: {
                            interval: plan.interval === 'yearly' ? 'year' : 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: `${req.headers.get("origin")}/dashboard?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.get("origin")}/register?canceled=true`,
            customer_email: email,
            metadata: {
                userId,
                planId,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error("[CHECKOUT_SESSION] Error details:", error);
        if (error instanceof Stripe.errors.StripeError) {
            return new NextResponse(`Stripe Error: ${error.message}`, { status: 500 });
        }
        return new NextResponse(`Internal Error: ${error instanceof Error ? error.message : "Unknown"}`, { status: 500 });
    }
}
